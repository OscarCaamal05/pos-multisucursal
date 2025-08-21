<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class purchases extends Model
{
    protected $fillable = [
        'supplier_id',
        'user_id',
        'vouncher_id',
        'document_id',
        'purchase_date',
        'invoice_number',
        'tax',
        'subtotal',
        'total_amount',
        'amount_paid',
        'is_fully_paid',
        'status',
        'notes',
    ];

    // Relación con el proveedor
    public function supplier() {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }
    
    // Relación con el usuario
    public function user() {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    // Relación con los detalles de la compra
    public function purchaseDetails() {
        return $this->hasMany(purchases_detail::class, 'purchase_id', 'id');
    }

    // Relación con los metodos de pago
    public function paymentMethods() {
        return $this->hasMany(payment_method::class, 'transaction_id', 'id')
            ->where('transaction_type', 'purchase');
    }
}