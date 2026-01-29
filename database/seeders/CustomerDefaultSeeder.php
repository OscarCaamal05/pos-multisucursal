<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Customer;

class CustomerDefaultSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $generalCustomerExists = Customer::where('name', 'Publico General')->exists();

        if (!$generalCustomerExists) {
            Customer::create([
                'code' => 'CLI-0001',
                'name' => 'Publico General',
                'email' => '',
                'phone' => '',
                'address' => '',
                'status' => true,
                'has_credit' => false,
                'credit_limit' => 0,
                'credit_used' => 0,
                'credit_available' => 0,
                'payment_day_of_month' => null,
                'interest_rate' => 0,
                'late_fee' => 0,
                'grace_period_days' => 0,
                'credit_blocked' => false,
                'credit_block_reason' => null,
                'credit_blocked_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
