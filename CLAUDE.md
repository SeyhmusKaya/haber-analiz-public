# Haber Analiz - Proje Planı

## Proje Konsepti

Türkçe haber sitesi. Kullanıcı ana sayfada haberleri görür, bir habere tıkladığında sayfanın altında ülke bayrakları çıkar. Kullanıcı bir ülkeye tıkladığında o ülkenin **yandaş** ve **muhalif** medyasının o haberi nasıl yorumladığını Türkçe özet olarak görür.

**Tagline:** *"Haberi değil, bakış açısını oku"*

**Dil:** Tüm site Türkçe. Çeviri yok. Gemini API ile Türkçe özet üretilir.

---

## Teknik Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14 (App Router) |
| Backend | Laravel 11 (PHP) |
| Scraping | Guzzle HTTP + feedparser |
| Embedding | Gemini Embedding API (`gemini-embedding-001`) |
| AI Analiz | Gemini API (`gemini-2.5-flash`) |
| Veritabanı | PostgreSQL (production) / MySQL (lokal dev) |
| Cache | Redis |
| Cron | Laravel Scheduler (Artisan Commands) |
| Mobil Uygulama | Flutter (WebView) |
| Production URL | medyaizle.com |
| Mobil Paket Adı | com.verodika.medyaizle |

---

## Environment Variables

```env
# Backend (.env)
# Lokal (MySQL)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=haberanaliz
DB_USERNAME=root
DB_PASSWORD=

# Production (PostgreSQL)
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=haberanaliz
DB_USERNAME=haberanaliz
DB_PASSWORD=<your-strong-password>
REDIS_URL=redis://localhost:6379
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://medyaizle.com

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**NOT:** Gemini API key `.env` dosyasında tutulmaz. Admin panelden (`/admin/ai-ayarlari`) girilir ve `admin_settings` tablosunda saklanır. Bu sayede key değişikliği için deploy gerekmez.

---

## Klasör Yapısı

```
haber_analiz/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, Header/Footer
│   │   ├── page.tsx                # Ana sayfa - dashboard (slider, harita, güncel, popüler)
│   │   ├── haber/
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Haber detay sayfası
│   │   │       └── karsilastir/
│   │   │           └── page.tsx    # Karşılaştırma modu (split-screen)
│   │   ├── arama/
│   │   │   └── page.tsx            # Arama sayfası (detaylı filtreler, wildcard, doğal dil)
│   │   ├── giris/
│   │   │   └── page.tsx            # Giriş sayfası
│   │   ├── kayit/
│   │   │   └── page.tsx            # Kayıt sayfası
│   │   ├── profil/
│   │   │   ├── page.tsx            # Profil bilgileri
│   │   │   ├── ayarlar/page.tsx    # Bildirim ayarları
│   │   │   ├── kataloglar/page.tsx # Kataloglarım
│   │   │   ├── bulten/page.tsx     # Bülten ayarları
│   │   │   └── bildirimler/page.tsx # Bildirimler
│   │   ├── admin/
│   │   │   └── bulten/page.tsx     # Admin bülten/SMTP ayarları
│   │   ├── raporlar/
│   │   │   ├── page.tsx            # Haftalık/aylık rapor arşivi
│   │   │   └── [id]/page.tsx       # Rapor detay
│   │   ├── kaynaklar/
│   │   │   ├── page.tsx            # Tüm kaynaklar listesi
│   │   │   └── [slug]/page.tsx     # Kaynak profil sayfası
│   │   ├── arsiv/
│   │   │   └── page.tsx            # Zaman makinesi / arşiv modu
│   │   ├── konsensus/
│   │   │   └── page.tsx            # Okuyucu konsensüs istatistikleri
│   │   ├── medya-okuryazarligi/
│   │   │   ├── page.tsx            # Ana sayfa
│   │   │   ├── propaganda/page.tsx
│   │   │   ├── yanlilik/page.tsx
│   │   │   ├── dogrulama/page.tsx
│   │   │   └── dezenformasyon/page.tsx
│   │   ├── api-docs/
│   │   │   └── page.tsx            # Public API dokümantasyonu
│   │   ├── embed-olusturucu/
│   │   │   └── page.tsx            # Widget oluşturucu
│   │   ├── embed/
│   │   │   └── event/[id]/page.tsx # Gömülü widget içeriği
│   │   ├── kullanim-kosullari/page.tsx
│   │   ├── gizlilik/page.tsx       # KVKK / Gizlilik Politikası
│   │   ├── cerez-politikasi/page.tsx
│   │   ├── hakkimizda/page.tsx
│   │   ├── iletisim/page.tsx
│   │   ├── sitemap.ts              # SEO - otomatik sitemap
│   │   ├── robots.ts               # SEO - robots.txt
│   │   └── globals.css
│   ├── components/
│   │   ├── Header.tsx              # Logo + navigasyon + arama + bildirim + kullanıcı
│   │   ├── Footer.tsx              # 4 sütunlu footer + yasal linkler
│   │   ├── NewsCard.tsx            # Ana sayfadaki haber kartı
│   │   ├── NewsList.tsx            # Haber kartları grid'i
│   │   ├── HeroSlider.tsx          # Manşet slider (en önemli 5 haber)
│   │   ├── NewsTicker.tsx          # Son haberler kayan bant
│   │   ├── PopularNews.tsx         # Popüler haberler bölümü
│   │   ├── CategorySection.tsx     # Kategori bazlı bölümler
│   │   ├── LiveUpdates.tsx         # Canlı gelişmeler sidebar
│   │   ├── StatsBand.tsx           # İstatistik bandı
│   │   ├── WorldMap.tsx            # İnteraktif dünya haritası (ana sayfa)
│   │   ├── MiniWorldMap.tsx        # Mini harita (haber detay)
│   │   ├── CountrySelector.tsx     # Bayrak butonları satırı
│   │   ├── AnalysisCard.tsx        # Yandaş/muhalif/konsensüs kartı
│   │   ├── PropagandaScore.tsx     # Propaganda/yanlışma skoru kartı
│   │   ├── RadarChart.tsx          # Radar grafik (propaganda metrikleri)
│   │   ├── RhetoricBadge.tsx       # Retorik teknik etiketleri
│   │   ├── NarrativeTimeline.tsx   # Anlatı takipçisi timeline
│   │   ├── TimelineNode.tsx        # Timeline düğümü
│   │   ├── SilenceCard.tsx         # Suskunluk tespiti kartı
│   │   ├── CoverageBarChart.tsx    # Ülke kapsam bar chart
│   │   ├── WordCloud.tsx           # Kelime bulutu
│   │   ├── WordCloudComparison.tsx # Kelime bulutu karşılaştırma
│   │   ├── TensionBarometer.tsx    # Jeopolitik gerilim barometresi
│   │   ├── TensionHeatMap.tsx      # Gerilim ısı haritası
│   │   ├── TensionTrendChart.tsx   # Gerilim trend çizgisi
│   │   ├── ComparisonMode.tsx      # Karşılaştırma modu (split-screen)
│   │   ├── ComparisonColumn.tsx    # Karşılaştırma sütunu
│   │   ├── ReportCard.tsx          # Rapor kartı
│   │   ├── SourceCard.tsx          # Kaynak güvenilirlik kartı
│   │   ├── SourceTrendChart.tsx    # Kaynak trend grafiği
│   │   ├── DatePicker.tsx          # Arşiv tarih seçici
│   │   ├── OnThisDay.tsx           # "Tarihte Bugün" widget
│   │   ├── ReaderVote.tsx          # Okuyucu oylama
│   │   ├── VoteResults.tsx         # Oylama sonuçları
│   │   ├── LiveUpdateBanner.tsx    # Canlı güncelleme bildirimi
│   │   ├── BreakingNewsBanner.tsx  # Son dakika banner
│   │   ├── FactCheckBadge.tsx      # Fact-check etiketi
│   │   ├── FactCheckSection.tsx    # Fact-check bölümü
│   │   ├── LiteracyTip.tsx         # Medya okuryazarlığı ipucu
│   │   ├── CategoryFilter.tsx      # Kategori filtreleri
│   │   ├── ThemeToggle.tsx         # Açık/koyu tema butonu
│   │   ├── LoadingSpinner.tsx
│   │   ├── ActionSidebar.tsx       # Sol kenar yuvarlak butonlar
│   │   ├── AIChatPanel.tsx         # AI Asistan slayt paneli
│   │   ├── QuestionModal.tsx       # Soru sor modal (3 AI sorusu)
│   │   ├── AudioPlayer.tsx         # Sesli dinleme player
│   │   ├── CommentSection.tsx      # Yorum alanı
│   │   ├── CommentItem.tsx         # Tek yorum kartı (nested)
│   │   ├── CommentForm.tsx         # Yorum yazma formu
│   │   ├── SearchFilters.tsx       # Arama filtreleri
│   │   ├── RelatedNews.tsx         # İlginizi çekebilecek haberler
│   │   ├── BookmarkButton.tsx      # Kataloga kaydet butonu
│   │   ├── CatalogPicker.tsx       # Katalog seçme dropdown
│   │   ├── NotificationBell.tsx    # Header bildirim ikonu
│   │   ├── NotificationDropdown.tsx # Bildirim dropdown
│   │   ├── NewsletterForm.tsx      # Bülten abone formu
│   │   ├── AdBanner.tsx            # Reklam alanı placeholder
│   │   └── CookieBanner.tsx        # Çerez onay banner
│   ├── hooks/
│   │   ├── useSpeechSynthesis.ts   # Text-to-speech hook
│   │   └── useSSE.ts               # Server-Sent Events hook
│   ├── lib/
│   │   ├── api.ts                  # Backend API çağrıları
│   │   ├── utils.ts                # Yardımcı fonksiyonlar
│   │   ├── auth.ts                 # Auth context/provider
│   │   ├── adsConfig.ts            # Reklam pozisyonları config
│   │   └── mapData.ts              # Dünya haritası ülke verileri
│   ├── types/
│   │   └── index.ts                # TypeScript tipleri
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── main.py                     # FastAPI app, CORS, router kayıtları
│   ├── routers/
│   │   ├── events.py               # Events CRUD, search, popular, related, archive
│   │   ├── analysis.py             # Ülke analizi + karşılaştırma
│   │   ├── auth.py                 # Kayıt, giriş, çıkış
│   │   ├── user.py                 # Profil güncelleme, avatar, şifre
│   │   ├── comments.py             # Yorum CRUD + like/dislike
│   │   ├── chat.py                 # AI chatbot endpoint
│   │   ├── catalogs.py             # Katalog CRUD
│   │   ├── notifications.py        # Bildirim listeleme/yönetim
│   │   ├── newsletter.py           # Bülten abone/ayarlar
│   │   ├── admin.py                # Admin SMTP ayarları, bülten yönetimi
│   │   ├── narrative.py            # Anlatı takipçisi endpoint'leri
│   │   ├── tensions.py             # Jeopolitik gerilim endeksi
│   │   ├── reports.py              # Haftalık/aylık raporlar
│   │   ├── sources.py              # Kaynak profil sayfaları
│   │   ├── votes.py                # Okuyucu konsensüs oylama
│   │   ├── factcheck.py            # Fact-check entegrasyonu
│   │   ├── stream.py               # SSE canlı güncelleme
│   │   └── public_api.py           # Public API (rate limited)
│   ├── services/
│   │   ├── scraper.py              # RSS çekme servisi
│   │   ├── full_text_scraper.py    # Tam metin scraping
│   │   ├── translator.py           # Gemini ile çeviri
│   │   ├── embeddings.py           # Gemini embedding üretimi
│   │   ├── clustering.py           # Haber cluster'lama
│   │   ├── gemini.py               # Gemini analiz servisi (propaganda, kelime, soru)
│   │   ├── auth.py                 # JWT token işlemleri
│   │   ├── email.py                # SMTP email gönderim servisi
│   │   ├── notification.py         # Bildirim oluşturma servisi
│   │   ├── narrative.py            # Anlatı takibi analiz servisi
│   │   ├── silence_detector.py     # Suskunluk tespit servisi
│   │   ├── tension_calculator.py   # Gerilim endeksi hesaplama
│   │   ├── report_generator.py     # AI rapor üretimi
│   │   ├── fact_checker.py         # Fact-check API entegrasyonu
│   │   └── event_publisher.py      # SSE event yayınlama
│   ├── middleware/
│   │   └── rate_limiter.py         # Public API rate limiting
│   ├── models/
│   │   ├── database.py             # SQLAlchemy setup
│   │   └── schemas.py              # Pydantic modeller
│   ├── cron/
│   │   ├── scheduler.py            # APScheduler - her 2 saatte RSS çek
│   │   ├── newsletter_scheduler.py # Bülten cron job
│   │   ├── tension_cron.py         # Gerilim endeksi güncelleme (6 saatte bir)
│   │   └── report_cron.py          # Haftalık/aylık rapor üretimi
│   ├── config/
│   │   └── prompts.py              # Tüm Gemini prompt'ları merkezi yönetim
│   ├── data/
│   │   └── sources.py              # 100 kaynak listesi (RSS URL'leri ile)
│   ├── requirements.txt
│   └── .env
│
├── mobile_app/                 # Flutter WebView uygulaması
│   ├── lib/
│   │   └── main.dart           # WebView → medyaizle.com
│   ├── android/                # Android config (com.verodika.medyaizle)
│   ├── ios/                    # iOS config
│   └── pubspec.yaml
│
├── CLAUDE.md
└── PROMPTS.md
```

---

## Veritabanı Şeması

```sql
-- Production: PostgreSQL / Lokal: MySQL
-- pgvector extension (production'da aktif)
CREATE EXTENSION IF NOT EXISTS vector;

-- Haber kaynakları
CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    url VARCHAR(255) NOT NULL,
    rss_url VARCHAR(255) NOT NULL,
    country_code CHAR(2) NOT NULL,       -- TR, US, GB, DE, RU, CN, IR, IL, SA, EG
    bias VARCHAR(20) NOT NULL,            -- 'pro_gov' | 'opposition'
    language VARCHAR(10) NOT NULL,        -- en, tr, de, ru, zh, ar, fa, he
    owner VARCHAR(255),                  -- Sahiplik bilgisi
    funding_type VARCHAR(50),            -- state, private, foundation, ad-supported
    founded_year INTEGER,
    description TEXT,
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true
);

-- Kaynak günlük istatistikleri
CREATE TABLE source_daily_stats (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES sources(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    article_count INTEGER DEFAULT 0,
    avg_propaganda_score FLOAT,
    avg_sentiment FLOAT,
    agreement_ratio FLOAT,
    UNIQUE(source_id, date)
);

-- Ham makaleler
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES sources(id),
    title TEXT NOT NULL,
    summary TEXT,
    full_text TEXT,                       -- Tam metin (scraping ile)
    full_text_tr TEXT,                    -- Türkçe çeviri
    language_detected VARCHAR(10),
    scrape_status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed
    url VARCHAR(500) UNIQUE NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    embedding vector(768)                 -- Gemini text-embedding-004 (pgvector, production'da)
);

-- Olay cluster'ları
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title_tr TEXT NOT NULL,               -- Türkçe başlık (Gemini üretimi)
    summary_tr TEXT,                      -- Yapay Zeka Özeti (Gemini üretimi)
    category VARCHAR(50),                 -- siyaset, ekonomi, savas-catisma, vs.
    importance_score SMALLINT DEFAULT 5,  -- 1-10
    ai_questions JSON,                   -- [{question, answer}] AI üretimi sorular
    related_countries TEXT[],             -- Haberin ilgili olduğu ülke kodları
    view_count INTEGER DEFAULT 0,        -- Görüntülenme sayısı
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cluster - makale ilişkisi
CREATE TABLE event_articles (
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, article_id)
);

-- Analiz cache
CREATE TABLE analyses (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    country_code CHAR(2) NOT NULL,
    pro_gov_summary TEXT,
    opposition_summary TEXT,
    consensus TEXT,
    propaganda_scores JSON,             -- {pro_gov: {propaganda, emotion, factual, diversity, rhetoric[]}, opposition: {...}}
    word_frequencies JSON,              -- [{word, count, sentiment}]
    silence_analysis TEXT,               -- Suskunluk varsa neden analizi
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
    UNIQUE(event_id, country_code)
);

-- Kullanıcılar
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false
);

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yorumlar
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);

CREATE TABLE comment_votes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL,       -- 'like' | 'dislike'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Kataloglar
CREATE TABLE catalogs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE catalog_events (
    catalog_id INTEGER REFERENCES catalogs(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (catalog_id, event_id)
);

-- Bildirimler
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,            -- new_article, comment_reply, comment_like
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_notification_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    new_article BOOLEAN DEFAULT true,
    comment_reply BOOLEAN DEFAULT true,
    comment_like BOOLEAN DEFAULT true,
    newsletter BOOLEAN DEFAULT true,
    filter_countries TEXT[],
    filter_categories TEXT[],
    min_importance INTEGER DEFAULT 5,
    push_enabled BOOLEAN DEFAULT false
);

-- Bülten
CREATE TABLE newsletter_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    frequency VARCHAR(20) DEFAULT 'weekly',
    categories TEXT[],
    countries TEXT[],
    min_importance INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribe_token VARCHAR(255) UNIQUE
);

CREATE TABLE newsletter_logs (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES newsletter_subscriptions(id),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    event_count INTEGER,
    status VARCHAR(20)                    -- sent, failed, bounced
);

-- Admin ayarları (SMTP vs.)
CREATE TABLE admin_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anlatı takipçisi (Narrative Tracker)
CREATE TABLE narrative_timeline (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    country_code CHAR(2) NOT NULL,
    date DATE NOT NULL,
    narrative_summary TEXT,
    sentiment_score FLOAT,               -- -1 ile +1 arası
    divergence_score FLOAT,              -- Diğer ülkelerden farklılık 0-1
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, country_code, date)
);

-- Jeopolitik gerilim endeksi
CREATE TABLE geopolitical_tensions (
    id SERIAL PRIMARY KEY,
    country_a CHAR(2) NOT NULL,
    country_b CHAR(2) NOT NULL,
    tension_score FLOAT NOT NULL,        -- 0 (barış) ile 10 (kriz) arası
    sentiment_avg FLOAT,
    article_count INTEGER,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_a, country_b, calculated_at::date)
);

-- Okuyucu konsensüs oylama
CREATE TABLE reader_votes (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    country_code CHAR(2) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vote VARCHAR(30) NOT NULL,           -- 'pro_gov', 'opposition', 'both_biased', 'undecided'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, country_code, user_id)
);

-- Haftalık/aylık raporlar
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,           -- 'weekly' | 'monthly'
    title VARCHAR(255) NOT NULL,
    content JSON NOT NULL,
    html_content TEXT,
    pdf_url VARCHAR(500),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fact-check sonuçları
CREATE TABLE fact_checks (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    claim TEXT NOT NULL,
    source VARCHAR(100),                 -- teyit.org, snopes, politifact
    rating VARCHAR(50),                  -- true, false, half-true, unverified
    source_url VARCHAR(500),
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public API anahtarları
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    key VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(100),
    requests_today INTEGER DEFAULT 0,
    last_reset DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_source ON articles(source_id);
CREATE INDEX idx_articles_scrape_status ON articles(scrape_status);
CREATE INDEX idx_events_created ON events(created_at DESC);
CREATE INDEX idx_events_importance ON events(importance_score DESC);
CREATE INDEX idx_events_view_count ON events(view_count DESC);
CREATE INDEX idx_analyses_event_country ON analyses(event_id, country_code);
CREATE INDEX idx_comments_event ON comments(event_id, created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_catalogs_user ON catalogs(user_id);
CREATE INDEX idx_narrative_event ON narrative_timeline(event_id, date);
CREATE INDEX idx_tensions_countries ON geopolitical_tensions(country_a, country_b);
CREATE INDEX idx_reader_votes_event ON reader_votes(event_id, country_code);
CREATE INDEX idx_fact_checks_event ON fact_checks(event_id);
CREATE INDEX idx_source_stats ON source_daily_stats(source_id, date);

-- Full-text search indexleri (PostgreSQL GIN)
CREATE INDEX idx_articles_ft_title ON articles USING GIN(to_tsvector('simple', title));
CREATE INDEX idx_articles_ft_summary ON articles USING GIN(to_tsvector('simple', summary));
CREATE INDEX idx_articles_ft_fulltext_tr ON articles USING GIN(to_tsvector('simple', full_text_tr));
CREATE INDEX idx_events_ft_title_tr ON events USING GIN(to_tsvector('simple', title_tr));
CREATE INDEX idx_events_ft_summary_tr ON events USING GIN(to_tsvector('simple', summary_tr));

-- Ek performans indexleri
CREATE INDEX idx_articles_language ON articles(language_detected);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_cat_created ON events(category, created_at DESC);
CREATE INDEX idx_events_imp_created ON events(importance_score DESC, created_at DESC);
CREATE INDEX idx_sources_country ON sources(country_code);
CREATE INDEX idx_sources_country_bias ON sources(country_code, bias);
CREATE INDEX idx_sources_active ON sources(is_active);
```

---

## API Endpoint Listesi

### Events Router (`/api/events`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/events` | Ana sayfa haber listesi |
| GET | `/api/events?category=siyaset` | Kategoriye göre filtrele |
| GET | `/api/events?country=TR,US` | Ülkeye göre filtrele |
| GET | `/api/events?page=2` | Sayfalama (20 haber/sayfa) |
| GET | `/api/events/:id` | Tek haber detayı |
| GET | `/api/events/:id/countries` | Bu haberin hangi ülkelerde var olduğu |
| GET | `/api/events/popular` | Popüler haberler (görüntülenme/yorum sayısı) |
| GET | `/api/events/search` | Detaylı arama (wildcard, doğal dil, filtreler) |
| GET | `/api/events/:id/related` | Benzer haberler (embedding similarity) |

### Analysis Router (`/api/analysis`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/analysis/:event_id/:country_code` | Ülke analizi (cache'den veya Gemini'den) |

### Auth Router (`/api/auth`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Kayıt |
| POST | `/api/auth/login` | Giriş (JWT) |
| POST | `/api/auth/logout` | Çıkış |
| GET | `/api/auth/me` | Mevcut kullanıcı bilgileri |

### User Router (`/api/user`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| PUT | `/api/user/profile` | Profil güncelle |
| POST | `/api/user/avatar` | Avatar yükle |
| PUT | `/api/user/password` | Şifre değiştir |
| GET | `/api/user/newsletter` | Bülten ayarlarını getir |
| PUT | `/api/user/newsletter` | Bülten ayarlarını güncelle |
| GET | `/api/user/notification-settings` | Bildirim ayarları |
| PUT | `/api/user/notification-settings` | Bildirim ayarları güncelle |

### Comments Router (`/api/comments`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/events/:id/comments` | Yorumları listele |
| POST | `/api/events/:id/comments` | Yorum yaz |
| POST | `/api/comments/:id/vote` | Like/Dislike |
| DELETE | `/api/comments/:id` | Yorum sil |

### Chat Router (`/api/chat`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/chat` | AI chatbot (event_id + soru) |

### Catalogs Router (`/api/catalogs`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/catalogs` | Kullanıcının katalogları |
| POST | `/api/catalogs` | Yeni katalog oluştur |
| PUT | `/api/catalogs/:id` | Katalog düzenle |
| DELETE | `/api/catalogs/:id` | Katalog sil |
| POST | `/api/catalogs/:id/events/:event_id` | Haberi kataloga ekle |
| DELETE | `/api/catalogs/:id/events/:event_id` | Haberi katalogdan çıkar |
| GET | `/api/catalogs/:id/events` | Katalog içindeki haberler |

### Notifications Router (`/api/notifications`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/notifications` | Bildirimleri listele |
| PUT | `/api/notifications/:id/read` | Okundu işaretle |
| PUT | `/api/notifications/read-all` | Tümünü okundu işaretle |

### Newsletter Router (`/api/newsletter`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/newsletter/subscribe` | Bültene abone ol |
| GET | `/api/newsletter/unsubscribe/:token` | Abonelikten çık |

### Admin Router (`/api/admin`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/admin/smtp` | SMTP ayarlarını getir |
| PUT | `/api/admin/smtp` | SMTP ayarlarını güncelle |
| POST | `/api/admin/newsletter/test` | Test mail gönder |
| GET | `/api/admin/newsletter/subscribers` | Abone listesi |

### Narrative Router (`/api/narrative`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/narrative/:event_id` | Anlatı timeline (tüm ülkeler, günlere göre) |

### Tensions Router (`/api/tensions`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/tensions` | Güncel gerilim matrisi (tüm ülke çiftleri) |
| GET | `/api/tensions/:country_a/:country_b` | İki ülke arası gerilim trendi |
| GET | `/api/tensions/top` | En gergin 5 ilişki |

### Reports Router (`/api/reports`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/reports` | Rapor arşivi |
| GET | `/api/reports/:id` | Rapor detay |
| GET | `/api/reports/:id/pdf` | Rapor PDF indirme |

### Sources Router (`/api/sources`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/sources` | Tüm kaynaklar listesi |
| GET | `/api/sources/:slug` | Kaynak profil detayı |
| GET | `/api/sources/:slug/stats` | Kaynak günlük istatistikleri |

### Votes Router (`/api/votes`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/votes/:event_id/:country_code` | Oy ver |
| GET | `/api/votes/:event_id/:country_code` | Oylama sonuçları |
| GET | `/api/votes/stats` | Genel konsensüs istatistikleri |

### Fact-Check Router (`/api/factcheck`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/factcheck/:event_id` | Haberin fact-check sonuçları |

### Stream Router (`/api/stream`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/events/stream` | SSE - Canlı haber güncellemeleri |

### Public API Router (`/api/public`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/public/events` | Public haber listesi (rate limited) |
| GET | `/api/public/events/:id` | Public haber detay |
| GET | `/api/public/events/:id/analysis/:country` | Public analiz |
| GET | `/api/public/tensions` | Public gerilim endeksi |

### Archive Router (Events içinde)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/events?date=2025-03-20` | Belirli güne ait haberler |
| GET | `/api/events/on-this-day` | Geçmiş yıllarda bugünün haberleri |
| GET | `/api/stats/daily/:date` | O günün istatistikleri |

### Response Formatları

```typescript
// GET /api/events
{
  events: [
    {
      id: number,
      title_tr: string,
      summary_tr: string,
      category: string,
      importance_score: number,
      article_count: number,
      country_codes: string[],   // Bu haberin bulunduğu ülkeler
      created_at: string
    }
  ],
  total: number,
  page: number,
  per_page: 20
}

// GET /api/events/:id
{
  id: number,
  title_tr: string,
  summary_tr: string,
  category: string,
  importance_score: number,
  available_countries: [
    { code: "US", name: "ABD", flag: "🇺🇸", article_count: 8 }
  ],
  created_at: string
}

// GET /api/analysis/:event_id/:country_code
{
  event_id: number,
  country_code: string,
  country_name: string,
  pro_gov_summary: string,
  opposition_summary: string,
  consensus: string,
  pro_gov_sources: string[],    // Kaynak adları
  opposition_sources: string[], // Kaynak adları
  cached: boolean,
  created_at: string
}
```

---

## Sayfa Tasarımları

### 1. Ana Sayfa / Dashboard (`/`)

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
│ [Logo] HaberAnaliz  [Arama 🔍] [🌙 Tema] [🔔] [👤 Giriş]   │
├──────────────────────────────────────────────────────────────┤
│ [REKLAM ALANI - header altı leaderboard 728x90]              │
├──────────────────────────────────────────────────────────────┤
│ SON HABERLER BANDI (kayan ticker)                            │
│ ► Haber 1 başlığı • Haber 2 başlığı • Haber 3...  ◄        │
├──────────────────────────────────────────────────────────────┤
│ HERO SLİDER (En önemli 5 haber - otomatik geçiş 5sn)        │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Büyük resim overlay]                                    │ │
│ │ [Kategori] Haber Başlığı                                 │ │
│ │ Kısa özet metni...                                       │ │
│ │ ← [●○○○○] →                                             │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ İSTATİSTİK BANDI                                             │
│ 📊 Bugün 45 haber | 🌍 10 ülkeden | 📰 87 kaynak           │
├──────────────────────────────────────────────────────────────┤
│ KATEGORİ FİLTRELERİ + ÜLKE FİLTRESİ                        │
│ [Tümü] [Siyaset] [Ekonomi] [Savaş] [Diplomasi]...          │
│ [🇹🇷] [🇺🇸] [🇷🇺] [🇬🇧] [🇩🇪] [🇨🇳] [🇮🇷] [🇮🇱] [🇸🇦] [🇪🇬] │
├──────────────────────────────────────────────────────────────┤
│                                                    │ SIDEBAR │
│ GÜNCEL HABERLER (Son 24 saat)                     │         │
│ ┌────────┐ ┌────────┐ ┌────────┐                 │ POPÜLER │
│ │ Haber1 │ │ Haber2 │ │ Haber3 │                 │ 1. ...  │
│ └────────┘ └────────┘ └────────┘                 │ 2. ...  │
│ ┌────────┐ ┌────────┐ ┌────────┐                 │ 3. ...  │
│ │ Haber4 │ │ Haber5 │ │ Haber6 │                 │ 4. ...  │
│ └────────┘ └────────┘ └────────┘                 │ 5. ...  │
│                                                    │         │
│ [REKLAM - in-feed her 6 haberden sonra]           │ [REKLAM]│
│                                                    │ 300x250 │
│ KATEGORİ: SİYASET                                 │         │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ → (yatay scroll)    │ CANLI   │
│ └────┘ └────┘ └────┘ └────┘                       │ GELİŞME│
│                                                    │ • ...   │
│ KATEGORİ: EKONOMİ                                 │ • ...   │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ → (yatay scroll)    │ • ...   │
│ └────┘ └────┘ └────┘ └────┘                       │         │
│                                                    │ BÜLTEN  │
│                                                    │ [email] │
│                                                    │ [Abone] │
├──────────────────────────────────────────────────────────────┤
│ 🌍 DÜNYA HABERLER HARİTASI (İnteraktif)                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [SVG dünya haritası - ülkeler haber yoğunluğuna göre    │ │
│ │  renklendirilmiş heat map - tıklanabilir]               │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ 🔥 JEOPOLİTİK GERİLİM BAROMETRESİ                         │
│ ┌────────────────────────────────────┐ ┌──────────────────┐ │
│ │ [Isı haritası matrisi]            │ │ En Gergin:       │ │
│ │  TR US GB DE RU CN IR IL SA EG    │ │ 1. ABD-Çin 8.2  │ │
│ │  ■  ■  ■  ■  ■  ■  ■  ■  ■  ■   │ │ 2. RUS-GB 7.5   │ │
│ │  yeşil=barış kırmızı=gerilim      │ │ 3. İSR-İRAN 7.1 │ │
│ └────────────────────────────────────┘ └──────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ 📅 TARİHTE BUGÜN (1 yıl önce)                              │
│ Kısa haber başlığı 1 • Kısa haber başlığı 2               │
├──────────────────────────────────────────────────────────────┤
│ [Daha Fazla Yükle]                                          │
├──────────────────────────────────────────────────────────────┤
│ [REKLAM ALANI - footer üstü 728x90]                         │
├──────────────────────────────────────────────────────────────┤
│ FOOTER (4 sütun: Hakkımızda | Hızlı Linkler |               │
│         Kurumsal | Bülten)                                   │
│ © 2025 HaberAnaliz. Tüm hakları saklıdır.                  │
└──────────────────────────────────────────────────────────────┘
```

**Haber Kartı Detayı:**
- Sol üst köşe: kategori etiketi (renkli)
- Başlık: bold, 2 satırla sınırlı (text-overflow: ellipsis)
- Özet: 3 satırla sınırlı, gri renk
- Alt kısım: ülke bayrakları + kaynak sayısı + zaman + yorum sayısı + kaydet butonu

### 2. Haber Detay Sayfası (`/haber/[id]`)

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER  [🔔 Bildirim] [👤 Profil]                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──┐  [← Geri]                         [Kategori Etiketi]  │
│ │? │                                                         │
│ │🤖│  ## Haber Başlığı (büyük, bold)    [🔊 Dinle]          │
│ │🐦│                                                         │
│ │📘│  🕐 2 saat önce  •  12 kaynaktan derlendi              │
│ │💬│                                                         │
│ │📌│  ┌──────────────────────────────────────────────────┐  │
│ │🔗│  │ 🤖 Yapay Zeka Özeti                              │  │
│ │📎│  │ Gemini tarafından üretilmiş Türkçe özet...       │  │
│ │🖨│  └──────────────────────────────────────────────────┘  │
│ │🔖│                                                         │
│ └──┘  [REKLAM ALANI - in-article]                           │
│                                                              │
│       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                              │
│       🌍 Bu haberi dünya nasıl görüyor?                     │
│                                                              │
│       [🇺🇸 ABD] [🇷🇺 RUS] [🇬🇧 UK] [🇩🇪 DE]                │
│       [🇨🇳 ÇİN] [🇮🇷 İRAN] [🇮🇱 İSR] [🇸🇦 SUU]              │
│       [🇪🇬 MISIR] [🇹🇷 TR]                                  │
│                                                              │
│       ┌──────────────────────────────────────────────────┐  │
│       │ 🇺🇸 ABD Medyası                   [Yükleniyor]  │  │
│       │                                                  │  │
│       │ 📰 YANDAŞ MEDYA                                 │  │
│       │ Fox News, Breitbart, NY Post                     │  │
│       │ ────────────────────────────────────────────     │  │
│       │ [5-15 cümle Türkçe analiz metni...]              │  │
│       │                                                  │  │
│       │ 📰 MUHALİF MEDYA                                │  │
│       │ MSNBC, HuffPost, Mother Jones                    │  │
│       │ ────────────────────────────────────────────     │  │
│       │ [5-15 cümle Türkçe analiz metni...]              │  │
│       │                                                  │  │
│       │ ⚠️ Her iki taraf şu konuda hemfikir:             │  │
│       │ [Ortak nokta metni]                              │  │
│       └──────────────────────────────────────────────────┘  │
│                                                              │
│       [REKLAM ALANI - haber detay alt]                      │
│                                                              │
│       ━━━━ 💬 Yorumlar (12) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│       [Sıralama: En Yeni ▼]                                 │
│       ┌─────────────────────────────────────────────────┐   │
│       │ 👤 Kullanıcı Adı  •  2 saat önce               │   │
│       │ Yorum içeriği...                                 │   │
│       │ [👍 12] [👎 2] [Cevapla]                         │   │
│       │   └── 👤 Cevap yazan  •  1 saat önce            │   │
│       │       Cevap içeriği...                           │   │
│       │       [👍 5] [👎 0] [Cevapla]                    │   │
│       └─────────────────────────────────────────────────┘   │
│       [Yorum yaz... ] [Gönder]                              │
│                                                              │
│       ━━━━ İlginizi Çekebilecek Haberler ━━━━━━━━━━━━━━━━  │
│       ┌────────┐ ┌────────┐ ┌────────┐                     │
│       │ Haber1 │ │ Haber2 │ │ Haber3 │                     │
│       └────────┘ └────────┘ └────────┘                     │
│       ┌────────┐ ┌────────┐ ┌────────┐                     │
│       │ Haber4 │ │ Haber5 │ │ Haber6 │                     │
│       └────────┘ └────────┘ └────────┘                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ FOOTER (4 sütun)                                            │
└─────────────────────────────────────────────────────────────┘
```

**Sol Kenar Butonları (ActionSidebar):**
- ? = Soru Sor (AI üretimi 3 soru + cevap)
- 🤖 = AI Asistan (chatbot paneli)
- 🐦 = Twitter'da Paylaş
- 📘 = Facebook'ta Paylaş
- 💬 = WhatsApp'ta Gönder
- 📌 = Pinterest'e Kaydet
- 🔗 = LinkedIn'de Paylaş
- 📎 = Linki Kopyala
- 🖨 = Yazdır
- 🔖 = Kataloga Kaydet
- Mobilde: alt yatay bar olarak gösterilir

**Resim Kuralı:** og:image genişliği veya yüksekliği ≤ 300px ise resim GÖSTERİLMEZ.

**Davranışlar:**
- Sayfa açıldığında analiz kartı boş gelir
- Kullanıcı bayrağa tıklayınca API çağrısı başlar
- Yüklenirken skeleton loader gösterilir
- Analiz gelince animasyonlu açılır
- Bir kez yüklenen ülke tekrar tıklanınca cache'den gelir (anında)
- Mobilde bayraklar yatay kaydırılabilir (overflow-x: auto)
- Sesli dinleme butonu: Web Speech API (tr-TR) ile özeti okur
- Yorumlar: nested thread yapısı, like/dislike, max 3 seviye
- İlgili haberler: pgvector embedding benzerliğine göre 6 haber

---

## Haber Kaynakları ve RSS URL'leri

```python
SOURCES = [
    # ============ TÜRKİYE ============
    # Yandaş
    {"name": "TRT Haber",       "country": "TR", "bias": "pro_gov", "lang": "tr", "rss": "https://www.trthaber.com/sondakika.rss"},
    {"name": "Sabah",           "country": "TR", "bias": "pro_gov", "lang": "tr", "rss": "https://www.sabah.com.tr/rss/anasayfa.xml"},
    {"name": "A Haber",         "country": "TR", "bias": "pro_gov", "lang": "tr", "rss": "https://www.ahaber.com.tr/rss/anasayfa.xml"},
    {"name": "Star Gazetesi",   "country": "TR", "bias": "pro_gov", "lang": "tr", "rss": "https://www.star.com.tr/rss/"},
    {"name": "Türkiye Gazetesi","country": "TR", "bias": "pro_gov", "lang": "tr", "rss": "https://www.turkiyegazetesi.com.tr/rss.xml"},
    # Muhalif
    {"name": "Cumhuriyet",      "country": "TR", "bias": "opposition", "lang": "tr", "rss": "https://www.cumhuriyet.com.tr/rss/son_dakika.xml"},
    {"name": "BirGün",          "country": "TR", "bias": "opposition", "lang": "tr", "rss": "https://www.birgun.net/rss"},
    {"name": "Bianet",          "country": "TR", "bias": "opposition", "lang": "tr", "rss": "https://bianet.org/bianet/rss"},
    {"name": "Gazete Duvar",    "country": "TR", "bias": "opposition", "lang": "tr", "rss": "https://www.gazeteduvar.com.tr/feed"},
    {"name": "T24",             "country": "TR", "bias": "opposition", "lang": "tr", "rss": "https://t24.com.tr/rss"},

    # ============ ABD ============
    # Yandaş
    {"name": "Fox News",        "country": "US", "bias": "pro_gov", "lang": "en", "rss": "https://feeds.foxnews.com/foxnews/world"},
    {"name": "Breitbart",       "country": "US", "bias": "pro_gov", "lang": "en", "rss": "https://feeds.feedburner.com/breitbart"},
    {"name": "NY Post",         "country": "US", "bias": "pro_gov", "lang": "en", "rss": "https://nypost.com/feed/"},
    {"name": "Newsmax",         "country": "US", "bias": "pro_gov", "lang": "en", "rss": "https://www.newsmax.com/rss/Newsfront/16"},
    {"name": "Washington Times","country": "US", "bias": "pro_gov", "lang": "en", "rss": "https://www.washingtontimes.com/rss/headlines/news/world/"},
    # Muhalif
    {"name": "MSNBC",           "country": "US", "bias": "opposition", "lang": "en", "rss": "https://feeds.nbcnews.com/msnbc/public/news"},
    {"name": "HuffPost",        "country": "US", "bias": "opposition", "lang": "en", "rss": "https://www.huffpost.com/section/world-news/feed"},
    {"name": "The Nation",      "country": "US", "bias": "opposition", "lang": "en", "rss": "https://www.thenation.com/feed/?post_type=article"},
    {"name": "Mother Jones",    "country": "US", "bias": "opposition", "lang": "en", "rss": "https://www.motherjones.com/feed/"},
    {"name": "Democracy Now",   "country": "US", "bias": "opposition", "lang": "en", "rss": "https://www.democracynow.org/democracynow.rss"},

    # ============ İNGİLTERE ============
    # Yandaş
    {"name": "Daily Mail",      "country": "GB", "bias": "pro_gov", "lang": "en", "rss": "https://www.dailymail.co.uk/articles.rss"},
    {"name": "The Sun",         "country": "GB", "bias": "pro_gov", "lang": "en", "rss": "https://www.thesun.co.uk/feed/"},
    {"name": "GB News",         "country": "GB", "bias": "pro_gov", "lang": "en", "rss": "https://www.gbnews.com/feeds/news.rss"},
    {"name": "Daily Express",   "country": "GB", "bias": "pro_gov", "lang": "en", "rss": "https://www.express.co.uk/posts/rss/139/world"},
    {"name": "The Telegraph",   "country": "GB", "bias": "pro_gov", "lang": "en", "rss": "https://www.telegraph.co.uk/rss.xml"},
    # Muhalif
    {"name": "The Guardian",    "country": "GB", "bias": "opposition", "lang": "en", "rss": "https://www.theguardian.com/world/rss"},
    {"name": "The Independent", "country": "GB", "bias": "opposition", "lang": "en", "rss": "https://www.independent.co.uk/news/world/rss"},
    {"name": "Daily Mirror",    "country": "GB", "bias": "opposition", "lang": "en", "rss": "https://www.mirror.co.uk/news/world-news/rss.xml"},
    {"name": "New Statesman",   "country": "GB", "bias": "opposition", "lang": "en", "rss": "https://www.newstatesman.com/feed"},
    {"name": "openDemocracy",   "country": "GB", "bias": "opposition", "lang": "en", "rss": "https://www.opendemocracy.net/en/rss.xml"},

    # ============ ALMANYA ============
    # Yandaş
    {"name": "Bild",            "country": "DE", "bias": "pro_gov", "lang": "de", "rss": "https://www.bild.de/feed/politik.bild.feed.bild.xml"},
    {"name": "Junge Freiheit",  "country": "DE", "bias": "pro_gov", "lang": "de", "rss": "https://junge-freiheit.de/feed/"},
    {"name": "Focus Online",    "country": "DE", "bias": "pro_gov", "lang": "de", "rss": "https://rss.focus.de/fol/XML/rss_folnews.xml"},
    {"name": "Welt",            "country": "DE", "bias": "pro_gov", "lang": "de", "rss": "https://www.welt.de/feeds/latest.rss"},
    {"name": "FAZ",             "country": "DE", "bias": "pro_gov", "lang": "de", "rss": "https://www.faz.net/rss/aktuell/"},
    # Muhalif
    {"name": "Der Spiegel",     "country": "DE", "bias": "opposition", "lang": "de", "rss": "https://www.spiegel.de/schlagzeilen/index.rss"},
    {"name": "Die Zeit",        "country": "DE", "bias": "opposition", "lang": "de", "rss": "https://newsfeed.zeit.de/index"},
    {"name": "taz",             "country": "DE", "bias": "opposition", "lang": "de", "rss": "https://taz.de/!p4608;rss/"},
    {"name": "Süddeutsche",     "country": "DE", "bias": "opposition", "lang": "de", "rss": "https://rss.sueddeutsche.de/rss/Topthemen"},
    {"name": "DW",              "country": "DE", "bias": "opposition", "lang": "de", "rss": "https://rss.dw.com/xml/rss-de-all"},

    # ============ RUSYA ============
    # Yandaş
    {"name": "RT",              "country": "RU", "bias": "pro_gov", "lang": "en", "rss": "https://www.rt.com/rss/"},
    {"name": "TASS",            "country": "RU", "bias": "pro_gov", "lang": "en", "rss": "https://tass.com/rss/v2.xml"},
    {"name": "Sputnik",         "country": "RU", "bias": "pro_gov", "lang": "en", "rss": "https://sputnikglobe.com/export/rss2/world/index.xml"},
    {"name": "RIA Novosti",     "country": "RU", "bias": "pro_gov", "lang": "ru", "rss": "https://ria.ru/export/rss2/world/index.xml"},
    {"name": "Pravda",          "country": "RU", "bias": "pro_gov", "lang": "en", "rss": "https://english.pravda.ru/rss/world.xml"},
    # Muhalif
    {"name": "Meduza",          "country": "RU", "bias": "opposition", "lang": "en", "rss": "https://meduza.io/rss/en/all"},
    {"name": "The Insider",     "country": "RU", "bias": "opposition", "lang": "en", "rss": "https://theins.ru/feed"},
    {"name": "iStories",        "country": "RU", "bias": "opposition", "lang": "ru", "rss": "https://istories.media/feed/"},
    {"name": "Mediazona",       "country": "RU", "bias": "opposition", "lang": "ru", "rss": "https://zona.media/rss"},
    {"name": "Novaya Gazeta",   "country": "RU", "bias": "opposition", "lang": "ru", "rss": "https://novayagazeta.ru/rss/all.xml"},

    # ============ ÇİN ============
    # Yandaş
    {"name": "CGTN",            "country": "CN", "bias": "pro_gov", "lang": "en", "rss": "https://www.cgtn.com/subscribe/rss/section/world.xml"},
    {"name": "Xinhua",          "country": "CN", "bias": "pro_gov", "lang": "en", "rss": "http://www.xinhuanet.com/english/rss/worldrss.xml"},
    {"name": "Global Times",    "country": "CN", "bias": "pro_gov", "lang": "en", "rss": "https://www.globaltimes.cn/rss/world.xml"},
    {"name": "People's Daily",  "country": "CN", "bias": "pro_gov", "lang": "en", "rss": "http://en.people.cn/rss/90777.xml"},
    {"name": "China Daily",     "country": "CN", "bias": "pro_gov", "lang": "en", "rss": "https://www.chinadaily.com.cn/rss/world_rss.xml"},
    # Muhalif
    {"name": "VOA Chinese",     "country": "CN", "bias": "opposition", "lang": "zh", "rss": "https://www.voachinese.com/api/zmgqiipuoki"},
    {"name": "RFA Chinese",     "country": "CN", "bias": "opposition", "lang": "zh", "rss": "https://www.rfa.org/mandarin/RSS"},
    {"name": "NTD",             "country": "CN", "bias": "opposition", "lang": "en", "rss": "https://www.ntd.com/feed"},
    {"name": "Radio Free Asia", "country": "CN", "bias": "opposition", "lang": "en", "rss": "https://www.rfa.org/english/RSS"},
    {"name": "Epoch Times",     "country": "CN", "bias": "opposition", "lang": "en", "rss": "https://www.theepochtimes.com/feed"},

    # ============ İRAN ============
    # Yandaş
    {"name": "Press TV",        "country": "IR", "bias": "pro_gov", "lang": "en", "rss": "https://www.presstv.ir/homepages/rss.xml"},
    {"name": "IRNA",            "country": "IR", "bias": "pro_gov", "lang": "en", "rss": "https://en.irna.ir/rss.xml"},
    {"name": "Tasnim News",     "country": "IR", "bias": "pro_gov", "lang": "en", "rss": "https://www.tasnimnews.com/en/rss"},
    {"name": "Fars News",       "country": "IR", "bias": "pro_gov", "lang": "en", "rss": "https://www.farsnews.ir/rss.xml"},
    {"name": "ISNA",            "country": "IR", "bias": "pro_gov", "lang": "en", "rss": "https://en.isna.ir/rss.xml"},
    # Muhalif
    {"name": "Iran International","country": "IR", "bias": "opposition", "lang": "en", "rss": "https://www.iranintl.com/en/rss.xml"},
    {"name": "Radio Farda",     "country": "IR", "bias": "opposition", "lang": "fa", "rss": "https://www.radiofarda.com/api/zougoqtiq"},
    {"name": "VOA Persian",     "country": "IR", "bias": "opposition", "lang": "fa", "rss": "https://www.radiovoanews.com/api/zruqquiqm"},
    {"name": "IranWire",        "country": "IR", "bias": "opposition", "lang": "en", "rss": "https://iranwire.com/en/feed/"},
    {"name": "Manoto",          "country": "IR", "bias": "opposition", "lang": "fa", "rss": "https://www.manoto1.com/rss"},

    # ============ İSRAİL ============
    # Yandaş
    {"name": "Arutz Sheva",     "country": "IL", "bias": "pro_gov", "lang": "en", "rss": "https://www.israelnationalnews.com/Rss.aspx"},
    {"name": "Israel Hayom",    "country": "IL", "bias": "pro_gov", "lang": "en", "rss": "https://www.israelhayom.com/feed/"},
    {"name": "Jerusalem Post",  "country": "IL", "bias": "pro_gov", "lang": "en", "rss": "https://www.jpost.com/rss/rssfeedsfrontpage.aspx"},
    {"name": "Ynetnews",        "country": "IL", "bias": "pro_gov", "lang": "en", "rss": "https://www.ynetnews.com/Integration/StoryRss2.xml"},
    {"name": "Times of Israel", "country": "IL", "bias": "pro_gov", "lang": "en", "rss": "https://www.timesofisrael.com/feed/"},
    # Muhalif
    {"name": "Haaretz",         "country": "IL", "bias": "opposition", "lang": "en", "rss": "https://www.haaretz.com/cmlink/1.628765"},
    {"name": "+972 Magazine",   "country": "IL", "bias": "opposition", "lang": "en", "rss": "https://www.972mag.com/feed/"},
    {"name": "Local Call",      "country": "IL", "bias": "opposition", "lang": "en", "rss": "https://localcall.co.il/feed/"},
    {"name": "Mekomit",         "country": "IL", "bias": "opposition", "lang": "he", "rss": "https://www.mekomit.co.il/feed/"},
    {"name": "Siha Mekomit",    "country": "IL", "bias": "opposition", "lang": "he", "rss": "https://mekomit.co.il/feed/"},

    # ============ SUUDİ ARABİSTAN ============
    # Yandaş
    {"name": "Saudi Gazette",   "country": "SA", "bias": "pro_gov", "lang": "en", "rss": "https://saudigazette.com.sa/rss.xml"},
    {"name": "Arab News",       "country": "SA", "bias": "pro_gov", "lang": "en", "rss": "https://www.arabnews.com/rss.xml"},
    {"name": "Al Arabiya",      "country": "SA", "bias": "pro_gov", "lang": "en", "rss": "https://english.alarabiya.net/tools/rss"},
    {"name": "SPA",             "country": "SA", "bias": "pro_gov", "lang": "en", "rss": "https://www.spa.gov.sa/rss/rss_en.xml"},
    {"name": "Asharq Al-Awsat", "country": "SA", "bias": "pro_gov", "lang": "en", "rss": "https://english.aawsat.com/rss.xml"},
    # Muhalif
    {"name": "Alqst",           "country": "SA", "bias": "opposition", "lang": "en", "rss": "https://alqst.org/feed"},
    {"name": "DAWN",            "country": "SA", "bias": "opposition", "lang": "en", "rss": "https://dawnmena.org/feed/"},
    {"name": "Arabi21",         "country": "SA", "bias": "opposition", "lang": "ar", "rss": "https://arabi21.com/rss.xml"},
    {"name": "Middle East Eye", "country": "SA", "bias": "opposition", "lang": "en", "rss": "https://www.middleeasteye.net/rss"},
    {"name": "Al-Monitor",      "country": "SA", "bias": "opposition", "lang": "en", "rss": "https://www.al-monitor.com/rss"},

    # ============ MISIR ============
    # Yandaş
    {"name": "Al-Ahram",        "country": "EG", "bias": "pro_gov", "lang": "en", "rss": "https://english.ahram.org.eg/UI/Front/ContentRss.aspx?secID=1"},
    {"name": "Egypt Today",     "country": "EG", "bias": "pro_gov", "lang": "en", "rss": "https://www.egypttoday.com/rss.xml"},
    {"name": "Daily News Egypt","country": "EG", "bias": "pro_gov", "lang": "en", "rss": "https://www.dailynewsegypt.com/feed/"},
    {"name": "Akhbar al-Youm",  "country": "EG", "bias": "pro_gov", "lang": "ar", "rss": "https://akhbarelyom.com/rss.xml"},
    {"name": "Al-Masry Al-Youm","country": "EG", "bias": "pro_gov", "lang": "en", "rss": "https://www.egyptindependent.com/feed/"},
    # Muhalif
    {"name": "Mada Masr",       "country": "EG", "bias": "opposition", "lang": "en", "rss": "https://www.madamasr.com/en/feed/"},
    {"name": "Al-Manassa",      "country": "EG", "bias": "opposition", "lang": "ar", "rss": "https://al-manassa.com/feed/"},
    {"name": "Daraj",           "country": "EG", "bias": "opposition", "lang": "ar", "rss": "https://daraj.com/feed/"},
    {"name": "Noon Post",       "country": "EG", "bias": "opposition", "lang": "ar", "rss": "https://www.noonpost.com/feed/"},
    {"name": "Egypt Wide",      "country": "EG", "bias": "opposition", "lang": "ar", "rss": "https://egyptwide.com/feed/"},
]

# Ülke meta bilgileri
COUNTRIES = {
    "TR": {"name": "Türkiye",         "flag": "🇹🇷"},
    "US": {"name": "ABD",             "flag": "🇺🇸"},
    "GB": {"name": "İngiltere",       "flag": "🇬🇧"},
    "DE": {"name": "Almanya",         "flag": "🇩🇪"},
    "RU": {"name": "Rusya",           "flag": "🇷🇺"},
    "CN": {"name": "Çin",             "flag": "🇨🇳"},
    "IR": {"name": "İran",            "flag": "🇮🇷"},
    "IL": {"name": "İsrail",          "flag": "🇮🇱"},
    "SA": {"name": "Suudi Arabistan", "flag": "🇸🇦"},
    "EG": {"name": "Mısır",           "flag": "🇪🇬"},
}
```

---

## Tasarım Gereksinimleri

### Genel
- Mobile-first, responsive
- Açık / koyu tema (sistem tercihine göre otomatik + manuel toggle)
- Hızlı yükleme: SSR + Redis cache
- Skeleton loader: içerik yüklenmeden önce

### Renk Paleti
```css
/* Koyu Tema */
--bg-primary: #0f0f0f;
--bg-secondary: #1a1a1a;
--bg-card: #222222;
--text-primary: #f5f5f5;
--text-secondary: #a0a0a0;
--border: #333333;

/* Açık Tema */
--bg-primary: #ffffff;
--bg-secondary: #f8f8f8;
--bg-card: #ffffff;
--text-primary: #111111;
--text-secondary: #666666;
--border: #e5e5e5;

/* Sabit Renkler */
--accent-blue: #2563eb;
--tag-pro-gov: #dc2626;        /* Yandaş etiketi - kırmızı */
--tag-opposition: #16a34a;     /* Muhalif etiketi - yeşil */
--tag-consensus: #d97706;      /* Ortak nokta - amber */
```

### Tipografi
```css
font-family: 'Inter', 'Geist', system-ui, sans-serif;
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 22px;
--font-size-2xl: 28px;
```

### Bileşen Kuralları
- Tüm butonlar minimum 44×44px (mobil dokunuş)
- Kartlar: border-radius 12px, hafif shadow
- Bayrak butonları: seçili halde mavi border + background
- Analiz metni: satır yüksekliği 1.7, okunabilir font-size
- Geçişler: 200ms ease transition

---

## Yeni Özellikler (v2 + v3)

Detaylı promptlar ve uygulama talimatları için `PROMPTS.md` dosyasına bakınız.

### v2 - Temel Özellikler (Madde 0-16): ✅ Tamamlandı
1. **Gemini Key Güncelleme** - Admin panelden key girişi, `admin_settings` tablosunda saklanır ✅
2. **Resim Kalite Kontrolü** - ≤300px genişlik/yükseklik resimleri gösterilmez ✅
3. **"Yapay Zeka Özeti"** - "Tarafsız Özet" ifadesi kaldırıldı ✅
4. **Aksiyon Sidebar** - Sol kenarda yuvarlak butonlar (paylaş, AI soru, chatbot, yazdır, kopyala) ✅
5. **Yorum Sistemi** - Nested yorumlar (max 3 seviye), like/dislike, thread yapısı ✅
6. **Kullanıcı Paneli** - Kayıt/giriş, profil, avatar, şifre yönetimi; profil alt sayfaları üst düzey tasarım ✅
7. **Tema/Tasarım Yenileme** - Hero slider, ticker, popüler haberler, kategori bölümleri, istatistik bandi ✅
8. **Arama Sistemi** - Detaylı filtreler, wildcard (*/?), doğal dil arama (Gemini embedding) ✅
9. **SEO Uyumu** - Meta tags, Open Graph, JSON-LD, sitemap, robots.txt ✅
10. **Sesli Dinleme** - Web Speech API (tr-TR); ±10s atlama butonları; hız değişiminde bar kayması düzeltildi ✅
11. **Katalog Sistemi** - Kullanıcı koleksiyonları, haberleri kaydetme ✅
12. **Ülke Filtresi** - AI ile ülke tespiti, arama/ana sayfada filtre ✅
13. **Google AdSense Altyapısı** - 7 reklam pozisyonu placeholder ✅
14. **Bülten Sistemi** - Email bülten, frekans/filtre ayarları, admin SMTP paneli ✅; `MailService.php` ile HTML mail gönderimi; `haber:newsletter` komutu abonelere kişiselleştirilmiş bülten gönderir; SMTP test endpoint: `POST /api/admin/smtp/test` ✅
15. **Bildirim Sistemi** - Header bildirim ikonu; email + mobil push kanal ayarları ✅
16. **Footer** - 3 sütunlu menü + marka sütunu; ülke flag+isim pill'leri; yasal sayfalar; çerez banner ✅

### v3 - Benzersiz Özellikler (Madde 17-32):
17. **İnteraktif Dünya Haritası** - SVG harita, haber yoğunluğu heat map, tıklanabilir ülkeler ✅
18. **Propaganda/Yanlışma Skoru** - AI ile 4 metrik (propaganda, duygu, olgu, çeşitlilik) + retorik teknik tespiti
19. **Anlatı Takipçisi** - Bir haberin anlatısının günler içinde ülkeler arası nasıl değiştiğinin timeline'ı
20. **"Ne Haber Yapılmıyor?" Analizi** - Kasıtlı suskunluk tespiti, hangi ülkeler hangi haberleri işlemedi
21. **Kelime Bulutu Karşılaştırması** - Ülkelerin aynı haber için kullandığı kelimelerin word cloud karşılaştırması
22. **Jeopolitik Gerilim Endeksi** - Medya tonundan hesaplanan ülke çifti gerilim barometresi + ısı haritası
23. **Medya Okuryazarlığı Bölümü** - Propaganda tespiti, yanlılık türleri, kaynak doğrulama rehberleri
24. **Karşılaştırma Modu** - 2-3 ülkeyi yan yana split-screen görüntüleme
25. **Haftalık/Aylık AI Rapor** - Otomatik üretilen medya analiz raporları, PDF indirme ✅; `haber:generate-report` komutu odak/ülke/kategori filtreli rapor üretir; `haber:prune-reports` her gece 03:00'te haftalık >8 hafta / aylık >1 yıl eski raporları siler; raporlar listesinde silme tarihi yaklaşınca uyarı gösterilir ✅
26. **Kaynak Güvenilirlik Kartları** - Her kaynak için profil sayfası; dış link ikonu; kaynak/ülke öneri CTA ✅
27. **Zaman Makinesi** - Özel takvim bileşeni; tarih bazlı haber listeleme; "Tarihte Bugün" widget ✅
28. **Okuyucu Konsensüs Oylama** - "Hangi taraf daha doğru?" localStorage + kullanıcı oylama ✅
29. **Gerçek Zamanlı Güncelleme** - SSE ile canlı haber bildirimi, breaking news banner
30. **Fact-Check Entegrasyonu** - Teyit.org, Google Fact Check API ile iddia doğrulama
31. **API / Embed Widget** - Public API + gömülebilir widget sistemi, API dokümantasyonu
32. **Full-Text Scraping Pipeline** - Makale tam metin çekme, dil tespiti, Gemini ile Türkçe çeviri

### Notlar
- **Türkçe Karakter Kuralı:** Tüm UI metinleri Türkçe karakter kullanmalı (ş, ğ, ı, İ, ü, ö, ç vb.). Yeni bileşen yazarken bu kurala dikkat et.
- **Plan Yapısı:** Sadece 2 plan vardır: `free` (ücretsiz) ve `pro` (₺79/ay). Standart plan kaldırıldı. Taksit seçeneği yok, tek çekim. `usePlan.ts`'teki hiyerarşi: `{ free: 0, pro: 1 }`.
- **AudioPlayer:** `startFrom()` içinde `setCurrentChar(charPos)` ile bar anında sabitlenir; `onboundary` sadece ileri giderse güncellenir (geri atlama engeli).
- **ReaderVote:** Backend `reader_votes` tablosuyla tam entegre. Uluslararası haberlerde ülke oyu (vote = ülke kodu), Türkiye kutuplaşmalarında TrBiasVote (vote = pro_gov/opposition/both/undecided, country_code = 'TR_BIAS', IP hash ile anonim).
- **Veritabanı farkı:** Production (sunucu) **PostgreSQL** kullanır, lokal geliştirme **MySQL** kullanır. Laravel migration'ları her iki DB'de de çalışır ama raw SQL yazarken dikkat edilmeli. Uzaktan DB bağlantısı: `medyaizle_remote` / `MedyaIzle2026!` @ `204.168.205.79:5432`.
- **Cache driver:** Production'da `CACHE_STORE=database` (file cache'te root/www-data izin çakışması vardı). `cache` tablosu migration ile oluşturuldu (`2026_04_02_082006_create_cache_table.php`).
- **`related_countries` kolonu DB'de VAR.** `events` tablosunda JSON text array (örn: `["IL","IR","US"]`). Gemini sınıflandırması + keyword enrichment ile doldurulur. `ProcessPendingEvents` yeni haberleri otomatik sınıflandırır, `ClassifyRelatedCountries` backfill komutu. Gerilim endeksi ve tension popup bu kolonu kullanır.
- **`reports` tablosu:** Migration ile oluşturuldu (`2026_03_29_150000_create_reports_table.php`). `updated_at` kolonu YOK — insert/update sorgularına ekleme.
- **Arama sayfası `show_all=1`:** `EventController::index()` varsayılan olarak "en az 2 farklı ülke" kısıtı uygular. Arama/filtre sayfasından `show_all=1` parametresi gelirse bu kısıt atlanır. `getEvents()` API fonksiyonunda `showAll` seçeneği mevcuttur.
- **Kutuplaşmalar sayfası:** Açıklama bandında kaynak isimleri yok, sadece "Hükümete yakın medya" / "Muhalif medya" yazıyor. Başlıkta Türkiye bayrağı yok.
- **Haber detay kaynaklar:** `has_tr_bias=true` haberlerde düz liste (YANDAŞ/MUHALİF badge'li); `has_tr_bias=false` haberlerde ülke ülke gruplandırılmış görünüm (flagcdn bayrağı + ülke adı başlık).
- **Mail altyapısı:** `MailService.php` SMTP ayarlarını `admin_settings` tablosundan okur (key: `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_from_email`, `smtp_from_name`). Önerilen port: **465** (SSL/TLS). `SendNewsletter` komutu her abonenin kategori/ülke/önem filtrelerine göre kişiselleştirilmiş bülten gönderir.
- **Cron sayısı:** `console.php`'de 14 cron job var (fetch, embed, cluster, analyze, images, notify, weekly-report, monthly-report, health, newsletter-weekly, newsletter-monthly, prune-reports, calculate-tensions, fulltext).
- **`haber:health` cron'da `--fix` KULLANILMAZ.** `--fix` bayrağı `Artisan::call()` ile senkron olarak embed/analyze çalıştırır, saatlerce sürer ve `withoutOverlapping()` kilidini atlayarak birden fazla instance başlar → sunucu çöker. Cron'da sadece `haber:health` (loglama modu) çalışır, 30 dakikada bir.
- **Gemini model: `gemini-2.5-flash` (SABİT)** — 2026-04-01 test edildi, çalışıyor. Free tier: 10 RPM, 250 RPD, 1M context. `GeminiService::MODEL` sabiti olarak tanımlı. Fallback veya model değiştirme mantığı YOKTUR. Değiştirme.
- **Header navigasyon:** Ana Sayfa → Gündem → Kategoriler → Türkiye'den Haberler (🇹🇷, `/turkiyeden-haberler`) → Türkiye'deki Kutuplaşmalar (`/kutuplasmalar`) → Raporlar. Arama ve İletişim menüden kaldırıldı.
- **Ana sayfa bölümleri sırası:** HeroSlider → StatsBand → WorldMap → TensionSection → Dünya Gündemi → Türkiye Gündemi → Türkiye'den Kutuplaşmalar → Haber listesi. `GundemSection` bileşeni `title` ve `moreHref` prop'u alır.
- **Yeni backend endpoint'ler:** `GET /api/events/turkiye-gundem` (TR kaynaklı, importance DESC, 3 gün), `GET /api/events/turkiye-kutuplasma` (tr_bias, importance DESC, 7 gün).
- **Haber kartı footer:** `event.article_count` değil, `event.country_codes.length` gösterilir — "x ülke" olarak.
- **Sunucu .env.local:** `NEXT_PUBLIC_API_URL=http://localhost:8000` (localhost) — `https://medyaizle.com` kullanmak SSR'da circular EPIPE hatasına yol açar.
- **Sunucu swap:** 2GB swap `/swapfile`'da aktif (`/etc/fstab`'a eklendi). Swap olmadığında build sırasında OOM killer devreye girip PM2 restart'a yol açıyordu.
- **Haber URL formatı:** Canonical format `/haber/{category}/{id}-{slug}` (örn. `/haber/siyaset/123-baslik`). Tüm linkler `eventUrl(id, title, category)` fonksiyonuyla üretilmeli. Eski format `/haber/{id}/{slug}` artık redirect olarak çalışıyor. Yeni bileşen yazarken hardcoded `/haber/` linki oluşturma.
- **Header ikonları:** Her nav linkinde `icon` (emoji) alanı var. Yeni menü öğesi eklenirken bir emoji ikonu da eklenmeli. Türkiye'den Haberler `flagCode: "tr"` kullanıyor (emoji değil, bayrak resmi).
- **SSS / Kullanıcı yüzü metinler:** Yapay zeka sağlayıcısı (Google Gemini) adı kullanıcıya yönelik metinlerde geçmemeli — sadece "yapay zeka" yazılmalı. Teknik sayfalar (API docs, tech stack) hariç.

---

## Google AdSense

- **Publisher ID:** `pub-4272457897788655`
- **ads.txt:** `frontend/public/ads.txt` dosyasında mevcut — Next.js bunu `medyaizle.com/ads.txt` olarak servis eder
- **ads.txt içeriği:** `google.com, pub-4272457897788655, DIRECT, f08c47fec0942fa0`
- **Onay durumu:** Hazırlanıyor (başvuru 29 Mar 2026'dan beri beklemede)
- **Reklam pozisyonları:** `frontend/lib/adsConfig.ts`'te 7 pozisyon tanımlı

---

## Maliyet Özeti

| Servis | Plan | Aylık Maliyet |
|--------|------|--------------|
| Gemini API | Free tier (günde 1500 istek) | $0 |
| Hetzner VPS | CX23, Helsinki | ~$3.49/ay |
| Vercel | Hobby (ücretsiz) | $0 |
| **Toplam** | | **~$3.49/ay** |
