<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $fillable = [
        'user_id', 'plan', 'status', 'transaction_id',
        'payment_link_id', 'amount', 'is_yearly', 'starts_at', 'ends_at',
    ];

    protected $casts = [
        'is_yearly'  => 'boolean',
        'starts_at'  => 'datetime',
        'ends_at'    => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->ends_at?->isFuture();
    }
}
