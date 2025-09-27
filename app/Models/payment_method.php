<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class payment_method extends Model
{
    protected $fillable = [
        'transaction_id',
        'transaction_type',
        'payment_method',
        'amount',
        'reference',
    ];

    // Relación polimórfica según la transacción
    public function purchase() {
        return $this->belongsTo(purchases::class, 'transaction_id', 'id')
            ->where('transaction_type', 'purchase');
    }

    public function sale() {
        return $this->belongsTo(sales::class, 'transaction_id', 'id')
            ->where('transaction_type', 'sale');
    }
}
