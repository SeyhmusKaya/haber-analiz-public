<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model {
    protected $fillable = ['title_tr', 'summary_tr', 'long_summary_tr', 'category', 'importance_score', 'status', 'centroid', 'retry_count', 'analyzed_at', 'is_turkey_related', 'related_countries'];
    protected $casts = ['centroid' => 'array', 'related_countries' => 'array'];

    public function articles(): BelongsToMany {
        return $this->belongsToMany(Article::class, 'event_articles');
    }
    public function analyses(): HasMany {
        return $this->hasMany(Analysis::class);
    }
}
