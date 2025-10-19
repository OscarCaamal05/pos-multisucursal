<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TempSaleDetail extends Model
{
    protected $primaryKey = 'id_temp_sale_detail';
    protected $fillable = [
        'temp_sale_id',
        'product_id',
        'product_name',
        'barcode',
        'price',
        'factor',
        'quantity',
        'discount',
        'total',
        'unit_id',
        'unit_name',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function tempSale()
    {
        return $this->belongsTo(TempSale::class);
    }
    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
}
