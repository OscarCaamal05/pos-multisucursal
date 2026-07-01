<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductTaxes extends Model
{
    protected $fillable = [
        'id',
        'product_id',
        'tax_id',
        'rate_override',
        'is_active',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function tax()
    {
        return $this->belongsTo(Taxes::class);
    }
}
