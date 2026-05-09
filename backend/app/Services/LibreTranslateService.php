<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LibreTranslateService
{
    private string $baseUrl;

    private const LANG_MAP = [
        'zh' => 'zh-Hans',
    ];

    private const SUPPORTED = ['en', 'tr', 'de', 'ru', 'zh-Hans', 'ar', 'fa', 'he'];

    public function __construct()
    {
        $this->baseUrl = env('LIBRETRANSLATE_URL', 'http://127.0.0.1:5000');
    }

    public function translate(string $text, string $sourceLang, string $targetLang = 'tr'): ?string
    {
        $source = self::LANG_MAP[$sourceLang] ?? $sourceLang;
        $target = self::LANG_MAP[$targetLang] ?? $targetLang;

        if ($source === $target) return $text;
        if (!in_array($source, self::SUPPORTED) || !in_array($target, self::SUPPORTED)) {
            Log::warning("LibreTranslate: dil destelenmiyor source={$source} target={$target}");
            return null;
        }

        try {
            $response = Http::timeout(60)->asJson()->post("{$this->baseUrl}/translate", [
                'q'      => $text,
                'source' => $source,
                'target' => $target,
                'format' => 'text',
            ]);

            if ($response->successful()) {
                return $response->json('translatedText');
            }

            Log::error("LibreTranslate failed: HTTP {$response->status()} - " . $response->body());
        } catch (\Exception $e) {
            Log::error('LibreTranslate exception: ' . $e->getMessage());
        }

        return null;
    }

    public function isHealthy(): bool
    {
        try {
            return Http::timeout(5)->get("{$this->baseUrl}/languages")->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}
