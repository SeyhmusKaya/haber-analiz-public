import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String _apiUrl = 'https://medyaizle.com';

// Uygulama arka planda/kapalıyken gelen bildirimleri yakala
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

final FlutterLocalNotificationsPlugin _localNotifications =
    FlutterLocalNotificationsPlugin();

const AndroidNotificationChannel _channel = AndroidNotificationChannel(
  'medyaizle_haberler',
  'Medya İzle Haberler',
  description: 'Yeni haber bildirimleri',
  importance: Importance.high,
);

Future<void> _initLocalNotifications() async {
  await _localNotifications
      .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(_channel);

  await _localNotifications.initialize(
    const InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    ),
  );
}

void _showLocalNotification(RemoteMessage message) {
  final notification = message.notification;
  if (notification == null) return;

  _localNotifications.show(
    notification.hashCode,
    notification.title,
    notification.body,
    NotificationDetails(
      android: AndroidNotificationDetails(
        _channel.id,
        _channel.name,
        channelDescription: _channel.description,
        importance: Importance.high,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
      ),
    ),
  );
}

Future<void> _registerToken(String token) async {
  final prefs = await SharedPreferences.getInstance();
  final savedToken = prefs.getString('fcm_token');
  if (savedToken == token) return;

  try {
    await http.post(
      Uri.parse('$_apiUrl/api/fcm/register'),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({'token': token, 'platform': 'android'}),
    );
    await prefs.setString('fcm_token', token);
  } catch (_) {}
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  await _initLocalNotifications();

  await FirebaseMessaging.instance.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );

  final token = await FirebaseMessaging.instance.getToken();
  if (token != null) await _registerToken(token);

  FirebaseMessaging.instance.onTokenRefresh.listen(_registerToken);
  FirebaseMessaging.onMessage.listen(_showLocalNotification);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Medya İzle',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
      ),
      home: const WebViewPage(),
    );
  }
}

class WebViewPage extends StatefulWidget {
  const WebViewPage({super.key});

  @override
  State<WebViewPage> createState() => _WebViewPageState();
}

class _WebViewPageState extends State<WebViewPage> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _firstLoadDone = false;

  // Scroll performansını artıran CSS + JS
  static const String _performanceJs = '''
    (function() {
      if (window.__perfApplied) return;
      window.__perfApplied = true;
      var s = document.createElement('style');
      s.textContent = `
        * { -webkit-overflow-scrolling: touch !important; }
        body { overflow-y: scroll; }
        img:not([loading]) { loading: lazy; }
      `;
      document.head.appendChild(s);

      document.querySelectorAll('img:not([loading])').forEach(function(img) {
        img.setAttribute('loading', 'lazy');
      });
    })();
  ''';

  @override
  void initState() {
    super.initState();

    late final PlatformWebViewControllerCreationParams params;
    if (Platform.isAndroid) {
      params = AndroidWebViewControllerCreationParams();
    } else {
      params = const PlatformWebViewControllerCreationParams();
    }

    _controller = WebViewController.fromPlatformCreationParams(params)
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      // Temiz Chrome Mobile UA — Google OAuth WebView kısıtlamasını aşar
      // WebView tespiti UA yerine addJavaScriptChannel ile yapılır
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 '
        '(KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
      )
      // window.MedyaIzleApp objesi sayfa yüklenmeden önce enjekte edilir.
      // Next.js bileşenleri bunu SSE ve SpeechSynthesis'i kapatmak için kullanır.
      ..addJavaScriptChannel(
        'MedyaIzleApp',
        onMessageReceived: (_) {},
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            if (!_firstLoadDone) {
              setState(() => _isLoading = true);
            }
          },
          onPageFinished: (url) {
            setState(() {
              _isLoading = false;
              _firstLoadDone = true;
            });
            _controller.runJavaScript(_performanceJs);
          },
          onWebResourceError: (error) => setState(() => _isLoading = false),
        ),
      )
      ..enableZoom(false)
      ..setBackgroundColor(const Color(0xFF0f0f0f))
      ..loadRequest(Uri.parse('https://medyaizle.com'));

    // Android-specific: Surface rendering modu (Hybrid Composition yerine)
    if (Platform.isAndroid) {
      final androidController =
          _controller.platform as AndroidWebViewController;
      androidController.setMediaPlaybackRequiresUserGesture(true);
    }

    // Bildirime tıklanınca ilgili habere git
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      final eventId = message.data['event_id'];
      if (eventId != null) {
        _controller.loadRequest(
          Uri.parse('https://medyaizle.com/haber/$eventId'),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        if (await _controller.canGoBack()) {
          await _controller.goBack();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0f0f0f),
        body: SafeArea(
          child: Stack(
            children: [
              if (Platform.isAndroid)
                WebViewWidget.fromPlatformCreationParams(
                  params: AndroidWebViewWidgetCreationParams(
                    controller: _controller.platform,
                    displayWithHybridComposition: false,
                  ),
                )
              else
                WebViewWidget(controller: _controller),
              if (_isLoading)
                const Center(
                  child: CircularProgressIndicator(color: Color(0xFF2563EB)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
