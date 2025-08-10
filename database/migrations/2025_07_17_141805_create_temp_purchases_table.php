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
        Schema::create('temp_purchases', function (Blueprint $table) {
            $table->id('id_temp_purchase');
            $table->unsignedBigInteger('user_id');
            $table->string('session_token')->nullable();
            $table->string('status')->default('abierta')->comment('Estado de la compra: abierta, espera, finalizado');
            $table->decimal('discount', 10, 2)->default(0.00)->nullable();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('temp_purchases');
    }
};
