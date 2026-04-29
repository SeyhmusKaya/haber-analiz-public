# Medya İzle (haber-analiz)

> Multi-perspective Turkish news platform — read perspectives, not just news
> "Haberi değil, bakış açısını oku" — aynı haberi farklı yayın çizgilerinden gösteren AI destekli haber platformu

[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)](https://nextjs.org)
[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel)](https://laravel.com)
[![Flutter](https://img.shields.io/badge/Flutter-3+-02569B?logo=flutter)](https://flutter.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=google)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🇹🇷 Türkçe

**Medya İzle**, 100+ Türk ve uluslararası haber kaynağını RSS ile toplayan, aynı olayı farklı yayın çizgilerinden (iktidar / muhalefet / merkez) sunan ve Gemini AI ile **çoklu bakış açısı özetleri** üreten haber analiz platformudur.

Tagline: **"Haberi değil, bakış açısını oku."**

### Ne Çözüyor?
Türkiye'de aynı haber, kaynağa göre tamamen farklı sunulur. Kullanıcı 5-10 farklı siteyi tek tek gezmek yerine, tek bir ekranda **"bu olayı taraf-A nasıl yazdı, taraf-B nasıl yazdı"** karşılaştırmasını görür. AI hem özet üretir hem de yayın çizgilerinin ne kadar farklı çerçevelediğini ölçer.

### Özellikler
- 🌐 **100+ kaynak** — Türk + uluslararası medyadan RSS
- 🧬 **Story clustering** — aynı olayı farklı kaynaklardan otomatik gruplama (Gemini embeddings + pgvector)
- ⚖️ **Çoklu bakış açısı** — pro-iktidar / muhalefet / nötr çerçeveleme karşılaştırması
- 🔥 **Önem skoru** — AI ile haber önceliği
- 🗳 **Okuyucu oylama** — taraflılık değerlendirmesi
- 📡 **SSE bildirim** — son dakika için real-time push
- 🔍 **Fact-checking entegrasyonu**
- 🌍 **Jeopolitik gerilim takibi**
- 📊 **Propaganda skoru radar grafiği**
- 💰 **Abonelik sistemi** — aylık 79 TL / yıllık 639 TL
- 📱 **Flutter mobil** — iOS + Android wrapper

## 🇬🇧 English

**Medya İzle** is a Turkish news analysis platform that aggregates 100+ domestic and international sources via RSS, **clusters the same story across publishers**, and uses Google Gemini to produce **multi-perspective summaries** showing how pro-government, opposition, and neutral outlets framed the same event.

Tagline: **"Read perspectives, not just news."**

### Problem
In Turkey, the same news event is reported very differently depending on the publisher's editorial line. Instead of users browsing 5–10 sites individually, this platform shows side-by-side: "here's how side A wrote this story, here's how side B wrote it." AI generates both the summaries and a measure of how different the framings are.

### Features
- 100+ Turkish + international sources aggregated via RSS
- Automatic story clustering across publishers (Gemini embeddings + pgvector)
- Multi-perspective framing comparison (pro-gov / opposition / neutral)
- AI-powered importance scoring
- Reader bias voting
- Server-Sent Events for breaking-news push notifications
- Fact-checking integration
- Geopolitical tension tracking
- Propaganda score radar chart
- Subscription system (79 TRY/month, 639 TRY/year)
- Flutter mobile wrapper for iOS + Android

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router) · React 19 · TypeScript · TailwindCSS 4 · Radix UI |
| **Backend** | Laravel 12 · PHP 8.2+ · Eloquent · Sanctum · Socialite (OAuth) |
| **AI / ML** | Google Gemini API (embeddings + text generation) |
| **Database** | PostgreSQL 16 + pgvector (production) / MySQL (dev) |
| **Cache / Queue** | Redis 7 · Laravel Scheduler |
| **Mobile** | Flutter (Android + iOS WebView wrapper) |
| **Scraping** | Guzzle HTTP, RSS parsers, full-text extraction |
| **Clustering** | Python service for story deduplication |
| **Testing** | PHPUnit · Mockery · Jest |

---

## 📂 Repository Structure

```
haber_analiz/
├── backend/         Laravel 12 REST API + RSS scraper + Gemini integration
│   ├── app/
│   │   ├── Http/Controllers/    contents, votes, events, chat
│   │   ├── Services/            GeminiService, RssService, ClusteringService
│   │   └── Models/
│   └── routes/api.php
├── frontend/        Next.js 16 web app
│   ├── app/                       App Router pages
│   ├── components/                React UI
│   └── lib/                       API client, utils
├── mobile_app/      Flutter mobile wrapper (Android + iOS)
└── CLAUDE.md        Architecture documentation
```

---

## 🚀 Setup / Kurulum

### Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Configure DB + GEMINI_API_KEY in .env
# Get a Gemini key: https://aistudio.google.com/apikey

php artisan migrate --seed
php artisan serve
php artisan content:sync   # RSS sync (scheduled in production)
```

### Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

### Mobile (Flutter)

```bash
cd mobile_app
flutter pub get
flutter run
```

> **Note:** `mobile_app/android/app/google-services.json` is gitignored. Add your own Firebase config file from the Firebase console.

### Environment Variables

```env
# Backend (.env)
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=haberanaliz
DB_USERNAME=haberanaliz
DB_PASSWORD=<your-strong-password>

GEMINI_API_KEY=
REDIS_URL=redis://localhost:6379
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://medyaizle.com

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🔗 Production

Domain: [medyaizle.com](https://medyaizle.com)

---

## 📜 License

[MIT](LICENSE) © 2026 Şeyhmus Kaya

---

## 👤 Author

**Şeyhmus Kaya** — Full-Stack Developer
[github.com/SeyhmusKaya](https://github.com/SeyhmusKaya) · seyhkaya21@gmail.com
