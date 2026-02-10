<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Taxes extends Model
{
    protected $fillable = [
        'id',
        'name',
        'rate',
        'type',
        'is_inclusive',
        'is_active',
        'sort_order',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
