<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleDetail extends Model
{
    protected $table = 'sales_details';

    protected $fillable = [
        'id',
        'sale_id',
        'product_id',
        'product_name',
        'product_code',
        'quantity',
        'unit_price',
        'subtotal',
        'tax',
        'discount',
        'total',
    ];

    // Relación con Sale
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    // Relación con Product (necesaria para details.product)
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
