<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Purchase;
use App\Models\Sale;

class PaymentMethods extends Model
{
    protected $table = 'payment_methods';
    protected $fillable = [
        'transaction_id',
        'transaction_type',
        'payment_method',
        'amount',
        'reference',
    ];

    // Relación polimórfica según la transacción
    public function purchase() {
        return $this->belongsTo(Purchase::class, 'transaction_id', 'id')
            ->where('transaction_type', 'purchase');
    }

    public function sale() {
        return $this->belongsTo(Sale::class, 'transaction_id', 'id')
            ->where('transaction_type', 'sale');
    }
}
