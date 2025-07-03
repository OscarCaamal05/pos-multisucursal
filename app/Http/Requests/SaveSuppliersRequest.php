<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveSuppliersRequest extends FormRequest
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
            'representative' => [
                'required',
                'string',
            ],
            'company_name' => [
                'required',
                'string',
                Rule::unique('suppliers', 'company_name')
                    ->ignore(optional($this->supplier)->id)
            ],
            'rfc' => [
                'nullable',
                'string',
                'size:13',
                Rule::unique('suppliers', 'rfc')
                    ->ignore(optional($this->supplier)->id)
            ],
            'address' => 'string|nullable|max:255',
            'phone' => [
                'nullable',
                'string',
                'size:10',
                Rule::unique('suppliers', 'phone')
                    ->ignore(optional($this->supplier)->id)
            ],
            'email' => [
                'nullable',
                'string',
                'max:255',
                'email',
                Rule::unique('suppliers', 'email')
                    ->ignore(optional($this->supplier)->id)
            ],
            'credit_available' => 'nullable|numeric',
        ];
    }
}
