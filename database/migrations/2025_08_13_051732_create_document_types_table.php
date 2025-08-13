<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('document_types', function (Blueprint $table) {
            $table->id();
            $table->string('type_name', 50);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Datos predeterminados
        DB::table('document_types')->insert([
            ['type_name' => 'Venta', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['type_name' => 'Compra', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['type_name' => 'Gasto', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['type_name' => 'Devolución Venta', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['type_name' => 'Ajuste Inventario', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_types');
    }
};
