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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();

            //Información básica
            $table->string('code', 20)->unique()->nullable();
            $table->string('name', 255);
            $table->string('tax_id', 13)->nullable()->unique()->comment('rfc para méxico');

            //contacto
            $table->string('address', 255)->nullable();
            $table->string('phone', 10)->nullable()->unique();
            $table->string('email', 50)->nullable()->unique();

            //crédito
            $table->boolean('has_credit')->default(false)->comment('Si tiene línea de crédito activa');
            $table->decimal('credit_limit', 10, 2)->default(0)->comment('Límite máximo de crédito');
            $table->decimal('credit_used', 10, 2)->default(0)->comment('Crédito utilizado actualmente');
            $table->decimal('credit_available', 10, 2)->default(0)->comment('Crédito disponible');

            // Términos de pago por defecto
            $table->integer('default_credit_days')->default(30)->comment('Días de crédito estándar (15, 30, 60, 90)');
            $table->enum('payment_frequency', ['unico', 'semanal', 'quincenal', 'mensual'])->default('unico')
                ->comment('Frecuencia de pago: único, semanal, quincenal, mensual');

            // Día específico de pago (para pagos mensuales)
            $table->integer('payment_day_of_month')->nullable()->comment('Día del mes para pago (1-31)');

            // Control de mora
            $table->decimal('interest_rate', 5, 2)->default(0)->comment('Tasa de interés mensual por mora (%)');
            $table->decimal('late_fee', 10, 2)->default(0)->comment('Cargo fijo por mora');
            $table->integer('grace_period_days')->default(0)->comment('Días de gracia después del vencimiento');
            $table->boolean('status')->default(true);
            $table->timestamps();

            //control de bloqueo de crédito
            $table->boolean('credit_blocked')->default(false)->comment('Crédito bloqueado por mora');
            $table->text('credit_block_reason')->nullable();
            $table->timestamp('credit_blocked_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
