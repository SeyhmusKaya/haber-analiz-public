<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Article extends Model {
    protected $fillable = ['source_id', 'title', 'summary', 'url', 'url_hash', 'image_url', 'video_url', 'published_at', 'embedding'];
    protected $casts = ['embedding' => 'array', 'published_at' => 'datetime'];

    public function source(): BelongsTo {
        return $this->belongsTo(Source::class);
    }
    public function events(): BelongsToMany {
        return $this->belongsToMany(Event::class, 'event_articles');
    }
}
