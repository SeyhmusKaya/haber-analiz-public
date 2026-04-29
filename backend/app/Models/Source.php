<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Source extends Model {
    protected $fillable = ['name', 'slug', 'rss_url', 'site_url', 'country_code', 'bias', 'language', 'is_active', 'importance_score', 'owner', 'funding_type', 'founded_year', 'description', 'logo_url'];

    protected $casts = [
        'last_fetched_at' => 'datetime',
    ];

    public function articles(): HasMany {
        return $this->hasMany(Article::class);
    }
}
