<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'representative',
        'company_name',
        'rfc',
        'address',
        'phone',
        'email',
        'credit',
        'credit_available',
        'credit_due_date',
        'credit_terms',
        'status'
    ];
}
