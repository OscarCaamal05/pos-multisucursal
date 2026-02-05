<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TypesDocumentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Creación de tipos de documentos predeterminados
        $typesDocuments = [
            ['name' => 'Venta'],
            ['name' => 'Compra'],
            ['name' => 'Gasto'],
            ['name' => 'Devolución Venta'],
            ['name' => 'Ajuste Inventario'],
        ];
        foreach ($typesDocuments as $type) {
            \DB::table('types_documents')->insert([
                'name' => $type['name'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
