<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'full_name',
        'rfc',
        'address',
        'phone',
        'email',
        'credit',
        'credit_available',
        'status'
    ];
}
