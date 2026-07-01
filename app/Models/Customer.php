<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'code',
        'name',
        'tax_id',
        'address',
        'phone',
        'email',
        'credit_limit',
        'credit_used',
        'credit_available',
        'credit_due_date',
        'default_credit_days',
        'payment_frequency',
        'payment_day_of_month',
        'interest_rate',
        'late_fee',
        'grace_period_days',
        'status'
    ];
}
