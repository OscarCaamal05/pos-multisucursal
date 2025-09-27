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
        Schema::create('voucher_types', function (Blueprint $table) {
            $table->id();
            $table->string('voucher_name', 50);
            $table->string('series_prefix', 10)->nullable();
            $table->integer('current_number')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::table('voucher_types')->insert([
            ['voucher_name' => 'Factura', 'series_prefix' => 'F01', 'current_number' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['voucher_name' => 'Ticket', 'series_prefix' => 'T01', 'current_number' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['voucher_name' => 'Nota de Crédito', 'series_prefix' => 'NC01', 'current_number' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['voucher_name' => 'Nota de Débito', 'series_prefix' => 'ND01', 'current_number' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['voucher_name' => 'Recibo', 'series_prefix' => 'R01', 'current_number' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['voucher_name' => 'Comprobante de Gasto', 'series_prefix' => 'CG01', 'current_number' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voucher_types');
    }
};
