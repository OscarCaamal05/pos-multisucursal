<?php

namespace App\Services\Pdf\Receipts;

class TicketReceipt implements ReceiptInterface
{
    public function getMpdfConfig(): array
    {
        return [
            'mode' => 'utf-8',
            'format' => [80, 200], // Tamaño del ticket (ancho x alto en mm)
            'default_font_size' => 10,
            'default_font' => 'Arial',
            'margin_left' => 3,
            'margin_right' => 3,
            'margin_top' => 3,
            'margin_bottom' => 3,
        ];
    }

    public function getView(): string
    {
        return 'receipts.ticket';
    }

    public function getFileName(int $saleId): string
    {
        return "ticket_{$saleId}_".date('Y-m-d_His').".pdf";
    }

    public function getTitle(): string
    {
        return 'Ticket de venta';
    }
}