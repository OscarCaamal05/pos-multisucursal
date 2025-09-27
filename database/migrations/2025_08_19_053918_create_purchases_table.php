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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();

            // Relaciones
            $table->unsignedBigInteger('supplier_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('vouncher_id');
            $table->unsignedBigInteger('document_id');

            // Informacion de compra
            $table->date('purchase_date');
            $table->string('invoice_number')->unique();
            $table->decimal('tax', 10, 2)->default(0.00);
            $table->decimal('subtotal', 10, 2)->default(0.00);
            $table->decimal('total_amount', 10, 2)->default(0.00);
            $table->decimal('amount_paid', 10, 2)->default(0.00);
            $table->boolean('is_fully_paid')->default(false)->commnet('True si la compra está completamente pagado');
            $table->enum('status', ['procesado', 'anulado'])->default('procesado');
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('vouncher_id')->references('id')->on('voucher_types')->onDelete('cascade');
            $table->foreign('document_id')->references('id')->on('document_types')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
