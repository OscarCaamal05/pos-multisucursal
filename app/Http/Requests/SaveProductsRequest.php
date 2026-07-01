<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveProductsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'unique:products,name' . ($this->product ? ',' . $this->product->id : ''),
            ],
            'barcode' => [
                'required',
                'string',
                'unique:products,barcode' . ($this->product ? ',' . $this->product->id : ''),
            ],
            'conversion_factor' => 'required|numeric',
            'purchase_price' => 'required|numeric',
            'sale_price_1' => 'required|numeric',
            'sale_price_2' => 'nullable|numeric',
            'sale_price_3' => 'nullable|numeric',
            'price_1_min_qty' => 'required|numeric',
            'price_2_min_qty' => 'nullable|numeric',
            'price_3_min_qty' => 'nullable|numeric',
            'unit_price' => 'required|numeric',
            'description' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',

            // Relaciones - AÑADIR exists
            'category_id' => 'required|exists:categories,id',
            'department_id' => 'required|exists:departments,id',
            'sale_unit_id' => 'required|exists:units,id',
            'purchase_unit_id' => 'required|exists:units,id',

            // Impuestos
            'taxes' => 'nullable|array',
            'taxes.*' => 'exists:taxes,id',

            // Inventario
            'stock_min' => 'nullable|numeric',
            'stock_max' => 'nullable|numeric',

            // Booleanos
            'allow_fractional_sale' => 'nullable|boolean',
            'allow_decimal_quantity' => 'nullable|boolean',
            'requires_batch_control' => 'nullable|boolean',
            'requires_serial_number' => 'nullable|boolean',
            'is_service' => 'nullable',
            'is_net_price' => 'nullable',

            // Fechas
            'expiry_date' => 'nullable|date',
            'shelf_life_days' => 'nullable|integer',
            'alert_days_before_expiration' => 'nullable|integer',
        ];
    }
}
