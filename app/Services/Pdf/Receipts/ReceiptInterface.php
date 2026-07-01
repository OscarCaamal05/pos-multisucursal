<?php

namespace App\Services\Pdf\Receipts;

interface ReceiptInterface
{
    // Configuración del PDF (Tamaño, orientación, márgenes, etc.)
    public function getMpdfConfig(): array;

    // Vista que se utilizará para generar el PDF
    public function getView(): string;

    // Nombre del archivo PDF generado
    public function getFileName(int $saleId): string;

    // Título del documento
    public function getTitle(): string;
}