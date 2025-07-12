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
            'product_name' => [
                'required',
                'string',
                'unique:products,product_name' . ($this->product ? ',' . $this->product->id : ''),
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
            'product_description' => 'nullable|string|max:255',
            'stock' => 'numeric|nullable',
            'stock_min' => 'numeric|nullable',
            'stock_max' => 'numeric|nullable',
            'image' => 'image|mines:jpeg, png, jpg',
            'product_category_id' => 'required',
            'product_department_id' => 'required',
            'sale_unit_id' => 'required',
            'purchase_unit_id' => 'required',
            'unit_price' => 'numeric',
            'iva' => 'nullable',
            'neto' => 'nullable',
            'is_fractional' => 'nullable',
            'is_service' => 'nullable',
        ];
    }
}
