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

            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

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

            $table->string('batch_number', 50)->nullable();
            $table->date('expiration_date')->nullable();
            $table->decimal('cost_per_unit', 10, 2)->nullable();

            $table->index(['branch_id', 'product_id', 'movement_date']);
            $table->index(['branch_id', 'movement_date']);
            $table->timestamps();
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
