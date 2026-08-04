<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Services\Reports\SalesReportService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SaleReportController extends Controller
{
    public function __construct(
        private SalesReportService $reportService
    ) {}

    // ✅ Endpoint AJAX que genera los datos del reporte
    public function exportPdf(Request $request)
    {
        try {
            $request->validate([
                'start_date' => 'required|date',
                'end_date'   => 'required|date|after_or_equal:start_date',
            ]);

            $branchId = (int) auth()->user()->defaultBranchId() ?? 1;

            $data = $this->reportService->buildReport(
                $branchId,
                $request->start_date,
                $request->end_date
            );

            $html = view('sales.export-report-pdf', $data)->render();

            $mpdf = new \Mpdf\Mpdf([
                'mode' => 'utf-8',
                'format' => 'Letter',
                'default_font' => 'arial',
                'margin_left' => 10,
                'margin_right' => 10,
                'margin_top' => 10,
                'margin_bottom' => 15,
            ]);

            $mpdf->SetTitle('Reporte de Ventas');
            $mpdf->WriteHTML($html);

            $fileName = 'reporte_ventas_' . date('Y-m-d_His') . '.pdf';

            return response()->streamDownload(function () use ($mpdf) {
                echo $mpdf->Output('', 'S');
            }, $fileName, [
                'Content-Type' => 'application/pdf',
            ]);

        } catch (\Exception $e) {
            Log::error('Error generating sales report: ' . $e->getMessage());
            return back()->with('error', 'Error al generar el reporte de ventas.');
        }
    }

}
