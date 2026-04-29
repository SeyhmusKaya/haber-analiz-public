package com.verodika.medyaizle

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private var firstLoadDone = false

    companion object {
        private const val BASE_URL = "https://medyaizle.com"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-edge + status bar
        WindowCompat.setDecorFitsSystemWindows(window, true)
        window.statusBarColor = Color.parseColor("#0a0a0a")
        window.navigationBarColor = Color.parseColor("#0a0a0a")
        window.setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        )

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

        // Firebase init + token
        FirebaseApp.initializeApp(this)
        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            val prefs = getSharedPreferences("fcm", MODE_PRIVATE)
            val saved = prefs.getString("token", null)
            if (saved != token) {
                prefs.edit().putString("token", token).apply()
            }
        }

        configureWebView()
        handleIntent(intent)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        webView.setBackgroundColor(Color.parseColor("#0a0a0a"))

        // window.MedyaIzleApp → Next.js SSE/AudioPlayer'ı devre dışı bırakmak için kullanır
        // addJavascriptInterface sayfa yüklenmeden önce enjekte edilir (timing sorunu yok)
        webView.addJavascriptInterface(object : Any() {}, "MedyaIzleApp")

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            // Cihazın kendi UA'sını kullan (Google güvenlik bildirimi için gerçek cihaz adı görünsün)
            // Sadece varsa özel suffix'i temizle
            val defaultUA = userAgentString
            userAgentString = defaultUA.replace(Regex("""\s*MedyaIzleApp/[\d.]+"""), "")

            // Cache: agresif
            cacheMode = WebSettings.LOAD_DEFAULT
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false

            // Rendering performans
            setRenderPriority(WebSettings.RenderPriority.HIGH)
            blockNetworkImage = false
            loadsImagesAutomatically = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

            // Viewport
            useWideViewPort = true
            loadWithOverviewMode = true

            // Smooth scroll
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                safeBrowsingEnabled = false
            }

            // Modern web features
            mediaPlaybackRequiresUserGesture = true
            allowContentAccess = true
            allowFileAccess = false
        }

        // Hardware acceleration on WebView level
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        // Cookie desteği
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        // WebViewClient: sayfa içi navigasyonu yakala
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                if (!firstLoadDone) {
                    progressBar.visibility = View.VISIBLE
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                progressBar.visibility = View.GONE
                firstLoadDone = true
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                // Kendi sitemiz → WebView'da aç
                if (url.startsWith(BASE_URL) || url.contains("medyaizle.com")) {
                    return false
                }
                // Google OAuth akışı → WebView'da aç (Chrome'a yönlendirme!)
                if (url.contains("accounts.google.com") ||
                    url.contains("oauth2.googleapis.com") ||
                    url.contains("googleapis.com/oauth2")) {
                    return false
                }
                // Diğer dış linkler → tarayıcıda aç
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                return true
            }
        }

        webView.webChromeClient = WebChromeClient()

        webView.loadUrl(BASE_URL)
    }

    // Push bildirimden gelen intent'i işle
    private fun handleIntent(intent: Intent?) {
        val eventId = intent?.getStringExtra("event_id")
        if (eventId != null) {
            webView.loadUrl("$BASE_URL/haber/$eventId")
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    @Deprecated("Use onBackPressedDispatcher")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
