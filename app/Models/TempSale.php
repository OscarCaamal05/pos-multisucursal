<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TempSale extends Model
{
    protected $primaryKey = 'id_temp_sale';
    protected $fillable = [
        'user_id',
        'status',
        'session_token',
        'discount',
        'customer_id',
        'folio',
        'voucher_id'
    ];

    public static function getPendingSales()
    {
        return DB::table('temp_sales as t')
            ->join('customers as c', 't.customer_id', '=', 'c.id')
            ->join('temp_sales_details as td', 't.id_temp_sale', '=', 'td.temp_sale_id')
            ->select(
                't.id_temp_sales',
                't.customer_id',
                'c.name as customer_name',
                't.created_at as date_created',
                DB::raw('SUM(td.total) - t.discount as total_amount')
            )
            ->where('t.status', 'en_espera')
            ->groupBy('t.id_temp_sale', 't.customer_id', 'c.name', 't.created_at');
    }

    public function details()
    {
        return $this->hasMany(tempPurchaseDetail::class, 'id');
    }
}
