<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\TempPurchaseDetail;

class TempPurchase extends Model
{
    protected $fillable = [
        'user_id',
        'status',
        'session_token',
    ];

    public function details()
    {
        return $this->hasMany(tempPurchaseDetail::class, 'id');
    }
}
