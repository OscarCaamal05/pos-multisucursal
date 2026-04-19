<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Taxes;

class DefaultTaxesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $taxExists = Taxes::where('name', 'iva')->exists();
        if (!$taxExists) {
            Taxes::create([
                'name' => 'iva',
                'rate' => 16,
                'type' => 'tasa',
                'is_inclusive' => false,
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
