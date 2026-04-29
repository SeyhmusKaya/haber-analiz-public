<?php
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Cron Takvimi - Bellek Optimizasyonu
|--------------------------------------------------------------------------
|
| Pipeline (saatte 2 kez): fetch → embed → cluster → analyze → classify → notify/images
|
| Dakika dağılımı (her tur arası 8+ dk boşluk):
|   :00/:30  fetch        (hafif)
|   :05/:35  embed        (orta)
|   :13/:43  cluster      (AĞIR - numpy, 8 dk boşluk)
|   :21/:51  analyze      (orta - Gemini, 8 dk boşluk)
|   :26/:56  classify     (hafif - Gemini, 5 dk boşluk)
|   :28/:58  notify       (hafif)
|   :29/:59  images       (hafif)
|   :10/:40  health       (çok hafif, sakin dönemde)
|   :40      fulltext     (orta, saatte 1, cycle dışında)
|
*/

// ==========================================
// ANA PİPELİNE - Saatte 2 kez
// ==========================================

// 1) RSS çek - :00 ve :30
Schedule::command('haber:fetch')
    ->cron('0,30 * * * *')
    ->withoutOverlapping()
    ->runInBackground();

// 2) Embedding - fetch'ten 5 dk sonra
Schedule::command('haber:embed')
    ->cron('5,35 * * * *')
    ->withoutOverlapping()
    ->runInBackground();

// 3) Cluster - embed'den 8 dk sonra (AĞIR - numpy bellek yoğun)
Schedule::command('haber:cluster')
    ->cron('13,43 * * * *')
    ->withoutOverlapping()
    ->runInBackground();

// 4) Analyze - cluster'dan 8 dk sonra
Schedule::command('haber:analyze --limit=200')
    ->cron('21,51 * * * *')
    ->withoutOverlapping()
    ->runInBackground();

// 5) Türkiye sınıflandırması - analyze'dan 5 dk sonra
Schedule::command('haber:classify-turkey --limit=20')
    ->cron('26,56 * * * *')
    ->withoutOverlapping()
    ->runInBackground();

// 5b) Ülke sınıflandırması - classify-turkey'den 1 dk sonra
Schedule::command('haber:classify-countries --limit=20')
    ->cron('27,57 * * * *')
    ->withoutOverlapping()
    ->runInBackground();

// 6) FCM bildirimi - pipeline sonunda
Schedule::command('haber:notify')
    ->cron('28,58 * * * *')
    ->withoutOverlapping()
    ->runInBackground();

// 7) Resimler - saatte 2 kez, pipeline en sonunda
Schedule::command('haber:images --limit=500')
    ->cron('29,59 * * * *')
    ->withoutOverlapping()
    ->runInBackground();

// ==========================================
// BAĞIMSIZ GÖREVLER
// ==========================================

// 8) Full-text scraping - saatte 1, iki cycle arasına denk gelir (:40 sakin dönem)
Schedule::command('haber:fulltext --limit=100')
    ->cron('40 * * * *')
    ->withoutOverlapping()
    ->runInBackground();

// 9) Sağlık kontrolü - her 30 dk, sakin dönemde (:10 ve :40)
// --fix KULLANILMIYOR: senkron çalışır, withoutOverlapping kilitlerini atlar
Schedule::command('haber:health')
    ->cron('10,40 * * * *')
    ->withoutOverlapping()
    ->runInBackground();

// 10) Haftalık rapor - her Pazartesi 09:00
Schedule::command('haber:generate-report weekly')
    ->weeklyOn(1, '09:00')
    ->withoutOverlapping();

// 11) Aylık rapor - her ayın 1'i 09:00
Schedule::command('haber:generate-report monthly')
    ->monthlyOn(1, '09:00')
    ->withoutOverlapping();

// 12) Haftalık bülten - her Pazartesi 10:00
Schedule::command('haber:newsletter --type=weekly')
    ->weeklyOn(1, '10:00')
    ->withoutOverlapping();

// 13) Aylık bülten - her ayın 1'i 10:00
Schedule::command('haber:newsletter --type=monthly')
    ->monthlyOn(1, '10:00')
    ->withoutOverlapping();

// 14) Eski rapor temizliği - her gün 03:00
Schedule::command('haber:prune-reports')
    ->dailyAt('03:00')
    ->withoutOverlapping();

// 15) Jeopolitik gerilim hesaplama - günde bir, sabah 06:00
Schedule::command('haber:calculate-tensions')
    ->dailyAt('06:00')
    ->withoutOverlapping()
    ->runInBackground();
