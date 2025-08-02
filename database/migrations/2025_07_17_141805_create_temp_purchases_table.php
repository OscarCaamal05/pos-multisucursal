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
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
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
