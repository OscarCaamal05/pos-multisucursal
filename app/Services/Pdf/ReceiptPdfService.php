<?php

namespace App\Services\Pdf;

use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\branches;
use App\Services\Pdf\Receipts\ReceiptInterface;
use App\Services\Pdf\Receipts\TicketReceipt;
use App\Services\Pdf\Receipts\InvoiceReceipt;
use Mpdf\Mpdf;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ReceiptPdfService
{
    // Mapa de tipos de comprobante -> clase responsable de generar el PDF
    private array $reciptsMap = [
        1 => InvoiceReceipt::class, // id 1 = Factura
        2 => TicketReceipt::class, // id 2 = Ticket de venta
        // Agrega más tipos de comprobante aquí si es necesario
    ];

    public function resolveView(int $voucherId): string
    {
        $receiptClass = $this->reciptsMap[$voucherId] ?? TicketReceipt::class;
        $receipt = new $receiptClass();

        return $receipt->getView();
    }

    public function generate(int $saleId, int $voucherId): Response
    {
        // Resuelve la clase correcta según el tipo de comprobante
        $receiptClass = $this->reciptsMap[$voucherId] ?? TicketReceipt::class;
        $receipt = new $receiptClass();

        // Obtener los datos de la venta
        $data = $this->getSaleData($saleId);

        // Renderizar la vista Blade Correspondiente al tipo de comprobante
        $html = view($receipt->getView(), $data)->render();

        // Generar el PDF usando mPDF
        $mpdf = new Mpdf($receipt->getMpdfConfig());
        $mpdf->SetTitle($receipt->getTitle());
        $mpdf->WriteHTML($html);

        $fileName = $receipt->getFileName($saleId);

        return response($mpdf->Output($fileName, 'S'), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', "inline; filename=\"$fileName\"");
    }

    public function getSaleDataForView(int $saleId): array
    {
        return $this->getSaleData($saleId);
    }

    private function getSaleData(int $saleId): array
    {
        $sale = Sale::with(['customer', 'details.product', 'user', 'branch'])->findOrFail($saleId);

        // Obtener los datos de la sucursal asociada a la venta
        $branch = branches::find($sale->branch_id);

        // Agregar los métodos de pago
        $payments = DB::table('payment_methods')
            ->where('transaction_id', $saleId)
            ->where('transaction_type', 'sale')
            ->get();


        return [
            'sale'      => $sale,
            'customer'  => $sale->customer,
            'details'   => $sale->details,
            'user'      => $sale->user,
            'payments'  => $payments, // ✅ Necesario para la sección de pagos
            'fecha'     => now()->format('d/m/Y H:i:s'),
            'business' => (object) [
                'name'    => $branch->name    ?? 'Tu negocio',
                'address' => $branch->address ?? 'Tu dirección aquí',
                'phone'   => $branch->phone   ?? 'Tu teléfono aquí',
                'tax_id'  => $branch->tax_id  ?? 'Tu RFC aquí',
                'logo' => $this->resolveLogoBase64($branch->logo_path),
            ],
        ];
    }

    private function resolveLogoBase64(?string $logoPath): ?string
    {
        if (!$logoPath) {
            return null;
        }

        $absolutePath = storage_path('app/public/' . $logoPath);

        if (!file_exists($absolutePath)) {
            return null;
        }

        $mime = mime_content_type($absolutePath);
        $base64 = base64_encode(file_get_contents($absolutePath));

        return "data:{$mime};base64,{$base64}";
    }
}
