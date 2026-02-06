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
            'conversion_factor' => 'required|nullable|numeric',
            'purchase_price' => 'required|numeric',
            'sale_price_1' => 'required|numeric',
            'sale_price_2' => 'numeric|nullable',
            'sale_price_3' => 'numeric|nullable',
            'price_1_min_qty' => 'required|numeric',
            'price_2_min_qty' => 'numeric|nullable',
            'price_3_min_qty' => 'numeric|nullable',
            'description' => 'nullable|string|max:255',
            'image' => 'image|mimes:jpeg,png,jpg',
            'category_id' => 'required',
            'department_id' => 'required',
            'sale_unit_id' => 'required',
            'purchase_unit_id' => 'required',
            'unit_price' => 'numeric',
            'allow_fractional_sale' => 'nullable',
            'allow_decimal_quantity' => 'nullable',
            'requires_batch_control' => 'nullable',
            'requieres_serial_number' => 'nullable',
            'shelf_life_days' => 'nullable|integer',
            'alert_days_before_expiration' => 'nullable|integer',
            'is_service' => 'nullable',
        ];
    }
}
