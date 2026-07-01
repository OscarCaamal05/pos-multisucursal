import { showAlert, clearValidationErrors, handleValidationError, showConfirmationAlert } from '../../utils/alerts';
import { getDataTableLanguage } from '../../utils/datatableLanguage';
import { renderActionsColumn } from '../../helpers/SalesHelper';
import { cleanCustomerData } from './customerModule';
import { head } from 'lodash';

// =========================================
// CONFIGURACIÓN ESPECÍFICA DEL MÓDULO
// =========================================
const DETAIL_CONFIG = {
    selectors: {
        table: '#tableTempSale',
        form: '#productDetails',
        tempSaleId: '#temp_sale_id',
        tempDetailId: '#temp_detail_id',
        tempId: '#temp_id',
        quantity: '#quantity',
        generalDiscount: '#general-discount-number',
        modalDetails: '#modal-product-details',
        btnEditName: '#btn-edit-product',
        btnEditQuantity: '#btn-edit-product-quantity',
        btnEditPrice: '#btn-edit-product-price',
        btnEditDiscount: '#btn-edit-product-discount',
        btnCancel: '#btn-cancel-sale',
        btnCancelModal: '#btn-cancelar-product-details',
        autoSelect: '.auto-select',
        discountPercentage: '#product-discount-percentage',
        discountNumber: '#product-discount-number',
    },
    api: {
        base: '/temp_sales_detail',
        add: '/temp_sales_detail/add',
        delete: '/temp_sales_detail/removeProductFromTempSale',
        totals: '/temp_sales_detail/totals',
        discount: '/temp_sales_detail/updateDiscount/',
        cancel: '/temp_sales_detail/cancelSale',
        getProductTemp: '/temp_sales_detail/getDataProductTemp',
        editProductName: '/temp_sales_detail/editProductName',
        editProductQuantity: '/temp_sales_detail/editProductQuantity',
        editProductDiscount: '/temp_sales_detail/editProductDiscount',
        updatePrice: '/temp_sales_detail/updatePrice',
        checkProductPrice: '/temp_sales_detail/checkProductPrice',
    },
    messages: {
        selectRow: 'Seleccione una fila para continuar',
        deleteError: 'No se pudo eliminar el registro.',
        quantityRequired: 'La cantidad del producto debe ser mayor a 0',
        discountRequired: 'El descuento del producto no puede ser negativo',
    }
};

// =========================================
// VARIABLES LOCALES DEL MÓDULO
// =========================================
let tableDetails = null;     // Instancia del DataTable principal
let selectedRowDetail = null; // Datos completos de la fila seleccionada actualmente
// =========================================
// INICIALIZACIÓN DEL MÓDULO
// =========================================

/**
 * Punto de entrada del módulo.
 * Se llama desde salesMain.js dentro del $(document).ready.
 */
export function initDetailModule() {
    try {
        initTableDetails();
        bindDeleteEvents();
        bindDetailEvents();
        bindKeyBoardShortcuts();
        bindKeyBoardEnter();
        _listenProductEvents();
        bindCalculationEvents();
        syncReceiptFields();
        console.log('✅ Módulo de detalle de venta inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar módulo de detalle de venta:', error);
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
            { data: 'id_temp_sale_detail', name: 'id_temp_sale_detail', visible: false },
            { data: 'temp_sale_id', name: 'temp_sale_id', visible: false },
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
                name: 'price',
                render: (data, type, row) => `
                    <div class="d-flex justify-content-center">
                        <h5 class="text-body fs-14 me-1">$${row.price}</h5>
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
                data: 'id_temp_sale_detail',
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
        const id_temp_sale_detail = $(this).data('id');

        $.ajax({
            url: DETAIL_CONFIG.api.delete,
            type: 'POST',
            data: {
                id_temp_sale_detail: id_temp_sale_detail,
                temp_sale_id: $('#temp_sale_id').val(),
                _token: $('meta[name="csrf-token"]').attr('content')
            },
            success: function (response) {
                tableDetails.ajax.reload(null, false);
                showTotals(response);
                selectedRowDetail = null;
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

    bindCalculationEvents();
    // -----------------------------------------------------------------
    // Seleccionar fila con un click → resaltado visual + guardar los datos de la fila seleccionada en selectedRowDetail
    // -----------------------------------------------------------------
    $(`${DETAIL_CONFIG.selectors.table} tbody`).on('click', 'tr', function () {
        $(`${DETAIL_CONFIG.selectors.table} tbody tr.selected`).removeClass('selected table-light');
        $(this).addClass('selected table-light');

        const data = tableDetails.row(this).data();
        selectedRowDetail = data ? data : null;
    });

    // -----------------------------------------------------------------
    // Handler con map de columna para evitar múltiples handlers de doble click en el mismo elemento
    // -----------------------------------------------------------------
    const dblclickHandlers = {
        3: (data) => openEditNameModal(data), // Columna description (product_name)
        4: (data) => openEditQuantityModal(data), // Columna quantity (product_quantity)
        5: (data) => openEditPriceModal(data), // Columna price (product_price)
        6: (data) => openEditDiscountModal(data), // Columna discount
    }

    // -----------------------------------------------------------------
    // Doble click en fila → abrir modal para edicion del nombre del producto
    // -----------------------------------------------------------------
    $(`${DETAIL_CONFIG.selectors.table} tbody`).on('dblclick', 'td', function () {
        const columnIndex = tableDetails.cell(this).index().column;
        const handler = dblclickHandlers[columnIndex];
        if (!handler) return;

        const data = tableDetails.row($(this).closest('tr')).data();
        if (data) handler(data);
    });

    // -----------------------------------------------------------------
    // Botón para editar el nombre del producto → valida que haya una fila seleccionada
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.btnEditName).on('click', () => {
        selectedRowDetail ? openEditNameModal(selectedRowDetail) : showAlert('warning', 'Espera', DETAIL_CONFIG.messages.selectRow);
    });

    // -----------------------------------------------------------------
    // Botón para enviar el nuevo nombre del producto
    // -----------------------------------------------------------------
    $('#btn-save-edit-product-name').on('click', () => {
        const newName = $('#product-new-name').val();
        newName ? editProductName(newName) : showAlert('warning', 'Espera', 'El nombre del producto no puede estar vacío');
    });

    // -----------------------------------------------------------------
    // EVENTOS DE LOS MODALES DE EDICIÓN DE NOMBRE
    // -----------------------------------------------------------------
    $('#modal-edit-product-name').on('shown.bs.modal', function () {
        $('#product-new-name').trigger('focus').trigger('select');
    });

    $('#modal-edit-product-name').on('hidden.bs.modal', function () {
        cleanEditModal();
        $('#product-new-name').val('');
    });

    // -----------------------------------------------------------------
    // Doble click en fila → abrir modal para edicion de la cantidad del producto
    // -----------------------------------------------------------------
    $(`${DETAIL_CONFIG.selectors.table} tbody`).on('dblclick', 'td', function () {
        const columnIndex = tableDetails.cell(this).index().column;
        const handler = dblclickHandlers[columnIndex];
        if (!handler) return;

        const data = tableDetails.row($(this).closest('tr')).data();
        if (data) handler(data);
    });

    // -----------------------------------------------------------------
    // Botón para cambiar la cantidad → valida que haya una fila seleccionada
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.btnEditQuantity).on('click', () => {
        selectedRowDetail ? openEditQuantityModal(selectedRowDetail) : showAlert('warning', 'Espera', DETAIL_CONFIG.messages.selectRow);
    });

    // -----------------------------------------------------------------
    // Botón para enviar la nueva cantidad del producto
    // -----------------------------------------------------------------
    $('#btn-save-product-quantity').on('click', () => {
        const newQuantity = parseFloat($('.product-quantity').val());
        if (!newQuantity || newQuantity <= 0) {
            showAlert('warning', 'Espera', DETAIL_CONFIG.messages.quantityRequired);
            return;
        }
        setNewQuantity(newQuantity);
    });

    // -----------------------------------------------------------------
    // EVENTOS DE LOS MODALES DE EDICIÓN DE CANTIDAD
    // -----------------------------------------------------------------
    $('#modal-edit-product-quantity').on('shown.bs.modal', function () {
        $('.product-quantity').trigger('focus').trigger('select');
    });

    $('#modal-edit-product-quantity').on('hidden.bs.modal', function () {
        cleanEditModal();
        $('.product-quantity').val('');
    });

    // -----------------------------------------------------------------
    // Doble click en fila → abrir modal para cambiar el precio de venta del producto
    // -----------------------------------------------------------------
    $(`${DETAIL_CONFIG.selectors.table} tbody`).on('dblclick', 'td', function () {
        const columnIndex = tableDetails.cell(this).index().column;
        // Indice 5 = columna price
        const handler = dblclickHandlers[columnIndex];
        if (!handler) return;

        const data = tableDetails.row($(this).closest('tr')).data();
        if (data) handler(data);
    });

    // -----------------------------------------------------------------
    // Botón para cambiar el precio → valida que haya una fila seleccionada
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.btnEditPrice).on('click', () => {
        selectedRowDetail ? openEditPriceModal(selectedRowDetail) : showAlert('warning', 'Espera', DETAIL_CONFIG.messages.selectRow);
    });


    // -----------------------------------------------------------------
    // APLICAR EL PRECIO SELECCIONADO
    // -----------------------------------------------------------------
    $('#btn-save-product-price').on('click', function () {
        const detailId = $(DETAIL_CONFIG.selectors.tempDetailId).val();
        const newPrice = parseFloat($('#select-product-price').val());

        if (!newPrice || newPrice <= 0) {
            showAlert('warning', 'Alerta', 'Selecciona un precio válido.');
            return;
        }
        //Aquí llamas a tu función para actualizar el precio en TempSaleDetail
        updateProductPrice(detailId, newPrice);
    });

    // -----------------------------------------------------------------
    // EVENTOS DE LOS MODALES DE EDICIÓN DE PRECIO
    // -----------------------------------------------------------------
    $('#modal-edit-product-price').on('hidden.bs.modal', function () {
        cleanEditModal();
        // Limpiar select
        $('#select-product-price').empty();

        // Limpiar campos ocultos
        $(DETAIL_CONFIG.selectors.tempDetailId).val('');
        $(DETAIL_CONFIG.selectors.productId).val('');
    });

    // -----------------------------------------------------------------
    // Doble click en fila → abrir modal para agregar un descuento al producto
    // -----------------------------------------------------------------
    $(`${DETAIL_CONFIG.selectors.table} tbody`).on('dblclick', 'td', function () {
        const columnIndex = tableDetails.cell(this).index().column;
        // Índice 6 = columna discount
        const handler = dblclickHandlers[columnIndex];
        if (!handler) return;

        const data = tableDetails.row($(this).closest('tr')).data();
        if (data) handler(data);
    });

    // -----------------------------------------------------------------
    // Botón para cambiar el descuento → valida que haya una fila seleccionada
    // -----------------------------------------------------------------
    $(DETAIL_CONFIG.selectors.btnEditDiscount).on('click', () => {
        selectedRowDetail ? openEditDiscountModal(selectedRowDetail) : showAlert('warning', 'Espera', DETAIL_CONFIG.messages.selectRow);
    });

    // -----------------------------------------------------------------
    // Botón para enviar el nuevo descuento del producto
    // -----------------------------------------------------------------
    $('#btn-save-product-discount').on('click', () => {
        const newDiscount = parseFloat($('#product-discount-number').val());
        newDiscount >= 0 ? setNewDiscount(newDiscount) : showAlert('warning', 'Espera', DETAIL_CONFIG.messages.discountRequired);
    });

    // -----------------------------------------------------------------
    // EVENTOS DE LOS MODALES DE EDICIÓN DE DESCUENTO
    // -----------------------------------------------------------------
    $('#modal-edit-product-discount').on('shown.bs.modal', function () {
        $('#product-discount-number').trigger('focus').trigger('select');
    });

    $('#modal-edit-product-discount').on('hidden.bs.modal', function () {
        cleanEditModal();
        $('#product-discount-number').val('');
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
                    cancelTempSale();
                }
            }
        );
    });

    // -----------------------------------------------------------------
    // CAMBIO DE SERIE Y FOLIO → Actualiza los campos de serie y folio al cambiar el comprobante
    // -----------------------------------------------------------------
    $('#voucher-type').on('change', function () {
        syncReceiptFields();
    });
}

// =========================================
// FUNCIONES PARA ATAJOS DE TECLADO
// =========================================
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

function bindKeyBoardEnter() {
    // Enter en modal de nombre
    $('#modal-edit-product-name').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            $('#btn-save-edit-product-name').trigger('click');
        }
    });

    // Enter en modal de cantidad
    $('#modal-edit-product-quantity').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            $('#btn-save-product-quantity').trigger('click');
        }
    });

    // Enter en modal de descuento
    $('#modal-edit-product-discount').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            $('#btn-save-product-discount').trigger('click');
        }
    });

    // Enter en modal de precio
    $('#modal-edit-product-price').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            $('#btn-save-product-price').trigger('click');
        }
    });
}

// =========================================
// FUNCIONES PARA ABRIR LOS MODALES DE EDICIÓN
// =========================================

/**
 * Función para abrir el modal de edición del nombre del producto.
 * @param {object} data datos de la fila seleccionada
 */
function openEditNameModal(data) {
    $('.product-name-label').html(data.product_name);
    $('#product-new-name').val(data.product_name);
    $('#modal-edit-product-name').modal('show');
}

/**
 * Función para abrir el modal de edición de la cantidad del producto.
 * @param {object} data datos de la fila seleccionada
 */
function openEditQuantityModal(data) {
    $('.product-name-label').html(data.product_name);
    $('.product-quantity').val(data.quantity);
    $('#modal-edit-product-quantity').modal('show');
}

/**
 * Función para abrir el modal de edición del descuento del producto.
 * @param {object} data datos de la fila seleccionada
 */
function openEditPriceModal(data) {
    $('.product-name-label').html(data.product_name);
    $('#modal-edit-product-price').modal('show');
    $(DETAIL_CONFIG.selectors.tempDetailId).val(data.id_temp_sale_detail);
    const $select = $('#select-product-price');

    $select.html('<option disabled selected>Cargando precios...</option>');
    $.ajax({
        url: `${DETAIL_CONFIG.api.checkProductPrice}/${data.product_id}`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.status === 'success') {
                $select.empty();
                response.prices.forEach(price => {
                    $select.append(
                        $('<option>', {
                            value: price.value,
                            'data-key': price.key,
                            text: `${price.label} — $${parseFloat(price.value).toFixed(2)}`
                        })
                    );
                });
            } else {
                $select.html('<option disabled selected>No se encontraron precios</option>');
            }
        }
    });
}

/**
 * Función para abrir el modal de edición del descuento del producto.
 * @param {object} data datos de la fila seleccionada
 */
function openEditDiscountModal(data) {
    $('.product-name-label').html(data.product_name);

    const discount = parseFloat(data.discount) || 0;
    const price = parseFloat(data.price) || 0;
    const pct = price > 0 ? ((discount / price) * 100).toFixed(0) : '0';

    $('#product-discount-number').val(discount.toFixed(2));
    $('#product-discount-percentage').val(pct);
    $('#modal-edit-product-discount').modal('show');
}
// =========================================
// FUNCIONES PARA MENEJAR LOS PRODUCTOS EN EL DETALLE
// =========================================

/**
 * Funcion para editar el nombre del producto en el detalle de venta.
 *
 * @param {string} newName - Nuevo nombre del producto
 */

function editProductName(newName) {
    if (!selectedRowDetail) return;

    if (newName) {
        $.ajax({
            url: DETAIL_CONFIG.api.editProductName,
            method: 'POST',
            data: {
                _token: $('meta[name="csrf-token"]').attr('content'),
                id_temp_sale_detail: selectedRowDetail.id_temp_sale_detail,
                temp_sale_id: selectedRowDetail.temp_sale_id,
                new_name: newName
            },
            success: function (response) {
                if (response.success) {
                    tableDetails.ajax.reload(null, false);
                    cleanEditModal();
                    $('#modal-edit-product-name').modal('hide');
                    $('#auto_complete_product').val('').trigger('focus');
                    selectedRowDetail = null;
                } else {
                    showAlert('error', 'Error', response.message);
                }
            }
        });
    }
}

/**
 * Funcion para enviar la nueva cantidad del producto al servidor y actualizar el detalle de venta.
 *
 * @param {number|string} newQuantity - Nueva cantidad ingresada por el usuario
 */
function setNewQuantity(newQuantity) {
    if (!selectedRowDetail) return;

    $.ajax({
        url: DETAIL_CONFIG.api.editProductQuantity,
        method: 'POST',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'),
            id_temp_sale_detail: selectedRowDetail.id_temp_sale_detail,
            temp_sale_id: selectedRowDetail.temp_sale_id,
            new_quantity: newQuantity
        },
        success: function (response) {
            if (response.success) {
                tableDetails.ajax.reload(null, false);
                showTotals(response.totals ?? response);
                cleanEditModal();
                $('#modal-edit-product-quantity').modal('hide');
                $('#auto_complete_product').val('').trigger('focus');
                selectedRowDetail = null;
            } else {
                showAlert('error', 'Error', response.message);
            }
        }
    });
}

function updateProductPrice(detailId, newPrice) {
    $.ajax({
        url: DETAIL_CONFIG.api.updatePrice,
        method: 'POST',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'),
            temp_sale_id: $(DETAIL_CONFIG.selectors.tempSaleId).val(),
            id_temp_sale_detail: detailId,
            new_price: newPrice,
        },
        dataType: 'json',

        success: (response) => {
            if (!response.success) {
                showAlert('warning', 'Advertencia', response.message);
                return;
            }

            $('#modal-edit-product-price').modal('hide');
            showAlert('success', 'Éxito', 'Precio actualizado correctamente.');

            // ✅ Notificar al módulo de detalle para recargar tabla y totales
            $(document).trigger('sale:productSaved', [response]);

            selectedRowDetail = null;
        },

        error: () => {
            showAlert('error', 'Error', 'No se pudo actualizar el precio.');
        }
    });
}

/**
 * Función para enviar el nuevo descuento del producto al servidor y actualizar el detalle de venta.
 *
 * @param {number} newDiscount - Nuevo descuento ingresado por el usuario
 */
function setNewDiscount(newDiscount) {
    if (!selectedRowDetail) return;
    $.ajax({
        url: DETAIL_CONFIG.api.editProductDiscount,
        method: 'POST',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'),
            id_temp_sale_detail: selectedRowDetail.id_temp_sale_detail,
            temp_sale_id: selectedRowDetail.temp_sale_id,
            new_discount: newDiscount
        },
        success: function (response) {
            if (response.success) {
                tableDetails.ajax.reload(null, false);
                showTotals(response.totals ?? response);
                cleanEditModal();
                $('#modal-edit-product-discount').modal('hide');
                $('#auto_complete_product').val('').trigger('focus');
                selectedRowDetail = null;
            } else {
                showAlert('error', 'Error', response.message);
            }
        }
    });
}

// =========================================
// TOTALES
// =========================================

/**
 * Consulta los totales actuales de la venta al servidor y los muestra.
 *
 * @param {number} tempSaleId - ID de la venta temporal
 */
export function loadTotals(tempSaleId) {
    $.ajax({
        url: `${DETAIL_CONFIG.api.totals}/${tempSaleId}`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            showTotals(response);
        }
    });
}

/**
 * Aplica un descuento general a la venta y actualiza los totales.
 *
 * @param {number|string} discountApplied - Valor del descuento
 */
export function applyDiscount(discountApplied) {
    const tempId = $(DETAIL_CONFIG.selectors.tempSaleId).val();

    $.ajax({
        url: DETAIL_CONFIG.api.discount,
        method: 'POST',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'),
            temp_sale_id: tempId,
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
    $('#general-discount-number').val((totals.discount || 0.00).toFixed(2));
}

// =========================================
// FUNCIONES AUXILIARES
// =========================================

/**
 * Limpia los campos del modal de edición para evitar que queden datos residuales al abrirlo para otro producto.
 * Se llama cada vez que se cierra un modal de edición (nombre, cantidad, descuento).
 */
function cleanEditModal() {
    $('#edit-product-name').val('');
}

/**
 * Asocia los eventos de cálculo de descuento en el modal de edición de descuento del producto.
 */
function bindCalculationEvents() {
    // Porcentaje de descuento → calcular monto
    $(document).on('input', DETAIL_CONFIG.selectors.discountPercentage, function () {
        const pct = parseFloat($(this).val()) || 0;
        const price = selectedRowDetail ? parseFloat(selectedRowDetail.price) : 0;
        $(DETAIL_CONFIG.selectors.discountNumber).val((price * (pct / 100)).toFixed(2));
    });

    // Monto de descuento → calcular porcentaje
    $(document).on('input', DETAIL_CONFIG.selectors.discountNumber, function () {
        const amt = parseFloat($(this).val()) || 0;
        const price = selectedRowDetail ? parseFloat(selectedRowDetail.price) : 0;
        const pct = price > 0 ? ((amt / price) * 100).toFixed(2) : '0.00';
        $(DETAIL_CONFIG.selectors.discountPercentage).val(pct);
    });
}
// =========================================
// CANCELAR COMPRA
// =========================================

/**
 * Cancela la venta temporal eliminando todos sus registros.
 */
function cancelTempSale() {
    const tempActualId = $(DETAIL_CONFIG.selectors.tempSaleId).val();

    $.ajax({
        url: `${DETAIL_CONFIG.api.cancel}/${tempActualId}`,
        method: 'GET',
        dataType: 'json',
        success: function () {
            cleanInputSale();
            applyDiscount(0);
            location.reload();
        }
    });
}

/**
 * Limpia todos los campos de la venta en curso.
 * Se exporta para que otros módulos (paymentModule, waitingModule) puedan usarla.
 */
export function cleanInputSale() {
    // Cliente
    cleanCustomerData();
    $('#general-discount-number').val(0.00);

    // Inputs de búsqueda
    $('#auto_complete_customer').val('');
    $('#auto_complete_product').val('');

    // Selects del documento
    $('#document-type').val(1).trigger('change');
    $('#voucher-type').val(1).trigger('change');
    $('#invoice_number').val('');

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

// -----------------------------------------------------------------
// CAMBIO DE SERIE Y FOLIO → Actualiza los campos de serie y folio al cambiar el comprobante
// -----------------------------------------------------------------
function syncReceiptFields() {
    const selected = $('#voucher-type option:selected');

    $('#series-prefix').val(selected.data('prefix') || '');
    $('#current-number').val(selected.data('number') || '');
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
    $(document).on('sale:productSaved', function (e, totals) {

        // 1. Actualizar los totales en el DOM
        if (totals) {
            showTotals(totals);
        }

        // 2. Recargar la tabla temporal sin resetear la paginación
        if (tableDetails) {
            tableDetails.ajax.reload(null, false);
        }

        // 3. Limpiar el campo de búsqueda de productos y poner foco para agilizar la venta
        $('#auto_complete_product').val('').trigger('focus');

        // 4. Limpiar la fila seleccionada para evitar errores al editar
        selectedRowDetail = null;
        
        // 5. VALIDAR si el producto es de venta por KG
        if (totals?.data_product?.unit_name === 'KG') {
            selectedRowDetail = {
                id_temp_sale_detail: totals.data_product.id_temp_sale_detail,
                temp_sale_id: totals.temp_sale_id,
                product_name: totals.data_product.product_name,
                quantity: totals.data_product.quantity ?? 1
            };
            openEditQuantityModal(selectedRowDetail);
        }
    });
}