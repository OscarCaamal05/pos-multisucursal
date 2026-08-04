<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Yajra\DataTables\Facades\DataTables;
use App\Services\Sales\SaleAdjustmentService;
use Illuminate\Support\Facades\Log;

class SalesDetailsController extends Controller
{
    public function __construct(
        SaleAdjustmentService $saleAdjustmentService
    ) {
        $this->saleAdjustmentService = $saleAdjustmentService;
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        if ($request->ajax()) {
            $query = (new Sale)->getDetails();

            // Filtrar por selects

            // Filtrar por comprobante
            if ($request->has('voucher_id') && $request->voucher_id !== 'all-voucher' && $request->voucher_id !== '') {
                $query->where('s.voucher_id', $request->voucher_id);
            }

            // Filtrar por método de pago
            if ($request->filled('payment_method') && $request->payment_method !== 'all-payment-method') {
                $method = $request->payment_method;

                $query->whereExists(function ($sub) use ($method) {
                    $sub->select(DB::raw(1))
                        ->from('payment_methods as pm2')
                        ->whereColumn('pm2.transaction_id', 's.id')
                        ->where('pm2.transaction_type', 'sale')
                        ->where('pm2.payment_method', $method);
                });
            }

            // Filtrar por estado
            if ($request->has('status') && $request->status !== 'all-status' && $request->status !== '') {
                $query->where('s.status', $request->status); // ← Cambiar de 'p.status' a 'p.is_active'
            }

            // Filtrar por rango de fechas
            if ($request->filled('start_date') && $request->filled('end_date')) {
                $query->whereDate('s.sale_date', '>=', $request->start_date)
                    ->whereDate('s.sale_date', '<=', $request->end_date);
            }

            return DataTables::of($query)
                // Definir las columnas searchables correctamente
                ->filterColumn('customer_name', function ($query, $keyword) {
                    $query->whereRaw("LOWER(c.name) LIKE LOWER(?)", ["%{$keyword}%"]);
                })
                ->filterColumn('voucher_name', function ($query, $keyword) {
                    $query->whereRaw("LOWER(tr.name) LIKE LOWER(?)", ["%{$keyword}%"]);
                })
                ->make(true);
        }

        // Obtener los valores para los selects de filtros
        $typeReceipts = DB::table('types_receipts')->select('id', 'name')->get();
        $statuses = DB::table('sales')->select('status')->distinct()->get();

        return view('sales.index', compact('typeReceipts', 'statuses'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Sale $sale)
    {
        try {
            // Carga la venta con sus relaciones
            $sale->load(['customer', 'user', 'voucher', 'details', 'payments']);

            return response()->json([
                'sale'     => $sale
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener los detalles de la venta.'], 500);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Sale $sale)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Sale $sale)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sale $sale)
    {
        //
    }

    /**
     * Anular una venta y revertir los cambios en el inventario y los pagos.
     */
    public function annul(Sale $sale)
    {
        try {
            $updatedSale = $this->saleAdjustmentService->annul($sale);
            return response()->json([
                'success' => true,
                'message' => 'Venta anulada correctamente.',
                'sale'    => $updatedSale
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al anular la venta: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Return a product from a sale and update the inventory accordingly.
     */
    public function returnProduct(Request $request, Sale $sale, int $productId)
    {
        try {
            $saleDetail = $sale->details()->where('product_id', $productId)->firstOrFail();

            $quantity = (float) $request->input('quantity', $saleDetail->quantity);
            $updatedDetail = $this->saleAdjustmentService->returnProduct($sale, $saleDetail, $quantity);

            Log::info("Producto devuelto: Sale ID {$sale->id}, SaleDetail ID {$saleDetail->id}, Cantidad devuelta: {$quantity}");

            return response()->json([
                'success' => true,
                'message' => 'Producto devuelto correctamente.',
                'detail'  => $updatedDetail,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'El producto no pertenece a esta venta.'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al devolver el producto: ' . $e->getMessage()], 500);
        }
    }

}
