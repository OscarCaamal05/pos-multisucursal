<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branches extends Model
{
    protected $fillable = [
        'id',
        'code',
        'name',
        'address',
        'phone',
        'email',
        'website',
        'manager_id',
        'is_main',
        'is_active',
    ];

    public function inventories()
    {
        return $this->hasMany(BranchInventory::class);
    }
}
