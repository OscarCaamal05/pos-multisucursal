<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchInventory extends Model 
{
    protected $fillable = [
        'id',
        'branch_id',
        'product_id',
        'quantity',
        'reserved_quantity',
        'available_quantity',
        'stock_min',
        'stock_max',
        'average_cost',
        'location',
        'last_count_date',
        'last_movement_date',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
