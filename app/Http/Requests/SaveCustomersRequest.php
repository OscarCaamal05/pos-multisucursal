<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveCustomersRequest extends FormRequest
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
            'full_name' => [
                'required',
                'string',
            ],
            'rfc' => [
                'nullable',
                'string',
                'size:13',
                Rule::unique('customers', 'rfc')
                    ->ignore(optional($this->customer)->id)
            ],
            'address' => 'string|nullable|max:255',
            'phone' => [
                'nullable',
                'string',
                'size:10',
                Rule::unique('customers', 'phone')
                    ->ignore(optional($this->customer)->id)
            ],
            'email' => [
                'nullable',
                'string',
                'max:255',
                'email',
                Rule::unique('customers', 'email')
                    ->ignore(optional($this->customer)->id)
            ],
            'credit_available' => 'nullable|numeric',
            'credit_terms' => 'nullable|integer',
            'credit_due_date' => 'nullable',
        ];
    }
}
