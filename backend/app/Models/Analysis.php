<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Analysis extends Model {
    protected $fillable = ['event_id', 'country_code', 'pro_gov_summary', 'opposition_summary', 'consensus', 'pro_gov_sources', 'opposition_sources', 'propaganda_scores', 'word_frequencies', 'expires_at'];
    protected $casts = ['pro_gov_sources' => 'array', 'opposition_sources' => 'array', 'propaganda_scores' => 'array', 'word_frequencies' => 'array', 'expires_at' => 'datetime'];

    public function event(): BelongsTo {
        return $this->belongsTo(Event::class);
    }
}
