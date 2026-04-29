<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private string $apiKey;
    private string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    public function __construct()
    {
        $this->apiKey = \Illuminate\Support\Facades\DB::table('admin_settings')
            ->where('key', 'gemini_api_key')->value('value')
            ?? env('GEMINI_API_KEY', '');
    }

    public function embed(string $text): ?array
    {
        try {
            $response = Http::post("{$this->baseUrl}/models/gemini-embedding-001:embedContent?key={$this->apiKey}", [
                'content' => ['parts' => [['text' => mb_substr($text, 0, 2000)]]],
            ]);

            if ($response->successful()) {
                return $response->json('embedding.values');
            }
            Log::error('Gemini embed failed: HTTP ' . $response->status() . ' - ' . $response->body());
        } catch (\Exception $e) {
            Log::error('Gemini embed error: ' . $e->getMessage());
        }
        return null;
    }

    // Sabit model: gemini-2.5-flash
    // Paid Tier 1: 1000 RPM, 10K RPD, 1M context
    // Test edildi: 2026-04-01, çalışıyor. Değiştirme.
    private const MODEL = 'gemini-2.5-flash';

    public function generate(string $prompt, int $maxOutputTokens = 2048): ?string
    {
        for ($attempt = 0; $attempt < 2; $attempt++) {
            try {
                $response = Http::timeout(30)->post(
                    "{$this->baseUrl}/models/" . self::MODEL . ":generateContent?key={$this->apiKey}",
                    [
                        'contents'         => [['parts' => [['text' => $prompt]]]],
                        'generationConfig' => ['temperature' => 0.7, 'maxOutputTokens' => $maxOutputTokens],
                    ]
                );

                if ($response->successful()) {
                    return $response->json('candidates.0.content.parts.0.text');
                }

                if ($response->status() === 429) {
                    usleep(500000);
                    continue;
                }

                Log::warning('Gemini generate failed: HTTP ' . $response->status() . ' - ' . $response->body());
                return null;

            } catch (\Exception $e) {
                Log::error('Gemini generate error: ' . $e->getMessage());
                return null;
            }
        }

        return null;
    }

    public function batchEmbed(array $texts): array
    {
        try {
            $requests = array_map(fn($text) => [
                'model' => 'models/gemini-embedding-001',
                'content' => ['parts' => [['text' => mb_substr($text, 0, 2000)]]],
            ], $texts);

            $response = Http::timeout(60)->post("{$this->baseUrl}/models/gemini-embedding-001:batchEmbedContents?key={$this->apiKey}", [
                'requests' => $requests,
            ]);

            if ($response->successful()) {
                return array_map(fn($e) => $e['values'] ?? null, $response->json('embeddings') ?? []);
            }

            Log::error('Gemini batchEmbed failed: HTTP ' . $response->status() . ' - ' . $response->body());
        } catch (\Exception $e) {
            Log::error('Gemini batchEmbed error: ' . $e->getMessage());
        }
        return [];
    }

    public function generateEventTitle(array $titles): string
    {
        $titlesText = implode("\n", array_slice($titles, 0, 10));
        $prompt = "Aşağıdaki haber başlıklarını analiz et ve bu haberlerin hepsini kapsayan, KESİNLİKLE TÜRKÇE DİLİNDE, kısa ve net bir başlık oluştur. SADECE TÜRKÇE BAŞLIĞI YAZ, başka hiçbir şey yazma. İngilizce veya başka bir dil kullanma.\n\nHaberler:\n{$titlesText}";

        return $this->generate($prompt) ?? $titles[0];
    }

    public function generateEventSummary(string $title, array $summaries): string
    {
        $summaryText = implode("\n---\n", array_slice($summaries, 0, 8));
        $prompt = "Başlık: {$title}\n\nAşağıdaki haber kaynaklarından yola çıkarak tarafsız, bilgilendirici ve kapsamlı, KESİNLİKLE TÜRKÇE DİLİNDE bir özet yaz.\n\nKurallar:\n- KESİNLİKLE TÜRKÇE YAZ (İngilizce kullanma).\n- En az 10, en fazla 15 cümle yaz\n- Olayın kim, ne, nerede, ne zaman, neden ve nasıl sorularını yanıtla\n- Farklı kaynakların vurguladığı önemli ayrıntıları dahil et\n- Tarafsız bir dil kullan, yorum yapma\n- Sadece özeti yaz, başka hiçbir şey ekleme\n\nKaynaklar:\n{$summaryText}";

        return $this->generate($prompt) ?? '';
    }

    public function detectCategory(string $title): string
    {
        $categories = ['siyaset', 'ekonomi', 'savas-catisma', 'diplomasi', 'teknoloji', 'saglik', 'cevre', 'spor', 'kultur', 'diger'];
        $catList = implode(', ', $categories);
        $prompt = "Şu haber başlığını kategorize et: \"{$title}\"\n\nKategoriler: {$catList}\n\nSadece kategori adını yaz.";

        $result = trim($this->generate($prompt) ?? '');
        if (!empty($result) && in_array($result, $categories)) {
            return $result;
        }

        // Keyword-based fallback
        return $this->categoryByKeywords($title);
    }

    public function categoryByKeywords(string $title): string
    {
        $title = mb_strtolower($title);

        $map = [
            'savas-catisma' => ['war', 'attack', 'kill', 'bomb', 'military', 'missile', 'troops', 'ceasefire', 'conflict', 'battle', 'offensive', 'ground operation', 'ground forces', 'airstrike', 'strike', 'invasion', 'occupation', 'displaced', 'casualt', 'hostage', 'hamas', 'hezbollah', 'gaza', 'lebanon', 'ukraine', 'saldır', 'savaş', 'çatışma', 'askeri', 'füze', 'drone', 'operasyon'],
            'siyaset'       => ['trump', 'biden', 'harris', 'putin', 'netanyahu', 'president', 'election', 'congress', 'parliament', 'senate', 'vote', 'government', 'minister', 'white house', 'kremlin', 'seçim', 'cumhurbaşkanı', 'meclis', 'hükümet', 'bakan', 'parti'],
            'ekonomi'       => ['economy', 'gdp', 'inflation', 'recession', 'dollar', 'market', 'tariff', 'trade', 'bank', 'stock', 'oil price', 'oil market', 'barrel', 'energy', 'sanctions', 'budget', 'debt', 'economic', 'ekonomi', 'enflasyon', 'piyasa', 'dolar', 'banka', 'vergi', 'petrol', 'enerji'],
            'diplomasi'     => ['diplomacy', 'summit', 'treaty', 'sanction', 'ambassador', 'negotiation', 'agreement', 'diplomatic', 'talks', 'deal', 'alliance', 'nato', 'un ', 'united nations', 'anlaşma', 'görüşme', 'müzakere', 'büyükelçi'],
            'teknoloji'     => ['ai', 'tech', 'artificial intelligence', 'robot', 'software', 'cyber', 'computer', 'internet', 'chip', 'teknoloji', 'yapay zeka'],
            'saglik'        => ['health', 'virus', 'disease', 'vaccine', 'hospital', 'cancer', 'pandemic', 'sağlık', 'aşı', 'hastalık', 'hasta'],
            'cevre'         => ['climate', 'environment', 'carbon', 'emission', 'wildfire', 'flood', 'drought', 'earthquake', 'çevre', 'iklim', 'deprem', 'sel'],
            'spor'          => ['football', 'soccer', 'basketball', 'olympic', 'world cup', 'sport', 'champion', 'spor', 'futbol', 'şampiyona', 'maç'],
            'kultur'        => ['film', 'movie', 'music', 'award', 'art', 'culture', 'book', 'festival', 'kültür', 'sanat', 'müzik', 'ödül'],
        ];

        foreach ($map as $category => $keywords) {
            foreach ($keywords as $word) {
                if (str_contains($title, $word)) {
                    return $category;
                }
            }
        }

        return 'diger';
    }

    public function generateCountryAnalysis(int $eventId, string $countryCode, string $eventTitle, array $proGovArticles, array $oppositionArticles): array
    {
        $COUNTRIES = [
            'TR' => 'Türkiye', 'US' => 'ABD', 'GB' => 'İngiltere', 'DE' => 'Almanya',
            'RU' => 'Rusya', 'CN' => 'Çin', 'IR' => 'İran', 'IL' => 'İsrail',
            'SA' => 'Suudi Arabistan', 'EG' => 'Mısır',
        ];
        $countryName = $COUNTRIES[$countryCode] ?? $countryCode;

        $proText = implode("\n---\n", array_map(fn($a) => "{$a['source']}: {$a['title']}\n{$a['summary']}", $proGovArticles));
        $oppText = implode("\n---\n", array_map(fn($a) => "{$a['source']}: {$a['title']}\n{$a['summary']}", $oppositionArticles));

        $prompt = "Konu: {$eventTitle}\n\n{$countryName} medyasının bu konuyu nasıl ele aldığını analiz et.\n\nYANDAŞ MEDYA haberleri:\n{$proText}\n\nMUHALİF MEDYA haberleri:\n{$oppText}\n\nLütfen şu formatta KESİNLİKLE TÜRKÇE analiz yaz (İngilizce kelime kullanma!):\n\nYANDAŞ_ÖZET:\n[Yandaş medyanın bakış açısını 5-10 cümleyle özetle]\n\nMUHALİF_ÖZET:\n[Muhalif medyanın bakış açısını 5-10 cümleyle özetle]\n\nKONSENSÜS:\n[Her iki tarafın hemfikir olduğu noktaları 2-3 cümleyle yaz]\n\nYANDAŞ_PROPAGANDA:[0-10 arası tam sayı]\nYANDAŞ_DUYGU:[0-10 arası tam sayı]\nYANDAŞ_OLGU:[0-10 arası tam sayı]\nYANDAŞ_ÇEŞIT:[0-10 arası tam sayı]\nYANDAŞ_RETORİK:[virgülle ayrılmış liste; kullanılanlar: fear,nationalism,whataboutism,ad_hominem,misleading_headline,selective_quoting,demonization,exaggeration — yoksa boş bırak]\n\nMUHALİF_PROPAGANDA:[0-10 arası tam sayı]\nMUHALİF_DUYGU:[0-10 arası tam sayı]\nMUHALİF_OLGU:[0-10 arası tam sayı]\nMUHALİF_ÇEŞIT:[0-10 arası tam sayı]\nMUHALİF_RETORİK:[virgülle ayrılmış liste]\n\nYANDAŞ_KELİMELER:[yandaş medyanın öne çıkardığı 10 Türkçe anahtar kelime şu formatta: kelime:adet:duygu — duygu için pos/neg/neu kullan, örnek: savaş:8:neg,barış:3:pos]\nMUHALİF_KELİMELER:[muhalif medyanın öne çıkardığı 10 Türkçe anahtar kelime şu formatta: kelime:adet:duygu]";

        $response = $this->generate($prompt, 8192);

        if (!$response) {
            return [
                'proGovSummary' => 'Analiz şu anda mevcut değil.',
                'oppositionSummary' => 'Analiz şu anda mevcut değil.',
                'consensus' => 'Analiz üretilemedi.',
                'propagandaScores' => null,
                'wordFrequencies' => [],
            ];
        }

        $proGovSummary = '';
        $oppositionSummary = '';
        $consensus = '';

        if (preg_match('/YANDAŞ_ÖZET:\s*(.*?)(?=MUHALİF_ÖZET:|$)/s', $response, $m)) {
            $proGovSummary = trim($m[1]);
        }
        if (preg_match('/MUHALİF_ÖZET:\s*(.*?)(?=KONSENSÜS:|$)/s', $response, $m)) {
            $oppositionSummary = trim($m[1]);
        }
        if (preg_match('/KONSENSÜS:\s*(.*?)(?=YANDAŞ_PROPAGANDA:|$)/s', $response, $m)) {
            $consensus = trim($m[1]);
        }

        // Parse propaganda scores
        $propagandaScores = null;
        $pg = []; $op = [];
        if (preg_match('/YANDAŞ_PROPAGANDA:\s*(\d+)/', $response, $m)) $pg['propaganda'] = (int)$m[1];
        if (preg_match('/YANDAŞ_DUYGU:\s*(\d+)/', $response, $m))     $pg['emotion']    = (int)$m[1];
        if (preg_match('/YANDAŞ_OLGU:\s*(\d+)/', $response, $m))      $pg['factual']    = (int)$m[1];
        if (preg_match('/YANDAŞ_ÇEŞIT:\s*(\d+)/', $response, $m))     $pg['diversity']  = (int)$m[1];
        if (preg_match('/YANDAŞ_RETORİK:\s*([^\n]*)/', $response, $m)) {
            $pg['rhetoric'] = array_values(array_filter(array_map('trim', explode(',', $m[1]))));
        }
        if (preg_match('/MUHALİF_PROPAGANDA:\s*(\d+)/', $response, $m)) $op['propaganda'] = (int)$m[1];
        if (preg_match('/MUHALİF_DUYGU:\s*(\d+)/', $response, $m))     $op['emotion']    = (int)$m[1];
        if (preg_match('/MUHALİF_OLGU:\s*(\d+)/', $response, $m))      $op['factual']    = (int)$m[1];
        if (preg_match('/MUHALİF_ÇEŞIT:\s*(\d+)/', $response, $m))     $op['diversity']  = (int)$m[1];
        if (preg_match('/MUHALİF_RETORİK:\s*([^\n]*)/', $response, $m)) {
            $op['rhetoric'] = array_values(array_filter(array_map('trim', explode(',', $m[1]))));
        }
        if (!empty($pg) || !empty($op)) {
            $propagandaScores = ['pro_gov' => $pg ?: null, 'opposition' => $op ?: null];
        }

        // Parse word frequencies (two separate lists for pro_gov and opposition)
        $parseWords = function(string $raw): array {
            $words = [];
            foreach (explode(',', $raw) as $entry) {
                $parts = array_map('trim', explode(':', $entry));
                if (count($parts) >= 2 && is_numeric($parts[1])) {
                    $sentStr = $parts[2] ?? 'neu';
                    $sentNum = $sentStr === 'pos' ? 1 : ($sentStr === 'neg' ? -1 : 0);
                    $words[] = ['word' => $parts[0], 'count' => (int)$parts[1], 'sentiment' => $sentNum];
                }
            }
            return $words;
        };
        $proGovWords = [];
        $oppositionWords = [];
        if (preg_match('/YANDAŞ_KELİMELER:\s*([^\n]+)/', $response, $m)) $proGovWords = $parseWords($m[1]);
        if (preg_match('/MUHALİF_KELİMELER:\s*([^\n]+)/', $response, $m)) $oppositionWords = $parseWords($m[1]);
        $wordFrequencies = ['pro_gov' => $proGovWords, 'opposition' => $oppositionWords];

        return compact('proGovSummary', 'oppositionSummary', 'consensus', 'propagandaScores', 'wordFrequencies');
    }
}
