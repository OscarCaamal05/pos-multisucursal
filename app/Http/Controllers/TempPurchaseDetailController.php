<?php

namespace App\Http\Controllers;

use App\Models\TempPurchaseDetail;
use Illuminate\Http\Request;
use App\Models\Supplier;
use App\Models\Product;
use Yajra\DataTables\Facades\DataTables;

class TempPurchaseDetailController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index() {}

    public function getDataProduct($product_id)
    {
        $product = Product::getWithDetails()->where('p.id', $product_id)->first();
        //$product = Product::findOrFail($product_id);
        return response()->json(['status' => 'get.', 'detail' => $product]);
    }

    public function addProduct(Request $request)
    {
        try {
            $request->validate([
                'temp_purchase_id' => 'required',
                'product_id' => 'required',
                //'quantity' => 'required',
            ]);
            $product = Product::getWithDetails()->where('p.id', $request->product_id)->first();
            //$product = Product::findOrFail($request->product_id);

            $existing = TempPurchaseDetail::where('temp_purchase_id', $request->temp_purchase_id)
                ->where('product_id', $product->id)
                ->first();

            if ($existing) {
                $existing->quantity += 1;
                $existing->total = ($existing->quantity * $request->cost) - $existing->discount_number;
                $existing->save();

                // Obtén todos los detalles de la compra temporal actual
                $detail = TempPurchaseDetail::where('temp_purchase_id', $request->temp_purchase_id)->get();
                $totals = $this->calculateTotals($detail);

                return response()->json(array_merge([
                    'status' => 'create.'
                ], $totals));
            }

            $detail = TempPurchaseDetail::create([
                'temp_purchase_id' => (int) $request->temp_purchase_id,
                'product_id' => (int) $product->id,
                'product_name' => $product->product_name,
                'barcode' => $product->barcode,
                'purchase_price' => (float) ($request->cost ?? 0),
                'new_sale_price_1' => (float) ($request->new_price_sale_1 ?? $request->new_price_sale_1 ?? 0),
                'new_sale_price_2' => (float) ($request->new_price_sale_2 ?? $request->new_price_sale_2 ?? 0),
                'new_sale_price_3' => (float) ($request->new_price_sale_3 ?? $request->new_price_sale_3 ?? 0),
                'unit_price' => (float) ($request->new_price_unit),
                'factor' => (float) ($request->new_factor),
                'quantity' => $request->quantity,
                'discount' => $request->discount_number ?? 0,
                'total' => (float) ($request->quantity * $request->cost - $request->discount_number),
                'unit_id' => (int) ($product->purchase_unit_id),
                'unit_name' => ($product->purchase_unit_name),
            ]);

            // Obtén todos los detalles de la compra temporal actual
            $details = TempPurchaseDetail::where('temp_purchase_id', $request->temp_purchase_id)->get();
            $totals = $this->calculateTotals($details);

            return response()->json(array_merge([
                'status' => 'create.'
            ], $totals));
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    public function getProductDetails()
    {
        return DataTables::of(TempPurchaseDetail::select('*'))->make(true);
    }

    /**
     * Display the specified resource.
     */
    public function show($supplierId)
    {
        $supplier = Supplier::find($supplierId);

        if (!$supplier) {
            return response()->json(['error' => 'Proveedor no encontrado'], 404);
        }

        return response()->json([
            'company_name' => $supplier->company_name,
            'representative' => $supplier->representative,
            'phone' => $supplier->phone,
            'email' => $supplier->email,
            'rfc' => $supplier->rfc,
            'credit_available' => $supplier->credit_available,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(tempPurchaseDetailController $tempPurchaseDetailController)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'temp_purchase_id' => 'required',
            ]);

            // Busca el detalle temporal por temp_purchase_id y product_id
            $detail = TempPurchaseDetail::findOrFail($id);

            if (!$detail) {
                return response()->json(['error' => 'Detalle no encontrado'], 404);
            }

            // Actualiza los campos
            $detail->update([
                'purchase_price' => (float) ($request->cost ?? 0),
                'new_sale_price_1' => (float) ($request->new_price_sale_1 ?? 0),
                'new_sale_price_2' => (float) ($request->new_price_sale_2 ?? 0),
                'new_sale_price_3' => (float) ($request->new_price_sale_3 ?? 0),
                'unit_price' => (float) ($request->new_price_unit ?? 0),
                'factor' => (float) ($request->new_factor ?? 0),
                'quantity' => $request->quantity,
                'discount' => $request->discount_number ?? 0,
                'total' => (float) ($request->quantity * $request->cost - $request->discount_number),
                'unit_id' => (int) ($request->unit_id ?? $detail->unit_id),
                'unit_name' => $request->unit_name ?? $detail->unit_name,
            ]);

            // Recalcula los totales
            $details = TempPurchaseDetail::where('temp_purchase_id', $request->temp_purchase_id)->get();
            $totals = $this->calculateTotals($details);

            return response()->json(array_merge([
                'status' => 'updated',
                'detail' => $detail,
            ], $totals));
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        // Buscar el detalle por ID
        $detail = TempPurchaseDetail::find($id);

        if (!$detail) {
            return response()->json(['error' => 'Producto no encontrado'], 404);
        }

        // Obtener el temp_purchase_id antes de eliminar
        $tempPurchaseId = $detail->temp_purchase_id;

        // Eliminar el detalle
        $detail->delete();

        // Obtener los nuevos detalles restantes
        $details = TempPurchaseDetail::where('temp_purchase_id', $tempPurchaseId)->get();

        // Recalcular los totales
        $totals = $this->calculateTotals($details);

        return response()->json(array_merge([
            'status' => 'delete.'
        ], $totals));
    }


    public function autoCompleteSuppliers($query)
    {
        $results = Supplier::where('company_name', 'LIKE', '%' . $query . '%')
            ->orWhere('representative', 'LIKE', '%' . $query . '%')
            ->limit(10) // Limita la cantidad de resultados
            ->get([
                'id',
                'company_name',
                'representative',
            ]);

        return response()->json([
            'data' => $results->map(function ($supplier) {
                return [
                    'id' => $supplier->id,
                    'value' => $supplier->company_name . ' - ' . $supplier->representative, // <== Este campo se debe llamar "value"
                ];
            })
        ]);
    }

    public function autoCompleteProducts($query)
    {
        $results = Product::where('product_name', 'LIKE', '%' . $query . '%')
            ->orWhere('barcode', 'LIKE', '%' . $query . '%')
            ->limit(10) // Limita la cantidad de resultados
            ->get([
                'id',
                'product_name',
                'barcode',
            ]);

        return response()->json([
            'data' => $results->map(function ($product) {
                return [
                    'id' => $product->id,
                    'value' => $product->product_name . ' - ' . $product->barcode, // <== Este campo se debe llamar "value"
                ];
            })
        ]);
    }
    public function getTotals($temp_purchase_id)
    {
        $details = TempPurchaseDetail::where('temp_purchase_id', $temp_purchase_id)->get();
        $totals = $this->calculateTotals($details);
        return response()->json($totals);
    }

    public function getTempDetail($id)
    {
        $detail = TempPurchaseDetail::find($id);
        if ($detail) {
            return response()->json(['detail' => $detail]);
        }
        return response()->json(['error' => 'No encontrado'], 404);
    }

    private function calculateTotals($details)
    {
        $sub_total = round($details->sum('total'), 2);
        $iva = 16; // Cambiar cuando ya este la tabla configuración
        $tax = round($sub_total * ($iva / 100), 2);
        $total_siva = round($sub_total - $tax, 2);
        $total = number_format($total_siva + $tax, 2);
        return [
            'sub_total' => $sub_total,
            'tax' => $tax,
            'total_siva' => $total_siva,
            'total' => $total,
        ];
    }
}
