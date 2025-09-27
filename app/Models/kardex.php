<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class kardex extends Model
{
    protected $fillable = [
        'product_id',
        'movement_type',
        'movement_reason',
        'reference_type',
        'reference_id',
        'quantity',
        'unit_purchase_price',
        'unit_sale_price',
        'total_cost',
        'balance_quantity',
        'balance_unit_cost',
        'balance_total_cost',
        'movement_date',
    ];

    // Relación con el modelo de producto
    public function product()
    {
        return $this->belongsTo(product::class, 'product_id', 'id');
    }

    /**
     * Relación polimórfica con referencia
     */
    public function reference()
    {
        return $this->morphTo(__FUNCTION__, 'reference_type', 'reference_id');
    }
}
