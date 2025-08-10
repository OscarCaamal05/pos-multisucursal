<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\TempPurchaseDetail;
use Illuminate\Support\Facades\DB;

class TempPurchase extends Model
{
    protected $primaryKey = 'id_temp_purchase';
    protected $fillable = [
        'user_id',
        'status',
        'session_token',
        'discount',
        'supplier_id',
    ];

    public static function getPendingPurchases()
    {
        return DB::table('temp_purchases as t')
            ->join('suppliers as s', 't.supplier_id', '=', 's.id')
            ->join('temp_purchases_details as td', 't.id_temp_purchase', '=', 'td.temp_purchase_id')
            ->select(
                't.id_temp_purchase',
                't.supplier_id',
                's.company_name',
                's.representative',
                't.created_at as date_created',
                DB::raw('SUM(td.total) - t.discount as total_amount')
            )
            ->where('t.status', 'en_espera')
            ->groupBy('t.id_temp_purchase', 't.supplier_id', 's.company_name', 's.representative', 't.created_at');
    }

    public function details()
    {
        return $this->hasMany(tempPurchaseDetail::class, 'id');
    }
}
