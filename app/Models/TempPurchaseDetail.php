<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\TempPurchase;

class TempPurchaseDetail extends Model
{
    protected $table = 'temp_purchases_details';
    protected $primaryKey = 'id_temp';
    protected $fillable = [
        'temp_purchase_id',
        'product_id',
        'product_name',
        'barcode',
        'purchase_price',
        'new_sale_price_1',
        'new_sale_price_2',
        'new_sale_price_3',
        'unit_price',
        'factor',
        'quantity',
        'discount',
        'total',
        'unit_id',
        'unit_name',
    ];

    public function tempPurchase()
    {
        return $this->belongsTo(TempPurchase::class, 'temp_purchase_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
}
