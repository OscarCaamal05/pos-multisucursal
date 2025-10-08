<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class purchases_detail extends Model
{
    protected $fillable = [
        'purchase_id',
        'product_id',
        'product_name',
        'product_code',
        'quantity',
        'unit_cost',
        'discount',
        'subtotal',
        'tax',
        'total',
    ];

    // Relación con la compra
    public function purchase() {
        return $this->belongsTo(purchases::class, 'purchase_id', 'id');
    }

    // Relación con el producto
    public function product() {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }
}
