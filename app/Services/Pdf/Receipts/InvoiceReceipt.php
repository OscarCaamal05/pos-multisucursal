<?php

namespace App\Services\Pdf\Receipts;

class InvoiceReceipt implements ReceiptInterface
{
    public function getMpdfConfig(): array
    {
        return [
            'mode' => 'utf-8',
            'format' => 'A4', // Tamaño de la factura (A4)
            'default_font_size' => 12,
            'default_font' => 'Arial',
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 15,
            'margin_bottom' => 15,
        ];
    }

    public function getView(): string
    {
        return 'receipts.invoice';
    }

    public function getFileName(int $saleId): string
    {
        return "invoice_{$saleId}_".date('Y-m-d_His').".pdf";
    }

    public function getTitle(): string
    {
        return 'Factura de Venta';
    }
}
