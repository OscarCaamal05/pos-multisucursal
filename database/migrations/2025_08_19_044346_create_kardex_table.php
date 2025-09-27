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
        Schema::create('kardex', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');

            $table->enum('movement_type', ['entrada', 'salida', 'ajuste']);
            $table->string('movement_reason', 100)->nullable();
            $table->string('reference_type', 50)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();

            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_purchase_price', 10, 2)->nullable();
            $table->decimal('unit_sale_price', 10, 2)->nullable();
            $table->decimal('total_cost', 10, 2)->nullable();

            $table->decimal('balance_quantity', 10, 2)->nullable();
            $table->decimal('balance_unit_cost', 10, 2)->nullable();
            $table->decimal('balance_total_cost', 10, 2)->nullable();
            $table->dateTime('movement_date');
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kardex');
    }
};
