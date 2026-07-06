<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branches extends Model
{
    protected $table = 'branches';
    protected $fillable = [
        'id',
        'code',
        'name',
        'logo_path',
        'tax_id',
        'address',
        'phone',
        'email',
        'website',
        'is_setup',
        'setup_completed_at',
        'manager_id',
        'is_main',
        'is_active',
    ];

    public function inventories()
    {
        return $this->hasMany(BranchInventory::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'branch_users')
            ->withPivot('is_default')
            ->withTimestamps();
    }
}
