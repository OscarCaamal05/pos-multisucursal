<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'representative',
        'company_name',
        'tax_id',
        'address',
        'phone',
        'email',
        'credit_balance',
        'credit_limit_granted',
        'credit_available',
        'gives_credit',
        'payment_days_granted',
        'payment_frequency',
        'payment_day_of_month',
        'credit_due_date',
        'supplier_interest_rate',
        'supplier_late_fee',
        'grace_period_days',
        'early_payment_discount',
        'early_payment_days',
        'status'
    ];
}
