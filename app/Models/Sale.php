<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Models\Branches;
use App\Models\Customer;
use App\Models\User;
use App\Models\SaleDetail;
use App\Models\TypesReceipts;
use App\Models\PaymentMethods;

class Sale extends Model
{
    protected $table = 'sales';

    protected $fillable = [
        'id',
        'user_id',
        'customer_id',
        'voucher_id',
        'document_id',
        'branch_id',
        'sale_date',
        'invoice_number',
        'amount_paid',
        'subtotal',
        'discount',
        'tax',
        'total_amount',
        'status',
        'is_fully_paid',
        'notes'
    ];

    // Relación con Customer
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    // Relación con User (vendedor)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Relación con los detalles de la venta
    public function details(): HasMany
    {
        return $this->hasMany(SaleDetail::class, 'sale_id');
    }

    // Relación con el tipo de comprobante
    public function voucher(): BelongsTo
    {
        return $this->belongsTo(TypesReceipts::class, 'voucher_id');
    }

    // Relación con las ventas
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branches::class, 'branch_id');
    }

    public function payments()
    {
        return $this->hasMany(PaymentMethods::class, 'transaction_id')
            ->where('transaction_type', 'sale');
    }

    // ===== SCOPES =====

    // Filtra por sucursal
    public function scopeByBranch(Builder $query, int $branchId): Builder
    {
        return $query->where('branch_id', $branchId);
    }

    // Filtra por rango de fechas
    public function scopeByDateRange(Builder $query, string $from, string $to): Builder
    {
        return $query->whereBetween('sale_date', [$from, $to]);
    }


    // Solo ventas de contado
    public function scopeCash(Builder $query): Builder
    {
        return $query->where('is_fully_paid', true)
            ->where('status', 'procesado');
    }

    // Solo ventas a crédito
    public function scopeCredit(Builder $query): Builder
    {
        return $query->where('is_fully_paid', false)
            ->where('status', 'procesado');
    }

    // Solo ventas anuladas
    public function scopeCanceled(Builder $query): Builder
    {
        return $query->where('status', 'anulado');
    }

    // Ventas procesadas (excluye anuladas)
    public function scopeProcessed(Builder $query): Builder
    {
        return $query->where('status', 'procesado');
    }

    // Filtra por mes y año
    public function scopeByMonth(Builder $query, int $year, int $month): Builder
    {
        return $query->whereYear('sale_date', $year)
            ->whereMonth('sale_date', $month);
    }
    //Metodo para obtener los registros de ventas para mostrarlo en el datatable
    public function getDetails()
    {

        $branchId = Auth::user()->defaultBranchId();

        return DB::table('sales as s')
            ->join('customers as c', 's.customer_id', '=', 'c.id')
            ->join('types_receipts as tr', 's.voucher_id', '=', 'tr.id')
            ->leftJoin('payment_methods as pm', function ($join) {
                $join->on('s.id', '=', 'pm.transaction_id')
                    ->where('pm.transaction_type', '=', 'sale');
            })
            ->select(
                's.id',
                's.voucher_id',
                'tr.name as voucher_name',
                's.invoice_number',
                'c.name as customer_name',
                's.total_amount',
                's.amount_paid',
                's.sale_date',
                's.is_fully_paid',
                's.status',
                DB::raw("
                CASE 
                    WHEN COUNT(pm.payment_method) > 1 THEN 'Múltiple'
                    
                    ELSE MAX(pm.payment_method)
                END as payment_method
            "),
            )
            ->where('s.document_id', 1)
            ->where('s.branch_id', $branchId)
            ->orderBy('s.id', 'desc')
            ->orderBy('s.sale_date', 'desc')
            ->groupBy(
                's.id',
                'tr.name',
                's.invoice_number',
                'c.name',
                's.total_amount',
                's.amount_paid',
                's.sale_date',
                's.is_fully_paid',
                's.status',
            );
    }
}
