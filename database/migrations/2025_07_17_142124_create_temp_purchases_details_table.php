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
        Schema::create('temp_purchases_details', function (Blueprint $table) {
            $table->id('id_temp');
            $table->unsignedBigInteger('temp_purchase_id');
            $table->unsignedBigInteger('product_id');
            $table->string('product_name');
            $table->string('barcode');
            $table->decimal('purchase_price', 10, 2);
            $table->decimal('new_sale_price_1', 10, 2);
            $table->decimal('new_sale_price_2', 10, 2);
            $table->decimal('new_sale_price_3', 10, 2);
            $table->decimal('unit_price', 10, 2)->nullable()->default(0);
            $table->decimal('factor', 10, 2);
            $table->decimal('quantity', 10, 2)->default(1);
            $table->decimal('discount', 10, 2)->default(0)->nullable();
            $table->decimal('total', 10, 2);
            $table->unsignedBigInteger('unit_id');
            $table->string('unit_name');
            $table->timestamps();

            $table->foreign('temp_purchase_id')->references('id_temp_purchase')->on('temp_purchases')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('temp_purchases_details');
    }
};
