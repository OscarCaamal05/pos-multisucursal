import { showAlert, clearValidationErrors, handleValidationError, showConfirmationAlert } from '../../utils/alerts';
import { getDataTableLanguage } from '../../utils/datatableLanguage';
import { renderActionsColumn } from '../../helpers/PurchasesHelper';

// =========================================
// CONFIGURACIÓN ESPECÍFICA DEL MÓDULO
// =========================================
const DETAIL_CONFIG = {
    selectors: {
        table: '#tableTempPurchase',
        form: '#productDetails',
        tempPurchaseId: '#temp_purchase_id',
        tempId: '#temp_id',
        quantity: '#quantity',
        cost: '#cost',
        discountNumber: '#discount-number',
        discountPercentage: '#discount-percentage',
        generalDiscount: '#general-discount-number',
        modalDetails: '#modal-product-details',
        btnEdit: '#btn-edit-product',
        btnCancel: '#btn-cancel-purchase',
        btnCancelModal: '#btn-cancelar-product-details',
        autoSelect: '.auto-select',
    },
    api: {
        base: '/temp_purchases_detail',
        add: '/temp_purchases_detail/add',
        totals: '/temp_purchases_detail/totals',
        discount: '/temp_purchases_detail/updateDiscount/',
        cancel: '/temp_purchases_detail/cancelPurchase',
        getProductTemp: '/temp_purchases_detail/getDataProductTemp',
    },
    messages: {
        selectRow: 'Seleccione una fila para continuar',
        deleteError: 'No se pudo eliminar el registro.',
        quantityRequired: 'La cantidad del producto debe ser mayor a 0',
    }
};

// =========================================
// VARIABLES LOCALES DEL MÓDULO
// =========================================
let tableDetails = null;  // Instancia del DataTable principal
let selectedRowDetail = null; // id_temp de la fila seleccionada actualmente

// =========================================
// INICIALIZACIÓN DEL MÓDULO
// =========================================

/**
 * Punto de entrada del módulo.
 * Se llama desde purchaseMain.js dentro del $(document).ready.
 */
export function initDetailModule() {
    try {
        initTableDetails();
        bindDeleteEvents();
        bindDetailEvents();
        _listenProductEvents();
        console.log('✅ Módulo de detalle de compra inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar módulo de detalle:', error);
    }
}

// =========================================
// DATATABLE: Tabla temporal de compra
// =========================================

/**
 * Inicializa el DataTable de la tabla temporal de compra.
 */
function initTableDetails() {
    tableDetails = $(DETAIL_CONFIG.selectors.table).DataTable({
        processing: true,
        serverSide: true,
        ajax: `${DETAIL_CONFIG.api.base}/data`,
        columns: [
            { data: 'id_temp', name: 'id_temp', visible: false },
            { data: 'temp_purchase_id', name: 'temp_purchase_id', visible: false },
            { data: 'product_id', name: 'product_id', visible: false },
            {
                data: null,
                name: 'description',
                render: function (data, type, row) {
                    return `
                        <div class="d-flex">
                            <div class="flex-grow-1 ms-3">
                                <h5 class="fs-14 text-body m-1">${row.product_name}</h5>
                                <p class="text-muted mb-0"><span class="fw-medium">${row.barcode}</span></p>
                            </div>
                        </div>`;
                }
            },
            {
                data: null,
                name: 'quantity',
                className: 'text-center fs-6',
                render: (data, type, row) =>
                    `<h5 class="text-body fs-14">${row.quantity}</h5>`
            },
            {
                data: null,
                name: 'factor',
                className: 'text-center',
                render: (data, type, row) =>
                    `<h5 class="text-body fs-14">${row.factor}</h5>`
            },
            {
                data: null,
                name: 'purchase_price',
                render: (data, type, row) => `
                    <div class="d-flex justify-content-center">
                        <h5 class="text-body fs-14 me-1">$${row.purchase_price}</h5>
                        <span class="text-muted fs-12 fw-semibold">X ${row.unit_name}</span>
                    </div>`
            },
            {
                data: null,
                name: 'discount',
                className: 'text-center fs-6',
                render: (data, type, row) =>
                    `<h5 class="text-body fs-14">$${row.discount}</h5>`
            },
            {
                data: null,
                name: 'total',
                className: 'text-center fs-6',
                render: (data, type, row) =>
                    `<h5 class="text-body fs-14">$${row.total}</h5>`
            },
            { data: 'unit_id', name: 'unit_id', visible: false },
            {
                data: 'id_temp',
                name: 'actions',
                orderable: false,
                searchable: false,
                render: renderActionsColumn
            }
        ],
        scrollY: 500,
        deferRender: true,
        scroller: true,
        language: getDataTableLanguage({
            emptyTable: "No hay productos agregados a la compra",
        }),
        searching: false,
        ordering: false,
        paging: false,
        info: false,
        lengthChange: false,
        pageLength: -1,
    });
}

// =========================================
// EVENTO: Eliminar producto de la lista
// =========================================

/**
 * Asocia el evento de eliminación de productos en la tabla temporal.
 */
function bindDeleteEvents() {
    $(`${DETAIL_CONFIG.selectors.table} tbody`).on('click', '.btn-delete-detail', function () {
        const detailId = $(this).data('id');

        $.ajax({
            url: `${DETAIL_CONFIG.api.base}/${detailId}`,
            type: 'DELETE',
            data: { _token: $('meta[name="csrf-token"]').attr('content') },
            success: function (response) {
                tableDetails.ajax.reload(null, false);
                showTotals(response);
            },
            error: function () {
                showAlert('error', 'Error', DETAIL_CONFIG.messages.deleteError);
            }
        });
    });
}

// =========================================
// EVENTOS: Interacción con la tabla y modal de detalle
// =========================================

/**
 * Agrupa todos los eventos de interacción del módulo de detalle.
 */
function bindDetailEvents() {

    // -----------------------------------------------------------------
    // Seleccionar fila con un click → resaltado visual + guardar id_temp
    // -----------------------------------------------------------------
    $(`${DETAIL_CONFIG.selectors.table} tbody`).on('click', 'tr', function () {
        $(`${DETAIL_CONFIG.selectors.table} tbody tr.selected`).removeClass('selected table-light');
        $(this).addClass('selected table-light');

        const data = tableDetails.row(this).data();
        selectedRowDetail = data ? data.id_temp : null;
    });

    // -----------------------------------------------------------------
    // Doble click en fila → abrir modal de edición del producto
    // -----------------------------------------------------------------
    $(`${DETAIL_CONFIG.selectors.table} tbody`).on('dblclick', 'tr', function () {
        const data = tableDetails.row(this).data();
        if (data) {
            getDataProductDetail(data.id_temp, true);
        }
    });

    // -----------------------------------------------------------------
    // Botón editar → valida que haya una fila seleccionada
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.btnEdit).on('click', function () {
        if (selectedRowDetail) {
            getDataProductDetail(selectedRowDetail, true);
        } else {
            showAlert('warning', 'Espera', DETAIL_CONFIG.messages.selectRow);
        }
    });

    // -----------------------------------------------------------------
    // Descuento general → aplica al perder foco (blur)
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.generalDiscount).on('blur', function () {
        applyDiscount($(this).val());
    });

    // -----------------------------------------------------------------
    // Auto-select → selecciona todo el texto al hacer foco
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.autoSelect).on('focus', function () {
        const $this = $(this);
        $this.trigger('select');
        $this.on('mouseup.selectText', function (e) {
            e.preventDefault();
            $this.off('mouseup.selectText');
        });
    });

    // -----------------------------------------------------------------
    // Botón cancelar modal de detalle → limpia y cierra
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.btnCancelModal).on('click', function () {
        clearProductDetailModal();
        $(DETAIL_CONFIG.selectors.modalDetails).modal('hide');
    });

    // -----------------------------------------------------------------
    // Botón cancelar compra → confirmación antes de cancelar
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.btnCancel).on('click', function () {
        showConfirmationAlert(
            '¿Estás seguro?',
            '¡No podrás revertir esta acción!',
            'Sí, Cancelar',
            'No, Cerrar',
            (confirmed) => {
                if (confirmed) {
                    cancelTempPurchase();
                }
            }
        );
    });

    // -----------------------------------------------------------------
    // Modal de detalle → focus automático en cantidad al mostrarse
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.modalDetails).on('shown.bs.modal', function () {
        $(DETAIL_CONFIG.selectors.quantity).trigger('focus').trigger('select');
    });

    // -----------------------------------------------------------------
    // Form de detalle → submit (agregar o editar producto en la lista)
    // -----------------------------------------------------------------
    bindAddProductForm();
}

// =========================================
// SUBMIT: Agregar / editar producto en la lista temporal
// =========================================

/**
 * Maneja el submit del formulario de detalle de producto.
 * Distingue entre creación (POST) y edición (PUT) según el valor de #temp_id.
 */
function bindAddProductForm() {
    $(DETAIL_CONFIG.selectors.form).on('submit', function (e) {
        e.preventDefault();

        // Habilitar el campo factor para que se serialice correctamente
        $('.factor').prop('disabled', false);

        const detailId = $(DETAIL_CONFIG.selectors.tempId).val();
        const isEdit = detailId != 0;

        // Validar cantidad
        const quantity = parseFloat($(DETAIL_CONFIG.selectors.quantity).val());
        if (!quantity || quantity <= 0) {
            showAlert('warning', 'Validación', DETAIL_CONFIG.messages.quantityRequired);
            $(DETAIL_CONFIG.selectors.quantity).trigger('focus');
            return false;
        }

        const formData = $(this).serialize();
        clearValidationErrors();

        $.ajax({
            url: isEdit
                ? `${DETAIL_CONFIG.api.base}/${detailId}`
                : DETAIL_CONFIG.api.add,
            method: isEdit ? 'PUT' : 'POST',
            data: formData,
            success: function (response) {
                // Actualizar temp_purchase_id si viene en la respuesta
                if (response.temp_purchase_id) {
                    $(DETAIL_CONFIG.selectors.tempPurchaseId).val(response.temp_purchase_id);
                }

                // PUT devuelve totales en response.totals, POST los devuelve directamente
                showTotals(isEdit && response.totals ? response.totals : response);

                tableDetails.ajax.reload(null, false);
                $(DETAIL_CONFIG.selectors.modalDetails).modal('hide');
                $(DETAIL_CONFIG.selectors.tempId).val(0);
                $('.factor').prop('disabled', false);
                $(DETAIL_CONFIG.selectors.autoSelect).trigger('focus').trigger('select');
            },
            error: function (xhr) {
                handleValidationError(xhr);
            }
        });
    });
}

// =========================================
// AJAX: Obtener datos de un producto del detalle temporal
// =========================================

/**
 * Consulta los datos de un registro de la tabla temporal por su id_temp
 * y abre el modal de detalle para edición.
 *
 * @param {number}  detailId - id_temp del registro
 * @param {boolean} isEdit   - true si se abre para editar
 */
export function getDataProductDetail(detailId, isEdit = true) {
    $.ajax({
        url: `${DETAIL_CONFIG.api.getProductTemp}/${detailId}`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            const data = response.detail;
            // Garantizar que id_temp esté presente al editar
            if (!data.id_temp && isEdit) {
                data.id_temp = detailId;
            }
            // Delegar el pintado del modal al productModule (se importa desde allá)
            // Se emite un evento custom para no crear dependencia circular
            $(document).trigger('purchases:showProductDetail', [data, isEdit]);
        },
        error: function (xhr) {
            console.error('Error al obtener datos del producto:', xhr);
            showAlert('error', 'Error', 'No se pudieron obtener los datos del producto');
        }
    });
}

// =========================================
// TOTALES
// =========================================

/**
 * Consulta los totales actuales de la compra al servidor y los muestra.
 *
 * @param {number} tempPurchaseId - ID de la compra temporal
 */
export function loadTotals(tempPurchaseId) {
    $.ajax({
        url: `${DETAIL_CONFIG.api.totals}/${tempPurchaseId}`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            showTotals(response);
        }
    });
}

/**
 * Aplica un descuento general a la compra y actualiza los totales.
 *
 * @param {number|string} discountApplied - Valor del descuento
 */
export function applyDiscount(discountApplied) {
    const tempId = $(DETAIL_CONFIG.selectors.tempPurchaseId).val();

    $.ajax({
        url: DETAIL_CONFIG.api.discount,
        method: 'POST',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'),
            temp_id: tempId,
            discount: discountApplied,
        },
        success: function (response) {
            showTotals(response);
        },
        error: function () {
            // Error silencioso: los totales simplemente no se actualizan
        }
    });
}

/**
 * Muestra los totales de la compra en la interfaz.
 *
 * @param {Object} totals - Objeto con sub_total, total_siva, tax, total, discount
 */
export function showTotals(totals) {
    const fmt = (value) =>
        parseFloat(value).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    $('.sub-total').text(`$${fmt(totals.sub_total)}`);
    $('.total-tax').text(`$${fmt(totals.total_siva)}`);
    $('.tax').text(`$${fmt(totals.tax)}`);
    $('.total').text(`$${fmt(totals.total)}`);
    $('.discount-general').val((totals.discount || 0).toFixed(2));
}

// =========================================
// CANCELAR COMPRA
// =========================================

/**
 * Cancela la compra temporal eliminando todos sus registros.
 */
function cancelTempPurchase() {
    const tempActualId = $(DETAIL_CONFIG.selectors.tempPurchaseId).val();

    $.ajax({
        url: `${DETAIL_CONFIG.api.cancel}/${tempActualId}`,
        method: 'GET',
        dataType: 'json',
        success: function () {
            cleanInputPurchase();
            applyDiscount(0);
            location.reload();
        }
    });
}

// =========================================
// LIMPIEZA
// =========================================

/**
 * Limpia todos los campos del modal de detalle de producto.
 */
export function clearProductDetailModal() {
    $(DETAIL_CONFIG.selectors.form)
        .find('input, select, textarea')
        .not('input[type="hidden"]')
        .each(function () {
            if ($(this).is(':checkbox') || $(this).is(':radio')) {
                $(this).prop('checked', false);
            } else {
                $(this).val('');
            }
        });

    $('.factor').prop('disabled', false);

    // Limpiar textos de spans y márgenes
    $('.product-name, .barcode, .stock, .factor, .price-purchase, .price-purchase-iva, ' +
        '.price-sale-1, .price-sale-2, .price-sale-3, .price-unit, .unit-purchase').text('');

    [1, 2, 3].forEach(index => $(`.margin-${index}`).text(''));
}

/**
 * Limpia todos los campos de la compra en curso.
 * Se exporta para que otros módulos (paymentModule, waitingModule) puedan usarla.
 */
export function cleanInputPurchase() {
    // Proveedor
    $('#supplier_id').val(0);
    $('.company_name').html('No seleccionado');
    $('.name_supplier').html('Proveedor');
    $('.email_supplier, .phone_supplier, .rfc_supplier, .credit_supplier').html('');
    $('.credit-terms, .credit-limit, .credit_available, .credit-due-date').val(0);
    $('#general-discount-number').val(0.00);

    // Inputs de búsqueda
    $('#auto_complete_supplier').val('');
    $('#auto_complete_product').val('');

    // Selects del documento
    $('#document-type').val(2).trigger('change');
    $('#voucher-type').val(1).trigger('change');
    $('#invoice_number').val('');

    // Limpiar localStorage del proveedor
    localStorage.removeItem('proveedorSeleccionado');

    // Restablecer fecha al día actual
    const dateEl = $('input[data-provider="flatpickr"]')[0];
    if (dateEl && dateEl._flatpickr) {
        const today = new Date();
        const current = dateEl._flatpickr.selectedDates[0];
        if (!current || current.toDateString() !== today.toDateString()) {
            dateEl._flatpickr.setDate(today, true);
        }
    }
}

// =========================================
// GETTERS PÚBLICOS
// =========================================

/**
 * Retorna la instancia del DataTable principal.
 * Otros módulos deben usar este getter en lugar de acceder a la variable directamente.
 *
 * @returns {DataTable|null}
 */
export function getTableDetails() {
    return tableDetails;
}

/**
 * Retorna el id_temp de la fila actualmente seleccionada.
 *
 * @returns {number|null}
 */
export function getSelectedRowDetail() {
    return selectedRowDetail;
}

/**
 * Escucha los eventos disparados por productModule para mantener
 * la tabla y los totales sincronizados sin crear dependencia circular.
 */
function _listenProductEvents() {

    // productModule dispara este evento cuando el form del detalle
    // se envía con éxito (POST nuevo o PUT edición)
    $(document).on('purchases:productSaved', function (e, totals) {

        // 1. Actualizar los totales en el DOM
        if (totals) {
            showTotals(totals);
        }

        // 2. Recargar la tabla temporal sin resetear la paginación
        if (tableDetails) {
            tableDetails.ajax.reload(null, false);
        }
    });
}
