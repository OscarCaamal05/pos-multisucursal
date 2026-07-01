<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    protected $table = 'sales';

    protected $fillable = [
        'id',
        'user_id',
        'customer_id',
        'voucher_id',
        'document_id',
        'sale_date',
        'invoice_number',
        'amount_paid',
        'subtotal',
        'discount',
        'tax',
        'total_amount',
        'status',
        'is_fully_paid',
        'notes'
    ];

    // Relación con Customer
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    // Relación con User (vendedor)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Relación con los detalles de la venta
    public function details(): HasMany
    {
        return $this->hasMany(SaleDetail::class, 'sale_id');
    }

    // Relación con el tipo de comprobante
    public function voucher(): BelongsTo
    {
        return $this->belongsTo(TypesReceipts ::class, 'voucher_id');
    }
}
