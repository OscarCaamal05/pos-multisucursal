<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TypeReceiptSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Creación de tipos de recibos predeterminados
        $typeReceipts = [
            ['name' => 'Factura', 'series_prefix' => 'F01'],
            ['name' => 'Ticket', 'series_prefix' => 'T01'],
            ['name' => 'Nota de Crédito', 'series_prefix' => 'NC01'],
            ['name' => 'Nota de Débito', 'series_prefix' => 'ND01'],
            ['name' => 'Recibo', 'series_prefix' => 'R01'],
            ['name' => 'Comprobando de Gasto', 'series_prefix' => 'CG01'],
        ];
        foreach ($typeReceipts as $type) {
            \DB::table('types_receipts')->insert([
                'name' => $type['name'],
                'series_prefix' => $type['series_prefix'],
                'current_number' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
