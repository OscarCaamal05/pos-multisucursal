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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();

            // Información Básica
            $table->string('representative');
            $table->string('company_name')->unique();
            $table->string('tax_id', 20)->nullable()->unique()->comment('RFC para México');

            //Contacto
            $table->string('address')->nullable();
            $table->string('phone', 10)->nullable()->unique();
            $table->string('email')->nullable()->unique();

            // Crédito que NOS otorgan
            $table->boolean('gives_credit')->default(false)->comment('Si el proveedor nos da crédito');
            $table->decimal('credit_limit_granted', 10, 2)->default(0)->nullable()->comment('Límite de crédito que NOS otorgan');
            $table->decimal('credit_balance', 10, 2)->default(0)->nullable()->comment('Saldo actual que LES debemos');
            $table->decimal('credit_available', 10, 2)->default(0)->nullable()->comment('Crédito disponible con este proveedor');

            // Términos de pago que nos otorgan
            $table->integer('payment_days_granted')->default(30)->nullable()->comment('Días de crédito que nos dan (15, 30, 60, 90)');
            $table->enum('payment_frequency', ['unico', 'semanal', 'quincenal', 'mensual'])->default('unico')
                ->comment('Frecuencia de pago que nos solicitan');
            $table->integer('payment_day_of_month')->nullable()->comment('Día específico que debemos pagar');

            // Penalizaciones que nos aplican
            $table->decimal('supplier_interest_rate', 5, 2)->default(0)->nullable()->comment('% interés que NOS cobran por mora');
            $table->decimal('supplier_late_fee', 10, 2)->default(0)->nullable()->comment('Cargo por mora que nos aplican');
            $table->integer('grace_period_days')->default(0)->nullable()->comment('Días de gracia que nos dan');

            // Descuentos por pronto pago
            $table->decimal('early_payment_discount', 5, 2)->default(0)->nullable()->comment('% descuento si pagamos antes');
            $table->integer('early_payment_days')->nullable()->comment('Días antes para aplicar descuento');

            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
