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
            $table->string('full_name');
            $table->string('rfc', 13)->nullable()->unique();
            $table->string('address')->nullable();
            $table->string('phone', 10)->nullable()->unique();
            $table->string('email')->nullable()->unique();
            $table->decimal('credit', 10,2)->default(0.00)->nullable();
            $table->decimal('credit_available', 10,2)->default(0.00)->nullable();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
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
