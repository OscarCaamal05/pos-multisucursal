// =========================================
// IMPORTACION DE FUNCIONES GENERICAS
// =========================================
import { showAlert, showConfirmationAlert, } from './utils/alerts';
import { bindCategoryFormSubmit, showCategoryModal, closeCategoryModal } from './helpers/categoryHelper';
import { closeDepartmentModal, bindDepartmentFormSubmit, selectDepartmet } from './helpers/departmentHelper';

// =========================================
// CONFIGURACIÓN ESPECÍFICA DEL MÓDULO
// =========================================
const DETAIL_CONFIG = {
    selectors: {
        table: '#salesTable',
        tableDetails: '#productsDetailsTable',
        btnCloseModal: '#btn-close-modal-sale',
        btnReturnProduct: '#btn-return-product-quantity',
        btnClearDateFilter: '#btn-clear-date-filter',
        btnClearDateFilterReport: '#btn-clear-date-filter-report',
        btnGenerateReport: '#btn-generate-report',
        modalDetails: '#modal-sale-details',
        modalReturnProduct: '#modal-return-product-quantity',
        modalGenerateReport: '#modal-generate-report',
        returnProductId: '#return-product-id',
        saleId: '#sale-id',
        saleDateFilter: '#sale-datepicker-filter',
        saleDateFilterReport: '#sale-datepicker-filter-report',

    },
    api: {
        base: '/sales',
    },
    messages: {
        selectRow: 'Seleccione una fila para continuar',
    }
};

// =========================================
// VARIABLES GLOBALES
// =========================================

let salesDetailsTable = null;
let detailsTable = null;
let currentSaleStatus = null;
let selectedRowDetail = null;
let tableDateRange = { start: null, end: null };
let reportDateRange = { start: null, end: null };
let saleDatePickerInstance = null;
let saleDatePickerInstanceReport = null;

// =========================================
// INICIALIZACIÓN PRINCIPAL
// =========================================
$(document).ready(function () {
    initializeDataTable();
    //initializeSelect2();
    bindEvents();
    bindKeyBoardEnter();

    // Inicializacion de los datepickers para el filtro de rango de fechas
    saleDatePickerInstance = createRangeDatePicker(
        DETAIL_CONFIG.selectors.saleDateFilter,
        tableDateRange,
        () => salesDetailsTable.ajax.reload()
    );

    saleDatePickerInstanceReport = createRangeDatePicker(
        DETAIL_CONFIG.selectors.saleDateFilterReport,
        reportDateRange,
    );
})

// =========================================
// DATATABLE: Tabla temporal de compra
// =========================================

/**
 * Inicializa el DataTable de la tabla temporal de compra.
 */
function initializeDataTable() {
    salesDetailsTable = $(DETAIL_CONFIG.selectors.table).DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: DETAIL_CONFIG.api.base,
            data: function (d) {
                d.voucher_id = $('#id-voucher-filter').val();
                d.payment_method = $('#id-payment-method-filter').val();
                d.status = $('#id-status-filter').val();
                d.start_date = tableDateRange.start;
                d.end_date = tableDateRange.end;
            }
        },
        order: [[0, 'desc']],
        order: [[7, 'desc']],
        columns: [
            { data: 'id', name: 'id' },
            { data: 'sale_date', name: 'sale_date' },
            {
                data: 'payment_method',
                name: 'payment_method',
                render: renderPaymentMethodColumn
            },
            { data: 'voucher_id', name: 'voucher_id', visible: false },
            { data: 'voucher_name', name: 'voucher_name' },
            { data: 'invoice_number', name: 'invoice_number' },
            { data: 'customer_name', name: 'customer_name' },
            { data: 'total_amount', name: 'total_amount' },
            { data: 'amount_paid', name: 'amount_paid' },
            {
                data: 'status',
                name: 'status',
                render: renderStatusColumn
            },
            {
                data: 'id',
                name: 'actions',
                searchable: false,
                render: renderActionsColumn
            }
        ],
        columnDefs: [
            { orderable: false, targets: [2, 3, 5, 7, 8, 9] },
            { searchable: false, targets: [2, 3, 7, 9] }
        ],
        scrollY: 500,
        deferRender: true,
        scroller: true,
        language: idiomaEspanol,
        dom: 'rt<"bottom row"<"col-sm-4"l><"col-sm-4 text-center d-flex justify-content-center"p><"col-sm-4 text-end"i>><"clear">',

    });

    // Búsqueda por input de texto
    $('#search-sale-input').off('keyup.SalesSearch').on('keyup.SalesSearch', function () {
        const searchValue = $(this).val();
        salesDetailsTable.search(searchValue).draw();
    });

    // Filtro por comprobante
    $('#id-voucher-filter').on('change', function () {
        salesDetailsTable.ajax.reload();
    });

    // Filtro por metodo de pago
    $('#id-payment-method-filter').on('change', function () {
        salesDetailsTable.ajax.reload();
    });

    // Filtro por status
    $('#id-status-filter').on('change', function () {
        salesDetailsTable.ajax.reload();
    });
}

/**
 * Renderiza la columna de estado con el switch de activación.
 */
function renderStatusColumn(data, type, row) {
    const badgeClass = data === 'procesado' ? 'bg-success-subtle text-success' :
        data === 'anulado' ? 'bg-danger-subtle text-danger' :
            'bg-secondary-subtle text-secondary';
    const badgeText = data === 'procesado' ? 'Procesado' :
        data === 'anulado' ? 'Anulado' :
            'Desconocido';

    return `
        <div class="d-flex align-items-center justify-content-between">
            <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
    `;
}

/**
 * 
 * Renderiza la columna de método de pago con un badge correspondiente.
 */
function renderPaymentMethodColumn(data, type, row) {
    const badgeClass = data === 'credito' ? 'bg-warning-subtle text-warning'
        : data === 'devolucion' ? 'bg-danger-subtle text-danger'
            : 'bg-info-subtle text-info';
    const badgeText = data === 'credito' ? 'Crédito'
        : data === 'devolucion' ? 'Devolución'
            : data;
    return `<span class="badge ${badgeClass}">${badgeText}</span>`;
}

/**
 * Renderiza los botones de acciones (editar, eliminar).
 */
function renderActionsColumn(data, type, row) {
    if (row.status === 'anulado') {
        return `
        <div class="hstack gap-3 fs-15">
            <a href="javascript:void(0);" class="link-info btn-view-sale" data-bs-toggle="tooltip" data-bs-placement="top" title="Ver detalles" data-id="${data}">
                <i class="mdi mdi-eye"></i>
            </a>
        </div>
    `;
    }
    return `
        <div class="hstack gap-3 fs-15">
            <a href="javascript:void(0);" class="link-info btn-view-sale" data-bs-toggle="tooltip" data-bs-placement="top" title="Ver detalles" data-id="${data}">
                <i class="mdi mdi-eye"></i>
            </a>
            <a href="javascript:void(0);" class="link-danger btn-annul-sale" data-bs-toggle="tooltip" data-bs-placement="top" title="Anular" data-id="${data}">
                <i class="mdi mdi-block-helper"></i>
            </a>
        </div>
    `;
}

// =========================================
// EVENTOS: Interacción con la tabla y modal de detalle
// =========================================

/**
 * Agrupa todos los eventos de interacción del módulo de detalles de ventas.
 */
function bindEvents() {

    // Evento para cerrar el modal de detalles de venta
    $(DETAIL_CONFIG.selectors.btnCloseModal).on('click', function () {
        $(DETAIL_CONFIG.selectors.modalDetails).modal('hide');
    });

    // Evento para mostrar detalles de venta al hacer clic en el botón de ver
    $(DETAIL_CONFIG.selectors.table).on('click', '.btn-view-sale', function () {
        const data = salesDetailsTable.row($(this).closest('tr')).data();
        const saleId = selectedRowDetail ? selectedRowDetail.sale_id : data.id;
        selectedRowDetail = data ? data : null;
        console.log(selectedRowDetail);
        $(DETAIL_CONFIG.selectors.saleId).val(saleId);
        showSaleDetails(saleId);
    });

    $(DETAIL_CONFIG.selectors.modalDetails).on('shown.bs.modal', function () {
        if (detailsTable) {
            detailsTable.columns.adjust().draw();
        }
    });

    // Evento para anular venta al hacer clic en el botón de anular
    $(DETAIL_CONFIG.selectors.table).on('click', '.btn-annul-sale', function () {
        const saleId = $(this).data('id');
        showConfirmationAlert(
            '¿Está seguro de que desea anular esta venta?',
            'Esta acción no se puede deshacer.',
            'Si, anular',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    annulSale(saleId);
                }
            }
        );
    });

    // -----------------------------------------------------------------
    // EVENTOS DEL MODAL DE DETALLES DE VENTA
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.modalDetails).on('hidden.bs.modal', function () {
        $(DETAIL_CONFIG.selectors.saleId).val('');
        selectedRowDetail = null;
    });

    // Evento para devolver producto al hacer clic en el botón de devolver producto
    $(DETAIL_CONFIG.selectors.tableDetails).on('click', '.btn-return-product', function () {
        const data = detailsTable.row($(this).closest('tr')).data();
        $('.product-name-label').text(data.product_name);
        $('.return-quantity').val(data.quantity);
        $(DETAIL_CONFIG.selectors.returnProductId).val(data.product_id);
        $(DETAIL_CONFIG.selectors.modalReturnProduct).modal('show');
    });

    // -----------------------------------------------------------------
    // EVENTOS DEL MODAL DE EDICIÓN DE CANTIDAD A DEVOLVER
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.modalReturnProduct).on('shown.bs.modal', function () {
        $('.return-quantity').trigger('focus').trigger('select');
    });

    $(DETAIL_CONFIG.selectors.modalReturnProduct).on('hidden.bs.modal', function () {
        $('.product-name-label').text('');
        $('.return-quantity').val('');

    });

    // -----------------------------------------------------------------
    // APLICAR LA DEVOLUCIÓN DEL PRODUCTO AL HACER CLIC EN EL BOTÓN DE DEVOLVER
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.btnReturnProduct).on('click', function () {
        const detailId = $(DETAIL_CONFIG.selectors.returnProductId).val();
        const saleId = $(DETAIL_CONFIG.selectors.saleId).val();
        const returnQuantity = parseFloat($('.return-quantity').val());

        if (!returnQuantity || returnQuantity <= 0) {
            showAlert('warning', 'Alerta', 'Selecciona una cantidad válida para devolver.');
            return;
        }
        returnProduct(saleId, detailId, returnQuantity);
    });

    // -----------------------------------------------------------------
    // EVENTOS DE BOTONES PARA IMPRIMIR EL COMPROBANTE DE VENTA (PDF) O GUARDARLO EN PDF
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.modalDetails).on('click', '.btn-print-sale', function () {

        const printWindow = window.open(
            '',
            'printReceipt',
            'width=600,height=600,left=200,top=80,toolbar=no,menubar=no,scrollbars=yes,resizable=yes'
        );
        console.log(selectedRowDetail.id, selectedRowDetail.voucher_id);
        printWindow.location.href = `/sales/${selectedRowDetail.id}/receipt/${selectedRowDetail.voucher_id}/preview`;
    });

    // Evento para limpiar el filtro de rango de fechas
    $(DETAIL_CONFIG.selectors.btnClearDateFilter).on('click', function () {
        saleDatePickerInstance.clear();   // limpia el input y las fechas seleccionadas internamente
        tableDateRange.start = null;
        tableDateRange.end = null;
        salesDetailsTable.ajax.reload();  // recarga la tabla sin el filtro de fecha
    });

    // -----------------------------------------------------------------
    // EVENTOS PARA GENERAR REPORTE GENERAL DE VENTAS EN PDF
    // -----------------------------------------------------------------

    // Evento para generar reporte de ventas al hacer clic en el botón de generar reporte
    $(DETAIL_CONFIG.selectors.btnGenerateReport).on('click', function (event) {
        const startDate = reportDateRange.start;
        const endDate = reportDateRange.end;

        if (!startDate || !endDate) {
            event.preventDefault(); // cancela la navegación solo cuando faltan fechas
            showAlert('warning', 'Alerta', 'Selecciona un rango de fechas para generar el reporte.');
            return;
        }

        const baseUrl = $(this).attr('href').split('?')[0];
        $(this).attr('href', `${baseUrl}?start_date=${startDate}&end_date=${endDate}`);
    });

    // Eventos del modal de reporte
    $(DETAIL_CONFIG.selectors.modalGenerateReport).on('shown.bs.modal', function () {
        initializeDateRangeFilterReport();
    });

    $(DETAIL_CONFIG.selectors.modalGenerateReport).on('hidden.bs.modal', function () {
        reportDateRange.start = null;
        reportDateRange.end = null;
        saleDatePickerInstanceReport.clear();   // limpia el input y las fechas seleccionadas internamente      
    });

    // Evento para limpiar el filtro de rango de fechas
    $(DETAIL_CONFIG.selectors.btnClearDateFilterReport).on('click', function () {
        saleDatePickerInstanceReport.clear();   // limpia el input y las fechas seleccionadas internamente
        reportDateRange.start = null;
        reportDateRange.end = null;
    });

}

// =========================================
// FUNCIONES PARA ATAJOS DE TECLADO
// =========================================
function bindKeyBoardEnter() {

    // Atajo de teclado para enviar el formulario de devolución de producto al presionar Enter
    $(DETAIL_CONFIG.selectors.modalReturnProduct).on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            $(DETAIL_CONFIG.selectors.btnReturnProduct).trigger('click');
        }
    });
}

function bindKeyBoardShortcuts() {
    $(document).on('keydown', function (e) {
        // F1 → Abrir modal de edición de nombre
        if (e.key === 'F1') {
            e.preventDefault();
            selectedRowDetail
                ? openEditNameModal(selectedRowDetail)
                : showAlert('warning', 'Espera', DETAIL_CONFIG.messages.selectRow);
        }

        // F2 → Editar cantidad
        if (e.key === 'F2') {
            e.preventDefault();
            selectedRowDetail
                ? openEditQuantityModal(selectedRowDetail)
                : showAlert('warning', 'Espera', DETAIL_CONFIG.messages.selectRow);
        }

        // F3 → Editar descuento del producto
        if (e.key === 'F3') {
            e.preventDefault();
            selectedRowDetail
                ? openEditDiscountModal(selectedRowDetail)
                : showAlert('warning', 'Espera', DETAIL_CONFIG.messages.selectRow);
        }

        // F4 → Editar precio del producto
        if (e.key === 'F4') {
            e.preventDefault();
            selectedRowDetail
                ? openEditPriceModal(selectedRowDetail)
                : showAlert('warning', 'Espera', DETAIL_CONFIG.messages.selectRow);
        }
    });
}

// =========================================
// FUNCION CARGAR LOS DETALLES DE VENTA EN EL MODAL
// =========================================
function showSaleDetails(saleId) {
    $.ajax({
        url: `${DETAIL_CONFIG.api.base}/${saleId}`,
        method: 'GET',
        dataType: 'json',
        success: (response) => {
            // Rellenado los campos del modal con los datos de la venta
            $('#customer-name').text(response.sale.customer.name);
            $('#customer-code').text(response.sale.customer.code ?? '—');
            $('#customer-tax').text(response.sale.customer.tax_id ?? '—');
            $('#customer-phone').text(response.sale.customer.phone ?? '—');
            $('#customer-address').text(response.sale.customer.address ?? '—');

            $('#user-name').text(response.sale.user.name);

            $('#voucher-name').text(response.sale.voucher.name);
            $('#invoice-number').text(response.sale.invoice_number);
            const dateTime = parseDateTime(response.sale.created_at);
            $('#invoice-date').text(dateTime.date);
            $('#invoice-time').text(dateTime.time);
            $('#payment-status').html(formatStatus(response.sale.status));
            $('#total-amount').text(`$${response.sale.total_amount}`);

            // Cargo los detalles de pago
            if (response.sale.payments.payment_method === 'credito') {
                const paymentDetails = `
                        <p class="text-muted mb-1">Método de pago: <span class="fw-medium">${response.sale.payments.payment_method}</span></p>
                        <p class="text-muted mb-1">Referencia: <span class="fw-medium">${response.sale.payments.reference}</span></p>
                        <p class="text-muted">Monto total: <span class="fw-medium">$${response.sale.payments.amount}</span></p>`;
                $('#payment-details').html(paymentDetails);
            } else {
                let paymentDetailsHtml = '';
                let textClass = '';
                response.sale.payments.forEach(payment => {
                    if (payment.amount < 0) {
                        textClass = 'text-danger';
                    } else {
                        textClass = 'text-success';
                    }
                    paymentDetailsHtml += `
                    <div class="border-bottom pb-2 mb-2 d-flex justify-content-between align-items-center">
                        <p class="text-muted mb-1">Método de pago: <span class="fw-medium">${payment.payment_method}</span></p>
                        <p class="text-muted mb-1">Referencia: <span class="fw-medium">${payment.reference ?? '—'}</span></p>
                        <p class="text-muted mb-0">Monto: <span class="fw-medium ${textClass}">$${payment.amount}</span></p>
                    </div>`;
                });
                $('#payment-details').html(paymentDetailsHtml);
            }

            // Cargar los detalles de los productos en la tabla del modal
            loadProductsDetailsTable(response.sale.details, response.sale.status);

            $(DETAIL_CONFIG.selectors.modalDetails).modal('show');
        },
        error: () => {
            showAlert('error', 'Error', 'No se pudieron obtener los datos de la venta.');
        }
    });
}

/**
 * 
 * @param {Object} row // Fila de datos del detalle de venta
 * @returns clase CSS para aplicar a la fila según el estado de la venta y si el producto ha sido devuelto
 */
function getRowClass(row) {
    const isSaleAnnulled = currentSaleStatus === 'anulado';
    const isProductReturned = row.is_returned == 1; // == para cubrir 1, "1" o true
    return (isSaleAnnulled || isProductReturned) ? 'text-decoration-line-through text-danger' : '';
}

/**
 * Carga los detalles de los productos en la tabla del modal.
 * @param {Array} details Array de detalles de productos
 */
function loadProductsDetailsTable(detailsData, saleStatus) {

    currentSaleStatus = saleStatus; // Guardar el estado actual de la venta para usarlo en getRowClass

    if ($.fn.DataTable.isDataTable(DETAIL_CONFIG.selectors.tableDetails)) {
        detailsTable = $(DETAIL_CONFIG.selectors.tableDetails).DataTable();
        detailsTable.clear().rows.add(detailsData).draw();
        return;
    }

    detailsTable = $(DETAIL_CONFIG.selectors.tableDetails).DataTable({
        processing: false,
        serverSide: false,
        data: detailsData,
        columns: [
            { data: 'id', name: 'id', visible: false },
            { data: 'sale_id', name: 'sale_id', visible: false },
            { data: 'product_id', name: 'product_id', visible: false },
            {
                data: null,
                name: 'description',
                render: function (data, type, row) {
                    return `
                            <div class="d-flex">
                                <div class="flex-grow-1 ms-3">
                                    <h5 class="fs-6 text-body m-1 ${getRowClass(row)}">${data.product_name}</h5>
                                    <p class="text-muted mb-0"><span class="fw-medium">${data.product_code}</span></p>
                                </div>
                            </div>`;
                }
            },
            {
                data: null,
                name: 'quantity',
                className: 'text-center fs-6',
                render: (data, type, row) =>
                    `<h5 class="text-body fs-14 ${getRowClass(row)}">${data.quantity}</h5>`
            },
            {
                data: null,
                name: 'price',
                render: (data, type, row) => `
                        <div class="d-flex justify-content-center">
                            <h5 class="text-body fs-14 me-1 ${getRowClass(row)}">$${data.unit_price}</h5>
                        </div>`
            },
            {
                data: null,
                name: 'discount',
                className: 'text-center fs-6',
                render: (data, type, row) =>
                    `<h5 class="text-body fs-14 ${getRowClass(row)}">$${data.discount}</h5>`
            },
            {
                data: null,
                name: 'total',
                className: 'text-center fs-6',
                render: (data, type, row) =>
                    `<h5 class="text-body fs-14 ${getRowClass(row)}">$${data.total}</h5>`
            },
            {
                data: 'id',
                name: 'actions',
                orderable: false,
                searchable: false,
                render: (data, type, row) => {
                    // Oculta el botón si la venta está anulada O si el producto ya fue devuelto por completo
                    if (currentSaleStatus === 'anulado' || row.is_returned == 1) {
                        return '';
                    }
                    return `
                    <div class="hstack gap-3 fs-15">
                        <a href="javascript:void(0);" class="link-danger btn-return-product" data-bs-toggle="tooltip" data-bs-placement="top" title="Devolver producto" data-id="${data}">
                            <i class="ri-refresh-line"></i>
                        </a>
                    </div>`;
                }
            }
        ],
        scrollY: 280,
        deferRender: true,
        scroller: true,
        searching: false,
        ordering: false,
        paging: false,
        info: false,
        lengthChange: false,
        pageLength: -1,
        autoWidth: false,
    });
}

/**
 * Función para anular una venta. Muestra un modal de confirmación antes de realizar la acción.
 * @param {number} saleId - ID de la venta a anular.
 */
function annulSale(saleId) {
    $.ajax({
        url: `${DETAIL_CONFIG.api.base}/${saleId}/annul`,
        method: 'PUT',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content')
        },
        dataType: 'json',
        success: (response) => {
            if (response.success) {
                showAlert('success', 'Éxito', response.message);
                salesDetailsTable.ajax.reload(null, false); // Recargar la tabla sin resetear la paginación
            } else {
                showAlert('error', 'Error', 'No se pudo anular la venta.');
            }
        },
        error: (xhr, status, error) => {
            showAlert('error', 'Error', 'No se pudo anular la venta.');
        }
    });
}

/**
 * Función para devolver un producto de una venta. Muestra un modal de confirmación antes de realizar la acción.
 * @param {number} productDetailId - ID del detalle del producto a devolver.
 * @param {number} saleId - ID de la venta a la que pertenece el producto.
 * @param {number} quantity - Cantidad de productos a devolver (opcional, por defecto 1).
 */
function returnProduct(saleId, productId, quantity = 1) {
    $.ajax({
        url: `${DETAIL_CONFIG.api.base}/${saleId}/return-product/${productId}`,
        method: 'PUT',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'),
            quantity: quantity
        },
        dataType: 'json',
        success: (response) => {
            console.log('id de la venta modificada', response.detail.id, 'detalles completos', response.detail);
            if (response.success) {
                showAlert('success', 'Éxito', response.message);
                salesDetailsTable.ajax.reload(null, false);
                $(DETAIL_CONFIG.selectors.modalReturnProduct).modal('hide');
                showSaleDetails(response.detail.sale_id); // Recargar los detalles de la venta para reflejar la devolución
            } else {
                showAlert('error', 'Error', 'No se pudo devolver el producto.');
            }
        },
        error: (xhr, status, error) => {
            showAlert('error', 'Error', 'No se pudo devolver el producto.');
        }
    });
}

/**
 * FUNCTION PARA GENERAR REPORTE GENERAL DE VENTAS EN PDF
 * @param {string} startDate - Fecha de inicio del rango de fechas (opcional)
 * @param {string} endDate - Fecha de fin del rango de fechas (opcional)
 */
function generateSalesReport(startDate = null, endDate = null) {
    $.ajax({
        url: '/reports/generate',
        method: 'GET',
        data: {
            start_date: startDate,
            end_date: endDate,
            _token: $('meta[name="csrf-token"]').attr('content')
        },
        dataType: 'json',
        success: (response) => {

            if (response.success) {
                showAlert('success', 'Éxito', response.message);
            } else {
                showAlert('error', 'Error', 'No se pudo generar el reporte.');
            }

        },
        error: (xhr, status, error) => {
            showAlert('error', 'Error', 'No se pudo generar el reporte.');
        }
    });
}
// =========================================
// FUNCION AUXILIARES
// =========================================

/**
 * Convierte el estado de la venta en un badge HTML correspondiente.
 * @param {string} status 
 * @returns {string} HTML con el badge correspondiente al estado
 */
function formatStatus(status) {
    switch (status) {
        case 'procesado':
            return '<span class="badge bg-success-subtle text-success">Procesado</span>';
        case 'anulado':
            return '<span class="badge bg-danger-subtle text-danger">Anulado</span>';
        default:
            return '<span class="badge bg-secondary-subtle text-secondary">Desconocido</span>';
    }
}
/**
 * Parses an ISO 8601 date string and returns an object with formatted date and time.
 * @param {string} isoString ISO 8601 date string
 * @returns {{date: string, time: string}} datos parseados
 */
function parseDateTime(isoString) {
    const date = new Date(isoString);
    return {
        date: date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    };
}

/**
 * Crea un datepicker de rango reutilizable y devuelve la instancia
 * @param {string} selector - Selector del input donde se aplicará el datepicker.
 * @param {function} onSelect - Función a ejecutar cuando cambie el rango de fechas.
 * @param {Object} targetRange - Rango de fechas seleccionado, con propiedades start y end.
 */
function createRangeDatePicker(selector, targetRange, onSelect) {
    return flatpickr(selector, {
        mode: 'range',
        dateFormat: 'd M, Y',
        onClose: function (selectedDates) {
            if (selectedDates.length === 2) {
                targetRange.start = formatDateForBackend(selectedDates[0]);
                targetRange.end = formatDateForBackend(selectedDates[1]);
            } else {
                targetRange.start = null;
                targetRange.end = null;
            }
            if (onSelect) onSelect();
        }
    });
}

/**
 * Convierte un objeto Date a formato 'YYYY-MM-DD' para enviarlo al backend.
 */
function formatDateForBackend(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// =========================================
// CONSTANTES: Configuración idioma DataTable
// =========================================
const idiomaEspanol = {
    loadingRecords: "Cargando...",
    paginate: {
        first: "Primero",
        last: "Último",
        next: "Siguiente",
        previous: "Anterior"
    },
    processing: "Procesando...",
    search: "Buscar:",
    lengthMenu: "Mostrar _MENU_ registros",
    emptyTable: "No hay datos disponibles",
    info: "Del _START_ al _END_ de _TOTAL_ registros"
};