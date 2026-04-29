# Toplu Haber Verisi Import Rehberi

> Harici JSON verilerini (1M+ makale) sisteme dahil etmek için adım adım kılavuz.

---

## Genel Mimari

```
JSON Dosyası(ları)
       │
       ▼
[1] Kaynak Eşleştirme / Oluşturma
       │
       ▼
[2] Makale Insert (Dedup + Temizleme)
       │
       ▼
[3] Embedding Üretimi  ← Gemini embedding-001
       │
       ▼
[4] Kümeleme (Clustering)  ← Python + cosine similarity
       │
       ▼
[5] Event Analizi  ← Gemini 2.5-flash (Türkçe başlık/özet)
       │
       ▼
[6] Ülke Sınıflandırması  ← Gemini + keyword fallback
       │
       ▼
  Sitede Yayında ✓
```

---

## Bölüm 1 — JSON Formatı

### Minimum Gerekli Format

```json
{
  "source": {
    "name": "Haberturk",
    "slug": "haberturk",
    "site_url": "https://www.haberturk.com",
    "country_code": "TR",
    "bias": "pro_gov",
    "language": "tr"
  },
  "articles": [
    {
      "url": "https://www.haberturk.com/haber/12345",
      "title": "Haber başlığı buraya",
      "summary": "Haberin giriş paragrafı veya özeti (500 karakter ideal)",
      "full_text": "Tam haber metni (opsiyonel, summary yoksa kullanılır)",
      "image_url": "https://cdn.haberturk.com/resim.jpg",
      "published_at": "2024-03-15T14:30:00Z"
    }
  ]
}
```

### Alan Açıklamaları

| Alan | Zorunlu | Tip | Kısıt | Notlar |
|------|---------|-----|-------|--------|
| `source.name` | ✓ | string | max 100 | Görüntülenen kaynak adı |
| `source.slug` | ✓ | string | unique, lowercase | URL dostu kimlik (`haberturk`, `cnn-turk`) |
| `source.site_url` | - | string | max 500 | Ana site URL'si |
| `source.country_code` | ✓ | string | 2 karakter | `TR`, `US`, `GB`, `DE`, `RU`, `CN`, `IR`, `IL`, `SA`, `EG` |
| `source.bias` | ✓ | string | enum | `pro_gov` veya `opposition` |
| `source.language` | ✓ | string | 2-5 karakter | `tr`, `en`, `de`, `ru`, `ar`, `fa`, `he`, `zh` |
| `article.url` | ✓ | string | unique | Birincil dedup anahtarı |
| `article.title` | ✓ | string | max 1000 | Ham, HTML tagları temizlenmiş |
| `article.summary` | △ | string | max 2000 | Yoksa `full_text` ilk 500 char kullanılır |
| `article.full_text` | △ | string | - | summary yoksa zorunlu |
| `article.image_url` | - | string | max 500 | Direkt medya URL'si (CDN linki ideal) |
| `article.published_at` | ✓ | string | ISO 8601 | `2024-03-15T14:30:00Z` veya `2024-03-15 14:30:00` |

**Not:** `summary` ve `full_text` ikisinden biri **zorunludur** — embedding kalitesi için.

### Desteklenen Dosya Yapıları

```
# Seçenek A: Kaynak başına tek dosya
haberturk.json      → { "source": {...}, "articles": [...] }
milliyet.json       → { "source": {...}, "articles": [...] }

# Seçenek B: Tek büyük dosya, tüm kaynaklar
all_sources.json    → [ { "source": {...}, "articles": [...] }, ... ]

# Seçenek C: Her makale ayrı satırda (JSONL/NDJSON) — büyük veri için ideal
articles.jsonl      → {"source_slug":"haberturk","url":"...","title":"...","published_at":"..."}\n
                       {"source_slug":"milliyet","url":"...","title":"...","published_at":"..."}\n
```

**1M+ veri için Seçenek C (JSONL) önerilir** — belleğe tek seferde yüklemez, satır satır okur.

---

## Bölüm 2 — Süzgeçler ve Temizleme Kuralları

Import öncesi verinin geçmesi gereken kontroller:

### 2.1 Zorunlu Süzgeçler

```
┌─────────────────────────────────────────────────────────────┐
│ SÜZGEÇ                          │ GEÇEMEZSe NE OLUR?       │
├─────────────────────────────────┼──────────────────────────┤
│ URL boş veya NULL               │ SKIP                     │
│ Title < 10 karakter             │ SKIP                     │
│ Summary + full_text ikisi NULL  │ SKIP (embedding üretilemez)│
│ published_at geçersiz tarih     │ SKIP                     │
│ URL zaten DB'de mevcut          │ SKIP (duplicate)         │
│ country_code geçersiz kod       │ SKIP veya default 'TR'   │
└─────────────────────────────────┴──────────────────────────┘
```

### 2.2 Veri Temizleme

```
title:
  - HTML taglarını sil: <p>, <b>, <br>, <a href="...">, vs.
  - HTML entity decode: &amp; → &, &quot; → ", &#39; → '
  - Normalize boşluk: birden fazla boşluk/satır → tek boşluk
  - Max 1000 karakter (kes)

summary:
  - Aynı HTML temizliği
  - Max 2000 karakter (kes)
  - Eğer full_text'ten üretiliyorsa: ilk 500 karakter al

image_url:
  - http:// veya https:// ile başlamalı
  - Boyut kontrolü: ≤300px genişlik/yükseklik ise kullanma
    (sistem küçük resimleri zaten göstermiyor)
  - Erişilebilirlik kontrolü opsiyonel (import yavaşlatır)

published_at:
  - ISO 8601: "2024-03-15T14:30:00Z" ✓
  - Space separator: "2024-03-15 14:30:00" ✓
  - Unix timestamp: 1710508200 → dönüştür
  - Geçersiz: 1970-01-01, 2099+, NULL → SKIP
```

### 2.3 Tarih Filtreleme Stratejisi

**Problem:** 1M makale için embedding üretimi çok pahalı/yavaş.

**Öneri:**

```
published_at >= (bugün - 90 gün)  →  TAM PIPELINE (embed + cluster + analiz)
published_at <  (bugün - 90 gün)  →  ARŞIV MOD (sadece DB insert, embedding yok)
```

Arşiv modundaki haberler:
- `articles.embedding = NULL` (kümelenmez)
- Zaman makinesi ve arşiv sayfasında görünür
- Arama sonuçlarında tam metin aramasıyla bulunabilir (PostgreSQL GIN index)
- Kaynak profil sayfasında makale sayısına eklenir

---

## Bölüm 3 — Import Komutu Kullanımı

### Kurulum

```bash
# 1. Projeye git
cd /var/www/medyaizle/backend

# 2. Komutu çalıştır (önce dry-run ile test et)
php artisan haber:import-json /path/to/data.json --dry-run

# 3. Gerçek import
php artisan haber:import-json /path/to/data.json

# 4. JSONL formatı için
php artisan haber:import-json /path/to/articles.jsonl --format=jsonl

# 5. Tarih filtresi ile (sadece son 90 gün)
php artisan haber:import-json /path/to/data.json --from-date=2024-01-06

# 6. Belirli kaynaktan
php artisan haber:import-json /path/to/data.json --source-slug=haberturk
```

### Seçenekler

| Seçenek | Açıklama | Örnek |
|---------|----------|-------|
| `--dry-run` | Kaydetmeden test et, istatistik göster | `--dry-run` |
| `--format` | `json` (varsayılan) veya `jsonl` | `--format=jsonl` |
| `--from-date` | Bu tarihten eski makaleleri atla | `--from-date=2024-01-01` |
| `--source-slug` | Sadece bu kaynağı işle | `--source-slug=haberturk` |
| `--no-embed` | Embedding üretimini atla (arşiv modu) | `--no-embed` |
| `--batch-size` | Kaç makalede bir commit (varsayılan: 500) | `--batch-size=1000` |
| `--limit` | Toplam kaç makale import et | `--limit=10000` |

---

## Bölüm 4 — Kaynak Yönetimi

### Yeni Kaynak Ekleme Kuralları

Import sırasında `source.slug` veritabanında bulunamazsa **otomatik oluşturulur**:

```php
// Otomatik oluşturulan kaynak değerleri:
importance_score = 0     // Cron ÇEKMEZ (kasıtlı)
is_active        = true  // Sitede görünür, Kaynaklar sayfasında listelenir
rss_url          = ''    // RSS yok (manuel import)
```

**Sonuç:** Bu kaynaklar cron tarafından otomatik çekilmez, sadece import edilen verilerle dolar.

### Mevcut Kaynak Güncelleme

Eğer `source.slug` zaten varsa kaynak bilgileri **güncellenmez** (sadece article insert yapılır). Kaynak bilgilerini güncellemek için admin paneli kullan: `/admin/kaynaklar`

### Desteklenen Ülke Kodları

| Kod | Ülke | Bayrağı |
|-----|------|---------|
| TR | Türkiye | 🇹🇷 |
| US | ABD | 🇺🇸 |
| GB | İngiltere | 🇬🇧 |
| DE | Almanya | 🇩🇪 |
| RU | Rusya | 🇷🇺 |
| CN | Çin | 🇨🇳 |
| IR | İran | 🇮🇷 |
| IL | İsrail | 🇮🇱 |
| SA | Suudi Arabistan | 🇸🇦 |
| EG | Mısır | 🇪🇬 |

Bu liste dışındaki ülke kodları için makale import edilir ama clustering ve analiz sırasında `related_countries` kapsamı dışında kalır.

---

## Bölüm 5 — Embedding Pipeline

### Nasıl Çalışır?

```
Article (title + summary[:500])
         │
         ▼
  md5(title + summary) ile hash
         │
    ┌────┴────┐
  Aynı hash  Farklı hash
  var mı?        │
    │ EVET       ▼
    │      Gemini API: gemini-embedding-001
    │      batchEmbedContents (100 metin/istek)
    │             │
    └─────────────┘
         │
         ▼
  embedding = [float × 768]  →  articles.embedding
```

### Maliyet ve Süre Tahmini

| Veri Miktarı | Free Tier (1.500/gün) | Paid Tier (gün başı ~30K) |
|-------------|----------------------|--------------------------|
| 10.000 makale | ~7 gün | ~yarım gün |
| 100.000 makale | ~67 gün | ~3-4 gün |
| 1.000.000 makale | ~667 gün ❌ | ~33 gün |

**Öneri:** 1M makale için sadece son 90 günü (≈50K-100K) embed'le, gerisini arşiv modda tut.

### Embedding Komutu

```bash
# Import sonrası embedding üret (son 24 saat)
php artisan haber:embed

# Import edilen tüm tarihlere embedding üret (yavaş!)
php artisan haber:embed --all

# Belirli tarihten sonrasına embedding üret
php artisan haber:embed --from-date=2024-01-01

# Sadece belirli kaynağın makalelerine
php artisan haber:embed --source-slug=haberturk
```

**Rate Limit Yönetimi:** Komut otomatik olarak:
- Her 50 batch'te 5 saniye bekler
- 429 (Rate Limit) hatasında exponential backoff uygular (10s → 20s → 40s → 60s)
- İnterrupt (Ctrl+C) gelirse kaldığı yerden devam edebilir

---

## Bölüm 6 — Clustering (Kümeleme)

### Kümeleme Nasıl Çalışır?

**Amaç:** Aynı konuyu işleyen haberleri bir "Event" (olay) altında toplamak.

```
Makale A: "Türkiye ile İsrail arasında diplomatik kriz" (TR kaynağı)
Makale B: "Turkey-Israel diplomatic row deepens" (US kaynağı)
Makale C: "İsrail Büyükelçisi Ankara'dan çağrıldı" (TR kaynağı)
        ↓  cosine similarity ≥ 0.82
    → Aynı Event'e gruplandı
```

### Koşullar

Bir grubun Event olabilmesi için:
- **Seçenek A:** En az **2 farklı ülke** kaynağı içermeli
- **Seçenek B:** Türkiye'den hem `pro_gov` hem `opposition` kaynak içermeli (kutuplaşma)

Tek ülke, tek bias → Event oluşturulmaz.

### Kümeleme Komutu

```bash
# Normal clustering (son 7 gün, 2000 makale limit)
php artisan haber:cluster

# Import sonrası büyük veri için geniş pencere
php artisan haber:cluster --days=30 --limit=10000

# Sadece belirli tarih aralığı
php artisan haber:cluster --from=2024-01-01 --to=2024-03-31
```

**Gereksinim:** Python 3 ve NumPy kurulu olmalı:
```bash
pip install numpy scipy
```

---

## Bölüm 7 — Event Analizi (Gemini AI)

### Analiz Ne Üretir?

Her Event için Gemini'ye şu üretilir:

| Alan | Açıklama | Örnek |
|------|----------|-------|
| `title_tr` | Türkçe kısa başlık (≤120 char) | "Türkiye-İsrail Gerilimi Büyükelçi Krizine Döndü" |
| `summary_tr` | 8-10 cümlelik tarafsız özet | "Türk makamları... İsrail ise..." |
| `category` | Kategori | `diplomasi` |
| `is_turkey_related` | Türkiye ile ilgili mi? | `true` / `false` |
| `related_countries` | İlgili ülke kodları | `["TR", "IL", "US"]` |

### Analiz Komutu

```bash
# Standart (200 event limit)
php artisan haber:analyze

# Import sonrası toplu analiz
php artisan haber:analyze --limit=500

# Sadece belirli tarihten sonraki eventler
# (status='pending' olanları otomatik bulur)
php artisan haber:analyze --limit=1000
```

**Maliyet:** Gemini 2.5-flash — Free tier: 250 istek/gün → ~250 event/gün
**Süre:** 1000 event → ~4 gün (free tier)

---

## Bölüm 8 — Import Sonrası Sıralama (Adım Adım)

```bash
# ADIM 1: Kaynakları ve makaleleri import et
php artisan haber:import-json /data/haberler.json --from-date=2024-01-01

# ADIM 2: Embedding üret (sadece son 90 gün)
php artisan haber:embed --from-date=$(date -d '90 days ago' +%Y-%m-%d)

# ADIM 3: Kümele (son 30 gün — embed olmayan atlanır)
php artisan haber:cluster --days=30 --limit=5000

# ADIM 4: Eventleri analiz et (Türkçe başlık/özet üret)
php artisan haber:analyze --limit=500

# ADIM 5: (Opsiyonel) Ülke sınıflandırmasını tamamla
php artisan haber:classify-countries --limit=100

# ADIM 6: Cache temizle (yeni veriler anasayfaya yansısın)
php artisan cache:clear
```

---

## Bölüm 9 — Büyük Veri için Önerilen Strateji

### Senaryo: 1M Türkçe Makale, ~500 Kaynak

**Faz 1 — Kaynak ve Makale Insert (hızlı, ~2-4 saat)**
```bash
# Tüm veriyi arşiv modda (embedding yok) import et
php artisan haber:import-json /data/all.jsonl \
  --format=jsonl \
  --no-embed \
  --batch-size=1000

# Çıktı örneği:
# Sources created: 312, existing: 188
# Articles inserted: 987,432, skipped (duplicate): 12,568
# Duration: 3h 12m
```

**Faz 2 — Son 90 Günü Tam Pipeline'a Al (~33 gün, Paid Tier)**
```bash
# Embedding: ~50K-100K makale
php artisan haber:embed --from-date=$(date -d '90 days ago' +%Y-%m-%d)

# Kümeleme
php artisan haber:cluster --days=90 --limit=20000

# Analiz: ~3K-5K event
php artisan haber:analyze --limit=500
# Her gün 250 event → ~15-20 gün
```

**Sonuç:**
- Arşiv (90 günden eski): ~900K makale — arama ve arşiv sayfasında görünür
- Aktif (son 90 gün): ~100K makale — tam clustering + AI analiz
- Tahmini Event sayısı: 2.000-5.000 yayında event

---

## Bölüm 10 — Sık Karşılaşılan Sorunlar

### "Embedding is NULL, article not clustering"
**Neden:** Makale `haber:embed` çalışmadan önce insert edildi.
**Çözüm:** `php artisan haber:embed --all` (tüm NULL embeddingleri doldurur)

### "Event oluşmuyor, makaleler cluster'a girmiyor"
**Neden:** Tüm makaleler aynı ülkeden → Event koşulu sağlanmıyor.
**Çözüm:** Birden fazla ülkeden kaynak gerekir. Tek ülke verisi arşivde kalır.

### "published_at parse error"
**Neden:** Tarih formatı tanınmıyor.
**Çözüm:** Import öncesi tüm tarihleri ISO 8601'e dönüştür:
```python
from dateutil import parser
dt = parser.parse("15 Mart 2024 14:30")
print(dt.isoformat())  # 2024-03-15T14:30:00
```

### "Duplicate URL, skip edildi ama farklı kaynak"
**Neden:** Aynı haber URL'si birden fazla kaynakta.
**Çözüm:** URL birincil dedup anahtarı — tasarım gereği. Aynı URL ikinci kez insert edilmez.

### "Gemini 429 — Rate Limit"
**Neden:** Free tier aşıldı.
**Çözüm:** Komut otomatik bekler. Manuel olarak durdurup yarın devam edebilirsin — kaldığı yerden devam eder.

### "Image gösterilmiyor"
**Neden:** Resim ≤300px veya URL erişilemez.
**Çözüm:** Bu beklenen davranış — site küçük resimleri kasıtlı göstermiyor. `image_url` alanını doldururken büyük (≥400px) görseller kullan.

---

## Özet

| Adım | Komut | Süre (1M veri) | Maliyet |
|------|-------|----------------|---------|
| Import | `haber:import-json` | 3-4 saat | $0 |
| Embedding (son 90 gün) | `haber:embed` | 33 gün (free) / 3-4 gün (paid) | ~$5-10 |
| Clustering | `haber:cluster` | 1-2 saat | $0 (Python) |
| Analiz | `haber:analyze` | 15-20 gün (free) | $0 (free tier) |
| **Toplam** | | **~50 gün (free)** | **~$5-10** |
