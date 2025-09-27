import { showAlert, clearValidationErrors, handleValidationError, showConfirmationAlert } from './utils/alerts';
import { calculateUnitPrice, calculateMarginFromSalePrice } from './functionAjaxProducts';
import { makeNumericInput } from './utils/numericInputs';
import { initCreditTermsAndDate, closeSupplierModal, bindSupplierFormSubmit, formatCleave } from './helpers/supplierHelper';
import { method } from 'lodash';

// =========================================
// CONFIGURACIÓN CENTRALIZADA
// =========================================
const CONFIG = {
    // URLs de endpoints
    endpoints: {
        tempPurchaseDetails: '/temp_purchases_detail',
        suppliers: 'temp_purchases_detail/autoCompleteSuppliers',
        products: 'temp_purchases_detail/autoCompleteProducts',
        totals: '/temp_purchases_detail/totals',
        updateDiscount: '/temp_purchases_detail/updateDiscount',
        setToWaiting: '/temp_purchases_detail/set-to-waiting'
    },
    
    // Configuraciones numéricas
    numbers: {
        decimals: 2,
        minQuantity: 1,
        maxDiscountPercent: 100,
        defaultTax: 16, // IVA por defecto
        scrollHeight: 500
    },
    
    // Clases CSS
    cssClasses: {
        selected: 'selected table-light',
        noResult: 'no_result'
    },
    
    // Mensajes
    messages: {
        noSupplier: 'Seleccione un proveedor para continuar.',
        noProducts: 'Agregue productos a la compra para continuar.',
        productExists: 'El producto ya fue agregado a la lista.',
        selectRow: 'Seleccione una fila para continuar',
        quantityRequired: 'La cantidad del producto debe ser mayor a 0'
    },
    
    // LocalStorage keys
    storage: {
        supplierKey: 'proveedorSeleccionado'
    },
    
    // Configuración de modales
    modals: {
        products: '#modal-products',
        suppliers: '#modal-suppliers',
        productDetails: '#modal-product-details',
        payment: '#modal-payment-detail',
        purchaseWaiting: '#modal-purchase-waiting'
    }
};

// =========================================
// FUNCIONES HELPER PARA MODALES
// =========================================

/**
 * Maneja la apertura de modales con carga de datos
 * @param {string} modalId - ID del modal
 * @param {Function} loadFunction - Función para cargar datos
 */
function openModalWithData(modalId, loadFunction = null) {
    $(modalId).modal('show');
    if (loadFunction && typeof loadFunction === 'function') {
        loadFunction();
    }
}

/**
 * Cierra un modal específico
 * @param {string} modalId - ID del modal a cerrar
 */
function closeModal(modalId) {
    $(modalId).modal('hide');
}

// =========================================
// FUNCIONES HELPER PARA AJAX
// =========================================

/**
 * Wrapper para llamadas AJAX estandarizadas
 * @param {Object} options - Configuración de la llamada AJAX
 * @param {string} options.url - URL del endpoint
 * @param {string} options.method - Método HTTP
 * @param {Object} options.data - Datos a enviar
 * @param {Function} options.onSuccess - Callback de éxito
 * @param {Function} options.onError - Callback de error
 */
function makeAjaxRequest({ url, method = 'GET', data = {}, onSuccess, onError }) {
    // Agregar token CSRF automáticamente para métodos que lo requieren
    if (['POST', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
        data._token = $('meta[name="csrf-token"]').attr('content');
    }

    $.ajax({
        url,
        method,
        data,
        dataType: 'json',
        success: function(response) {
            if (onSuccess && typeof onSuccess === 'function') {
                onSuccess(response);
            }
        },
        error: function(xhr) {
            if (onError && typeof onError === 'function') {
                onError(xhr);
            } else {
                // Manejo de error por defecto
                handleAjaxError(xhr);
            }
        }
    });
}

/**
 * Manejo centralizado de errores AJAX
 * @param {Object} xhr - Objeto XMLHttpRequest
 */
function handleAjaxError(xhr) {
    if (xhr.status === 422) {
        // Error de validación
        handleValidationError(xhr);
    } else {
        // Otros errores
        showAlert('error', 'Error', 'Ocurrió un error inesperado. Intente nuevamente.');
    }
}

// =========================================
// MÓDULO DE CÁLCULOS
// =========================================

const CalculationHelper = {
    /**
     * Calcula el descuento en valor monetario basado en porcentaje
     * @param {number} percentage - Porcentaje de descuento
     * @param {number} baseAmount - Monto base
     * @returns {string} Valor del descuento formateado
     */
    calculateDiscountAmount(percentage, baseAmount) {
        if (!percentage || !baseAmount) return '0.00';
        return (baseAmount * (percentage / 100)).toFixed(CONFIG.numbers.decimals);
    },

    /**
     * Calcula el porcentaje de descuento basado en el monto
     * @param {number} discountAmount - Monto del descuento
     * @param {number} baseAmount - Monto base
     * @returns {string} Porcentaje formateado
     */
    calculateDiscountPercentage(discountAmount, baseAmount) {
        if (!discountAmount || !baseAmount) return '0.00';
        return ((discountAmount / baseAmount) * 100).toFixed(CONFIG.numbers.decimals);
    },

    /**
     * Formatea un valor monetario
     * @param {number} amount - Monto a formatear
     * @returns {string} Monto formateado
     */
    formatCurrency(amount) {
        return parseFloat(amount || 0).toFixed(CONFIG.numbers.decimals);
    },

    /**
     * Valida que la cantidad sea mayor a cero
     * @param {number} quantity - Cantidad a validar
     * @returns {boolean} True si es válida
     */
    isValidQuantity(quantity) {
        return quantity && quantity > 0;
    }
};

/**
 * Maneja la selección de una fila en tablas de modales
 * @param {string} tableId - ID de la tabla
 * @param {Function} onDoubleClick - Función a ejecutar en doble click
 */
function bindTableRowSelection(tableId, onDoubleClick) {
    $(`${tableId} tbody`).on('dblclick', 'tr', function () {
        const table = $(tableId).DataTable();
        const data = table.row(this).data();
        onDoubleClick(data);
    });
}

// =========================================
// VARIABLES GLOBALES
// =========================================

let tableDetails = null;
let selectedRowDetail = null;
let productsTable = null;
let purchasesTable = null;
let suppliersTable = null;

$(document).ready(function () {
    const input_date = $('#purchase-date');

    // =============================================================================
    // Obtener la fecha actual y mostrarlo en el input date
    // =============================================================================
    flatpickr(input_date, {
        dateFormat: "d M, Y",
        altFormat: "d M, Y",
        defaultDate: new Date()
    });

    // =============================================================================
    // Funciones que se inicializan al recargar la página para realizar operaciones especificas
    // =============================================================================
    const temp_purchase_id = $('#temp_purchase_id').val();
    initSupplier();
    initTableDetails();
    loadTotals(temp_purchase_id);
    addProductToTempList();
    bindDeleteEvents();
    validatePaymentMethod();

    // =============================================================================
    // Funciones para el form para agregar proveedor
    // =============================================================================
    bindSupplierFormSubmit({
        table: suppliersTable,
        onSuccess: (response) => {
            getSupplierData(response.supplier.id);
            $('#modal-suppliers').modal('hide');
        }
    })
    closeSupplierModal();
    formatCleave();
    initCreditTermsAndDate("#credit_terms", "#credit_due_date", 30);
    // =============================================================================
    // Validando input numéricos
    // =============================================================================
    makeNumericInput('.price-sale', { type: 'decimal', min: 0, decimals: 2 });
    makeNumericInput('#folio', { type: 'integer', min: 1 });
    makeNumericInput('#general-discount-number', { type: 'decimal', min: 1 });
    makeNumericInput('#quantity', { type: 'integer', min: 1 });
    makeNumericInput('#cost', { type: 'decimal', min: 1, decimals: 2 });
    makeNumericInput('#discount-number', { type: 'decimal', min: 1, decimals: 2 });
    makeNumericInput('#new_price_sale_1', { type: 'decimal', min: 1, decimals: 2 });
    makeNumericInput('#new_price_sale_2', { type: 'decimal', min: 1, decimals: 2 });
    makeNumericInput('#new_price_sale_3', { type: 'decimal', min: 1, decimals: 2 });
    makeNumericInput('#discount-percentage', { type: 'integer', min: 0, max: 100 });
    makeNumericInput('#payment-card', { type: 'decimal', min: 1, decimals: 2 });
    makeNumericInput('#payment-cash', { type: 'decimal', min: 1, decimals: 2 });
    makeNumericInput('#payment-transfer', { type: 'decimal', min: 1, decimals: 2 });
    makeNumericInput('#payment-voucher', { type: 'decimla', min: 1, decimals: 2 });
    // =============================================================================
    // EVENTO: inicializa el autocompletado para proveedores
    // =============================================================================
    autoCompleteSuppliers();

    // =============================================================================
    // EVENTO: inicializa el autocompletado para productos
    // =============================================================================
    autoCompleteProducts();

    // =============================================================================
    // EVENTO: Para obtener el valor de input y mandarlo a la funcion cada que se realice un cambio
    // =============================================================================
    $('#supplier_id').on('change', function () {
        const supplierId = $(this).val();
        if (supplierId) {
            //Si hay un id seleccionado, llama a la función para obtener los datos del proveedor
            getSupplierData(supplierId);
        }
    });

    // =============================================================================
    // EVENTO: Para obtener el valor de input y mandarlo a la funcion cada que se realice un cambio
    // =============================================================================
    $('#product_id').on('change', function () {
        const productId = $(this).val();
        if (productId) {
            //Si hay un id seleccionado, llama a la función para obtener los datos del proveedor
            //addProductToTempList(productId);

            $('#modal-product-details').modal('show');

            getDataProduct(productId);
        }
    });

    // =============================================================================
    // EVENTO: Para calcular el margen de los input dentro del detalle del producto que se va agregar
    // =============================================================================
    $('.price-sale').on('input', function () {
        const index = $(this).data('index');
        const salePrice = parseFloat($(this).val());
        const unitPrice = parseFloat($('#new-price-unit').val());
        const targetMargin = $(`.margin-${index}`);

        const margin = calculateMarginFromSalePrice(unitPrice, salePrice);
        targetMargin.text(margin);
    });

    // ============================================================================
    // EVENTO: Cálculo automático del descuento en cantidad monetaria
    // Al escribir un porcentaje en el input #discount-percentage, se toma el
    // valor actual del precio de costo (#cost), se calcula el descuento en pesos
    // y se muestra automáticamente en el input #discount-number.
    // ============================================================================
    $('#discount-percentage').on('input', function () {
        const discount = $(this).val();
        const costPrice = parseFloat($('#cost').val());
        const result = calculateDiscountPercentage(discount, costPrice);
        $('#discount-number').val(result);
    });

    // ============================================================================
    // EVENTO: Cálculo automático del descuento en cantidad porcentual
    // Al escribir un numero entero en el input #discount-number, se toma el
    // valor actual del precio de costo (#cost), se calcula el descuento en porcentaje
    // y se muestra automáticamente en el input #discount-percentage.
    // ============================================================================
    $('#discount-number').on('input', function () {
        const discount = $(this).val();
        const costPrice = parseFloat($('#cost').val());
        const result = calculateDiscountNumber(discount, costPrice);
        $('#discount-percentage').val(result);
    });

    // ============================================================================
    // EVENTO: Recálculo automático los valores de los input de
    // price-sale, margen, discount-number, cuando se realicen cambios en los input 
    // de cost y new-factor
    // ============================================================================
    $('#cost, #new-factor').on('input', function () {
        const costPrice = parseFloat($('#cost').val());
        const factor = parseFloat($('#new-factor').val());

        // Para cada precio de venta existente (puede haber más de uno)
        $('.price-sale').each(function () {
            const index = $(this).data('index');
            const salePrice = parseFloat($(this).val());
            const targetMargin = $(`.margin-${index}`);

            const unitPrice = calculateUnitPrice(costPrice, factor);
            $('#new-price-unit').val(unitPrice);
            const margin = calculateMarginFromSalePrice(unitPrice, salePrice);
            targetMargin.text(margin);
        });
        const discount = $('#discount-percentage').val();
        const result = calculateDiscountPercentage(discount, costPrice);
        $('#discount-number').val(result);
    });

    // ============================================================================
    // EVENTO: Para cancelar el ingreso de los datos cargados en el modal de detelle
    // del producto a la tabla de temporal de compra, limpiando los campos y
    // y escondiendo el modal.
    // ============================================================================
    $('#btn-cancelar-product-details').on('click', function () {
        clearProductDetailModal();
        $('#modal-product-details').modal('hide');
    });

    // ============================================================================
    // EVENTO: Obtiene los datos de la tabla de detalles temporales de los productos al hacerle doble click 
    // y manda el id_temp del registro, a al funcion para obtener los datos y actualizar
    // ============================================================================
    $('#tableTempPurchase tbody').on('dblclick', 'tr', function () {
        const data = tableDetails.row(this).data();
        getDataProductDetail(data.id_temp, true);
    })

    // ============================================================================
    // EVENTO: Para agregarle una clase css de boostrap que remarque la fila
    // seleccionado y aparte obtiene el los datos de la fila selecionado para utilizarlos
    // en otras funciones
    // ============================================================================
    $('#tableTempPurchase tbody').on('click', 'tr', function () {
        // Quita la selección previa
        $('#tableTempPurchase tbody tr.selected').removeClass('selected table-light');
        // Marca la fila actual como seleccionada
        $(this).addClass('selected table-light');
        // Guarda el id de la fila seleccionada
        const data = tableDetails.row(this).data();
        selectedRowDetail = data ? data.id_temp : null;
    });

    // ============================================================================
    // EVENTO: Para editar los registros listados en la tabla temporal,
    // Validando que haya una fila seleccionado previamente, en caso de que no este
    // seleccionad muestra un mensaje de advertencia.
    // ============================================================================
    $('#btn-edit-product').on('click', function () {
        if (selectedRowDetail) {
            getDataProductDetail(selectedRowDetail, true);
        } else {
            showAlert('warning', 'Espera', 'Seleccione una fila para continuar');
        }
    })

    // ============================================================================
    // EVENTO: Muestra el modal donde se listan los productos en la base de datos
    // ============================================================================
    $('#btn-search-product').on('click', function () {
        openModalWithData(CONFIG.modals.products, loadListProducts);
    })

    // ============================================================================
    // EVENTO: Muestra el modal donde se listan los proveedores en la base de datos
    // ============================================================================
    $('#btn-search-suppliers').on('click', function () {
        openModalWithData(CONFIG.modals.suppliers, loadListSuppliers);
    })

    // ============================================================================
    // EVENTO: Obtiene los datos de la tabla de productos listados y el id se
    // envia el id al input #product_id y esconde el modal. 
    // ============================================================================
    $('#tableProducts tbody').on('dblclick', 'tr', function () {
        const data = productsTable.row(this).data();
        $("#product_id").val(data.id).trigger('change');
        $('#modal-products').modal('hide');
    })

    // ============================================================================
    // EVENTO: Obtiene los datos de la tabla de proveedores listados y el id se
    // envia a la funcion para obtener los datos del proveedor y esconde el modal.
    // ============================================================================
    $('#tableSuppliers tbody').on('dblclick', 'tr', function () {
        const data = suppliersTable.row(this).data();
        getSupplierData(data.id);
        $('#modal-suppliers').modal('hide');
    })

    // ============================================================================
    // EVENTOS: Cierre de modales
    // ============================================================================
    $('#btn-close-product').on('click', () => closeModal(CONFIG.modals.products));
    $('#btn-close-supplier').on('click', () => closeModal(CONFIG.modals.suppliers));
    $('#btn-close-pending').on('click', () => closeModal(CONFIG.modals.purchaseWaiting));

    // ============================================================================
    // EVENTO: Cierra el modal de listado de los productos registrados en la base
    // de datos.
    // ============================================================================
    $('#btn-set-waiting').on('click', function () {
        sendPurchaseToWait();
    });

    // ============================================================================
    // EVENTO: Cierra el modal de listado de los productos registrados en la base
    // de datos.
    // ============================================================================
    $('#btn-purchase-waiting').on('click', function () {
        $('#modal-purchase-waiting').modal('show');
        listPendingPurchases();
    });

    // ============================================================================
    // EVENTO: Obtiene los datos de la tabla de productos listados y el id se
    // envia el id al input #product_id y esconde el modal. 
    // ============================================================================
    $('#tablePurchaseWaiting tbody').on('dblclick', 'tr', function () {
        const data = purchasesTable.row(this).data();
        //Recuperar la venta o cambiar el estado de la venta seleccionada a abierta y si hay uno en proceso enviarlo en espera
        getPurchaseOnHold(data.id_temp_purchase);
    })

    // ============================================================================
    // EVENTO: Obtiene el valor del input para mandarlo al controlador y actualizar el 
    // descuento general de la compra
    // ============================================================================
    $('#general-discount-number').on('blur', function () {
        const discount = $(this).val();
        applyDiscount(discount);
    })

    // ============================================================================
    // EVENTO: Para cancelar la compra, validando que haya productos en el listado
    // ============================================================================
    $('#btn-cancel-purchase').on('click', function () {
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
        )
    });

    // ============================================================================
    // EVENTO: Para aplicar el autoseleccionado a los inputs
    // ============================================================================
    $('.auto-select').on('focus', function () {
        let $this = $(this);
        $this.trigger('select');

        $this.on('mouseip.selectText', function (e) {
            e.preventDefault();
            $this.off('mouseup.selectText');
        });
    })

    // ============================================================================
    // EVENTO: Mostrar el modal para procesar el pago de la compra
    // ============================================================================
    $('#btn-process-purchase').on('click', function (e) {
        e.preventDefault();
        const supplierId = $('#supplier_id').val();
        //Validacion si hay un proveedor seleccionado
        if (!supplierId || supplierId == 0) {
            showAlert(
                'warning',
                'Alerta',
                'Seleccione un proveedor para continuar.',
            );
            return;
        }
        //Validacion si hay productos en la lista
        if (tableDetails.rows().count() === 0) {
            showAlert(
                'warning',
                'Alerta',
                'Agregue productos a la compra para continuar.',
            );
        } else {
            $('#modal-payment-detail').modal('show');
            //Mostrando los datos en el modal de pago
            let total_final = parseFloat($('.total').text().replace(/[$,]/g, ''));
            let limit_credit = $('.credit-limit-supplier').val();
            let credit_days = $('.credit-terms').val();
            let credit_available_supplier = parseFloat($('.credit_supplier').text().replace(/[$,]/g, ''));
            $('#payment-cash').val(total_final.toFixed(2));
            $('#current-credit').val(total_final.toFixed(2));
            $('#credit-limit').val(limit_credit);
            $('.credit_available').val(credit_available_supplier.toFixed(2));
            $('#credit-days').prop('disabled', true);
            $('#due-date').prop('disabled', true);
            $('#current-credit').prop('disabled', true);
            initCreditTermsAndDate('#credit-days', '#due-date', credit_days);
        }

    });

    // ============================================================================
    // EVENTO: Mostrar el modal para agregar un nuevo proveedor
    // ============================================================================
    $('#btn-add-supplier').on('click', function (e) {
        e.preventDefault();
        $('#supplierModal').modal('show');
    });

    $('.payment_method').on('input', function () {
        let total_amount = sumPaymentMethods();
        let total_final_reset = parseFloat($('.total').text().replace(/[$,]/g, '')).toFixed(2);
        let change = (total_amount - total_final_reset).toFixed(2);
        $('.payment-change').html(change);
    });

    $('#modal-payment-detail').on('hidden.bs.modal', function () {
        $('#payment-card').val(0.00);
        $('#payment-transfer').val(0.00);
        $('#payment-voucher').val(0.00);
    });

    $('#modal-product-details').on('shown.bs.modal', function () {
        $('#quantity').trigger('focus').trigger('select');
    });

    $('#btn-finalize-purchase').on('click', function () {
        // Obtén el método de pago seleccionado
        const selectedMethod = $('input[name="payment_method"]:checked').attr('id') || PAYMENT_CONFIG.methods.BOX;
        processPurchasesByMethod(selectedMethod);
    });

    $('#btn-close-modal-payment').on('click', function () {
        $('#modal-payment-detail').modal('hide');
    });
});
/**
 * ------------------------------------------ FIN READY -------------------------------------------------
 */

// =========================================
// CONFIGURACIÓN DE COLUMNAS DE DATATABLE
// =========================================
const getTableColumns = () => [
    { data: 'id_temp', name: 'id_temp', visible: false },
    { data: 'temp_purchase_id', name: 'temp_purchase_id', visible: false },
    { data: 'product_id', name: 'product_id', visible: false },
    {
        data: null,
        name: 'description',
        render: (data, type, row) => renderProductDescription(row)
    },
    {
        data: null,
        name: 'quantity',
        className: 'text-center fs-6',
        render: (data, type, row) => renderCenteredValue(row.quantity)
    },
    {
        data: null,
        name: 'factor',
        className: 'text-center',
        render: (data, type, row) => renderCenteredValue(row.factor)
    },
    {
        data: null,
        name: 'purchase_price',
        render: (data, type, row) => renderPriceWithUnit(row.purchase_price, row.unit_name)
    },
    {
        data: null,
        name: 'discount',
        className: 'text-center fs-6',
        render: (data, type, row) => renderCurrency(row.discount)
    },
    {
        data: null,
        name: 'total',
        className: 'text-center fs-6',
        render: (data, type, row) => renderCurrency(row.total)
    },
    { data: 'unit_id', name: 'unit_id', visible: false },
    {
        data: 'id_temp',
        name: 'actions',
        orderable: false,
        searchable: false,
        render: renderActionsColumn
    }
];

/**
 * Inicializa el datatable de la tabla temporal de compra.
 */
function initTableDetails() {
    const tableConfig = {
        processing: true,
        serverSide: true,
        ajax: `${CONFIG.endpoints.tempPurchaseDetails}/data`,
        columns: getTableColumns(),
        scrollY: CONFIG.numbers.scrollHeight,
        deferRender: true,
        scroller: true,
        language: idiomaEspanol,
        searching: false,
        ordering: false,
        paging: false,
        info: false,
        lengthChange: false,
        pageLength: -1
    };

    tableDetails = $('#tableTempPurchase').DataTable(tableConfig);
}

// =========================================
// FUNCIONES DE RENDERIZADO DE CELDAS
// =========================================

/**
 * Renderiza la descripción del producto con nombre y código de barras
 */
function renderProductDescription(row) {
    return `
        <div class="d-flex">
            <div class="flex-grow-1 ms-3">
                <h5 class="fs-14 text-body m-1">${row.product_name}</h5>
                <p class="text-muted mb-0">Codigo: <span class="fw-medium">${row.barcode}</span></p>
            </div>
        </div>
    `;
}

/**
 * Renderiza un valor centrado
 */
function renderCenteredValue(value) {
    return `<h5 class="text-body fs-14">${value}</h5>`;
}

/**
 * Renderiza precio con unidad
 */
function renderPriceWithUnit(price, unit) {
    return `
        <div class="d-flex justify-content-center">
            <h5 class="text-body fs-14 me-1">$${price}</h5>
            <span class="text-muted fs-12 fw-semibold">X ${unit}</span>
        </div>
    `;
}

/**
 * Renderiza valor monetario
 */
function renderCurrency(amount) {
    return `<h5 class="text-body fs-14">$${amount}</h5>`;
}

/**
 * Renderiza los botones de acciones (editar, eliminar).
 */
function renderActionsColumn(data) {
    return `
        <div class="hstack gap-3 fs-15">
            <a href="javascript:void(0);" class="link-danger btn-delete-detail" data-id="${data}">
                <i class="ri-delete-bin-5-line"></i>
            </a>
        </div>
    `;
}

// =========================================
// FUNCIÓN: Vincula evento de eliminación
// =========================================

/**
 * Asocia el evento de eliminación de los productos listados para la compra.
 */
function bindDeleteEvents() {
    $('#tableTempPurchase tbody').on('click', '.btn-delete-detail', function () {
        const detailId = $(this).data('id');

        $.ajax({
            url: `/temp_purchases_detail/${detailId}`,
            type: 'DELETE',
            data: {
                _token: $('meta[name="csrf-token"]').attr('content')
            },
            success: function (response) {
                tableDetails.ajax.reload(null, false);
                showTotals(response);
            },
            error: function () {
                showAlert(
                    'error',
                    'Error',
                    'No se pudo eliminar el registro.'
                );
            }
        });

    });
}
// =========================================
// FUNCIÓN GENÉRICA: Autocompletado reutilizable
// =========================================

/**
 * Crea un autocompletado genérico para diferentes tipos de datos
 * @param {Object} options - Configuración del autocompletado
 * @param {string} options.selector - Selector del input
 * @param {string} options.dataSource - URL o función para obtener datos
 * @param {string} options.targetInput - Input donde colocar el ID seleccionado
 * @param {string} options.entityType - Tipo de entidad (supplier, product)
 */
function createAutoComplete({ selector, dataSource, targetInput, entityType }) {
    return new autoComplete({
        selector,
        data: {
            src: async (query) => {
                try {
                    const response = await dataSource(query);
                    return response.data;
                } catch (error) {
                    console.error(`Error en autocompletado de ${entityType}:`, error);
                    return [];
                }
            },
            keys: ['value'],
            cache: false
        },
        
        resultsList: {
            element: (list, data) => {
                if (!data.results.length) {
                    const message = document.createElement("div");
                    message.setAttribute("class", CONFIG.cssClasses.noResult);
                    message.innerHTML = `<span>No se encontraron resultados para "${data.query}"</span>`;
                    list.prepend(message);
                }
            },
            noResults: true
        },
        
        resultItem: {
            highlight: true
        },
        
        events: {
            input: {
                selection: function (event) {
                    const selection = event.detail.selection;
                    const selectedText = typeof selection.value === 'string'
                        ? selection.value
                        : (selection.value?.value || '');

                    this.input.value = selectedText;
                    this.input.select();
                    $(targetInput).val(selection.value.id).trigger('change');
                }
            }
        }
    });
}

/**
 * Inicializa el autocompletado de proveedores
 */
function autoCompleteSuppliers() {
    createAutoComplete({
        selector: "#auto_complete_supplier",
        dataSource: autoCompleteSupplier,
        targetInput: "#supplier_id",
        entityType: "supplier"
    });
}

// =========================================
// FUNCIÓN: Consultar a los proveedores registrados
// =========================================

/**
 * Envia la cadena introducida en el campo de búsqueda de proveedores
 * 
 * @param {string} query - Cadena de búsqueda introducida por el usuario
 */
function autoCompleteSupplier(query) {
    return $.ajax({
        url: `${CONFIG.endpoints.suppliers}/${query}`,
        type: 'GET',
        dataType: 'json'
    });
}

// =========================================
// FUNCIÓN: Consultar los datos de un proveedor específico
// =========================================

/**
 * Envia el ID del proveedor seleccionado para obtener sus datos
 * 
 * @param {number} supplierId - id del proveedor seleccionado
 */
function getSupplierData(supplierId) {
    $.ajax({
        url: `/temp_purchases_detail/${supplierId}/show`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            // Verifica si la respuesta contiene el numero de teléfono
            const rowPhone = response.phone || '';
            //Si es asi, formatea el número de teléfono para mostarlo en el formato (XXX)-XXX-XXXX
            const phoneFormat = rowPhone.length === 10
                ? `(${rowPhone.substring(0, 3)})` + '-' + rowPhone.substring(3, 6) + '-' + rowPhone.substring(6)
                : rowPhone;
            // LLena los campos con los datos del proveedor validando si existe en registro
            $('.name_supplier').text(response.representative || 'No hay dato');
            $('.company_name').text(response.company_name || 'No hay dato');
            $('.email_supplier').text(response.email || 'No hay dato');
            $('.phone_supplier').text(phoneFormat || 'No hay dato');
            $('.rfc_supplier').text(response.rfc || 'No hay dato');
            $('.credit_supplier').text(response.credit_available || 'No hay dato');
            $('.credit-limit-supplier').val(response.credit_limit || 0);
            $('.credit-terms').val(response.credit_days || 0);
            $('.credit-due-date').val(response.credit_due_date || 0);
            $('#supplier_id').val(supplierId || 0);
            // Guardar datos en localStorage para permanencia al recargar la pagina
            const supplier = {
                supplierId: supplierId,
                representative: response.representative,
                company_name: response.company_name,
                email: response.email,
                phone: phoneFormat,
                rfc: response.rfc,
                credit_available: response.credit_available,
                credit_limit: response.credit_limit,
                credit_days: response.credit_days,
                credit_due_date: response.credit_due_date,
            };
            localStorage.setItem("proveedorSeleccionado", JSON.stringify(supplier));

        }
    });
}

// =========================================
// FUNCIÓN: Recuparar los datos almacenados en el localStrorage y mostrarlo en la interfaz
// =========================================
function initSupplier() {
    const proveedorGuardado = localStorage.getItem("proveedorSeleccionado");
    if (proveedorGuardado) {
        const data = JSON.parse(proveedorGuardado);

        // Mostrar los data en pantalla desde localStorage
        $('.name_supplier').text(data.representative || 'No hay dato');
        $('.company_name').text(data.company_name || 'No hay dato');
        $('.email_supplier').text(data.email || 'No hay dato');
        $('.phone_supplier').text(data.phone || 'No hay dato');
        $('.rfc_supplier').text(data.rfc || 'No hay dato');
        $('.credit_supplier').text(data.credit_available || 'No hay dato');
        $('.credit-limit-supplier').val(data.credit_limit || 0);
        $('.credit-terms').val(data.credit_days || 0);
        $('.credit-due-date').val(data.credit_due_date || 0);
        $('#supplier_id').val(data.supplierId || 0);
    }
}

/**
 * Inicializa el autocompletado de productos
 */
function autoCompleteProducts() {
    createAutoComplete({
        selector: "#auto_complete_product",
        dataSource: autoCompleteProduct,
        targetInput: "#product_id",
        entityType: "product"
    });
}

// =========================================
// FUNCIÓN: Consultar los productos registrados
// =========================================

/**
 * Envia la cadena introducida en el campo de búsqueda de productos
 * 
 * @param {string} query - Cadena de búsqueda introducida por el usuario
 */
function autoCompleteProduct(query) {
    return $.ajax({
        url: `${CONFIG.endpoints.products}/${query}`,
        type: 'GET',
        dataType: 'json'
    });
}

// =========================================
// FUNCIÓN: Consultar los datos de un producto específico
// =========================================
/**
 * Envia el ID del producto seleccionado para obtener sus datos y mostrarlos en el modal de detalle
 * 
 * @param {number} productId - id del producto seleccionado
 * @param {boolean} isEdit - falso si no existe el registro en la tabla temporal de compra
 */
function getDataProduct(productId, isEdit = false) {
    makeAjaxRequest({
        url: `${CONFIG.endpoints.tempPurchaseDetails}/getDataProduct/${productId}`,
        method: 'GET',
        onSuccess: function (response) {
            if (response.product_exists) {
                showAlert('warning', 'Espera', CONFIG.messages.productExists);
                closeModal(CONFIG.modals.productDetails);
                return;
            }
            showProductDetailModal(response.detail, isEdit);
        }
    });
}

// =========================================
// FUNCIÓN: Consultar los datos de un producto específico desde el detalle temporal para la compra
// =========================================
/**
 * Envia el ID del producto seleccionado en la lista de compra para cosultar los datos
 * 
 * @param {number} productId - id del producto seleccionado
 * @param {boolean} isEdit - verdadero si existe el registro en la tabla temporal de compra
 */
function getDataProductDetail(detailId, isEdit = true) {
    $.ajax({
        url: `/temp_purchases_detail/getDataProductTemp/${detailId}`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            const data = response.detail;
            // Asegurarnos de que id_temp esté presente
            if (!data.id_temp && isEdit) {
                data.id_temp = detailId;
            }
            showProductDetailModal(data, isEdit);
        },
        error: function(xhr) {
            console.error('Error al obtener datos:', xhr);
            showAlert('error', 'Error', 'No se pudieron obtener los datos del producto');
        }
    })
}

/**
 * Envia los datos del producto para la compra
 */
function addProductToTempList() {
    $('#productDetails').on('submit', function (e) {
        e.preventDefault();
        $('.factor').prop('disabled', false);
        
        // Obtener el ID del detalle temporal para edición
        const detailId = $('#temp_id').val();
        const isEdit = detailId != 0;
        
        // Validar la cantidad
        const quantity = parseFloat($('#quantity').val());
        if (!quantity || quantity <= 0) {
            showAlert(
                'warning',
                'Validación',
                'La cantidad del producto debe ser mayor a 0'
            );
            $('#quantity').trigger('focus');
            return false;
        }

        const $form = $(this).serialize();
        clearValidationErrors();

        $.ajax({
            url: isEdit ? `/temp_purchases_detail/${detailId}` : '/temp_purchases_detail/add',
            method: isEdit ? 'PUT' : 'POST',
            data: $form,
            success: function (response) {
                showTotals(response);
                tableDetails.ajax.reload(null, false); // Recarga la tabla sin reiniciar la paginación
                $('#modal-product-details').modal('hide');
                $('#temp_id').val(0);
                $('.factor').prop('disabled', false);
            },
            error: function (xhr) {
                handleValidationError(xhr);
            }
        });
    });
}

// =========================================
// FUNCIÓN: Consulta los totales de la venta
// =========================================
/**
 * Envia el id de temp_purchase para recalcular los totales de la compra y mostrarlos en la vista
 * 
 * @param {number} temp_purchase_id - id de la compra
 */
function loadTotals(temp_purchase_id) {
    makeAjaxRequest({
        url: `${CONFIG.endpoints.totals}/${temp_purchase_id}`,
        method: 'GET',
        onSuccess: showTotals
    });
}

// =========================================
// FUNCIÓN: Para obtener y aplicar un descuento general a la compra y
// recalcular los totales.
// =========================================
function applyDiscount(discount_applied) {
    const tempId = $('#temp_purchase_id').val();
    
    makeAjaxRequest({
        url: CONFIG.endpoints.updateDiscount,
        method: 'POST',
        data: {
            temp_id: tempId,
            discount: discount_applied
        },
        onSuccess: showTotals
    });
}

// =========================================
// FUNCIÓN: Para mostrar los totales de la compra en la vista
// =========================================
function showTotals(totals) {
    $('.sub-total').text(`$${totals.sub_total}`);
    $('.total-tax').text(`$${totals.total_siva}`);
    $('.tax').text(`$${totals.tax}`);
    $('.total').text(`$${totals.total}`);
    $('.discount-general').val((totals.discount || 0.00.toFixed(2)));
    $('.total-discount').text(`$${totals.sub_total_discount}`);

}
// =========================================
// FUNCIÓN: Para mandar la compra a espera, validando que haya productos en el listado
// y que este seleccionado algun proveedor para la compra
// =========================================
function sendPurchaseToWait() {
    const tempId = $('#temp_purchase_id').val();
    const supplierId = $('#supplier_id').val();
    if (!supplierId || supplierId == 0) {
        showAlert(
            'warning',
            'Alerta',
            'Seleccione un proveedor para enviar a espera.',
        );
        return;
    }

    $.ajax({
        url: '/temp_purchases_detail/set-to-waiting/',
        type: 'POST',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'),
            temp_id: tempId,
            supplier_id: supplierId,
        },
        success: function (response) {
            showAlert(
                response.status,
                'Alerta',
                response.message,
            );
            cleanInputPurchase();
            tableDetails.ajax.reload();
            $('#temp_purchase_id').val(response.data.new_temp_purchase_id);
            loadTotals(response.data.new_temp_purchase_id);

        },
        error: function (xhr) {
            let response = {};
            response = JSON.parse(xhr.responseText);
            showAlert(
                response.status,
                'Alerta',
                response.message,
            );
        }
    });

}

// =========================================
// FUNCIÓN: Para obtener la compra en espera que se desea retomar
// =========================================
function getPurchaseOnHold(temp_id) {
    const tempActualId = $('#temp_purchase_id').val();
    const supplierId = $('#supplier_id').val();
    const rowCount = tableDetails.rows().count();
    if (rowCount != 0) {
        if (!supplierId || supplierId == 0) {
            showAlert(
                'warning',
                'Alerta',
                'Seleccione un proveedor para enviar a espera.',
            );
            return;
        }
    }

    $.ajax({
        url: '/temp_purchases_detail/getPurchaseOnWaitingList',
        type: 'POST',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'), // Necesario para POST en Laravel
            temp_id: temp_id,
            temp_actual_id: tempActualId,
            supplier_id: supplierId,
        },
        success: function (response) {

            $('#supplier_id').val(response.data.supplier_id).trigger('change');
            $('#temp_purchase_id').val(response.data.temp_purchase_id);
            loadTotals(response.data.temp_purchase_id);
            tableDetails.ajax.reload(null, false);
            $('#modal-purchase-waiting').modal('hide');
            purchasesTable.ajax.reload();
        },
        error: function (xhr) {
            let response = {};
            response = JSON.parse(xhr.responseText);
            showAlert(
                response.status,
                'Alerta',
                response.message,
            );
        }
    });

}
// =========================================
// FUNCIÓN: Abre el modal de detalle de producto
// =========================================
function listPendingPurchases() {
    if ($.fn.DataTable.isDataTable('#tablePurchaseWaiting')) {
        $('#tablePurchaseWaiting').DataTable().destroy();
        $('#tablePurchaseWaiting tbody').empty();
    }

    purchasesTable = $('#tablePurchaseWaiting').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/temp_purchases_detail/getPendingPurchases',
        columns: [
            {
                data: 'id_temp_purchase',
                name: 'id_temp_purchase',
                visible: false,
            },
            {
                data: 'supplier_id',
                name: 'supplier_id',
                visible: false,
            },
            {
                data: 'date_created',
                name: 't.created_at',
                className: 'text-center',
                render: function (data, type, row) {
                    if (data) {
                        let date = new Date(data);
                        let fechaFormato = date.toLocaleDateString('es-ES');
                        let horaFormato = date.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        return `
                            <div class="d-flex">
                                <div class="flex-grow-1">
                                    <h5 class="fs-13 m-1">${fechaFormato}</h5>
                                    <small class="text-muted">${horaFormato}</small>
                                </div>
                            </div>
            `;
                    }
                    return '';
                }
            },
            {
                data: null,
                name: 'description',
                className: 'text-center',
                render: function (data, type, row) {
                    return `
                    <div class="d-flex">
                        <div class="flex-grow-1">
                            <h5 class="fs-13 m-1">
                                ${row.company_name}
                            </h5>
                            <p class="text-muted mb-0">${row.representative}</p>
                        </div>
                    </div>
                    `;
                }
            },
            {
                data: 'total_amount',
                name: 'total_amount',
                className: 'text-center',
                render: function (data, type, row) {
                    return '$' + parseFloat(data || 0).toFixed(2);
                }
            }
        ],
        scrollY: 400,
        deferRender: true,
        scroller: true,
        language: idiomaEspanol,
        searching: false,
        info: false,
        lengthChange: false,
        pageLength: -1,
    });
}
/**
 * Muestra el modal del detalle del producto.
 *
 * @param {Object|null} data - Datos de producto o null si es nuevo.
 */
function showProductDetailModal(data, isEdit) {
    // =============== DATOS SUPERIORES (Información del Artículo) ==================
    $('#temp_id').val(data.id_temp || 0);
    $('#product_id').val(data.product_id || 0);
    $('.product-name').text(data.product_name || '');
    $('.barcode').text(data.barcode || '');
    $('.stock').text(data.stock || 0);

    // Validar factor con fallback seguro
    const conversionFactor = parseFloat(data.conversion_factor || 1);
    $('.factor').text(conversionFactor).val(conversionFactor);

    // Precios originales con validaciones
    const originalPurchasePrice = parseFloat(data.original_purchase_price || data.purchase_price) || 0;
    const originalSalePrice1 = parseFloat(data.original_sale_price_1 || data.sale_price_1) || 0;
    const originalSalePrice2 = parseFloat(data.original_sale_price_2 || data.sale_price_2) || 0;
    const originalSalePrice3 = parseFloat(data.original_sale_price_3 || data.sale_price_3) || 0;

    $('.price-purchase').text(originalPurchasePrice);
    $('.price-sale-1').text(originalSalePrice1);
    $('.price-sale-2').text(originalSalePrice2);
    $('.price-sale-3').text(originalSalePrice3);

    // =============== DATOS INFERIORES (Detalles de Compra) ==================

    // Usar datos temporales si existen, si no, usar los datos originales

    const purchasePrice = data.has_temp_data ?
        (parseFloat(data.purchase_price) || originalPurchasePrice) : originalPurchasePrice;

    const factor = data.has_temp_data ? (parseFloat(data.factor) || conversionFactor) : conversionFactor;

    const unitPrice =
        calculateUnitPrice(purchasePrice, conversionFactor);

    const quantity = data.has_temp_data ? (parseFloat(data.quantity) || 0) : 0;
    const discount = data.has_temp_data ? (parseFloat(data.discount) || 0) : 0;

    // Precios de venta - usar temporal si existen
    const newSalePrice1 = data.has_temp_data ?
        (parseFloat(data.new_sale_price_1) || originalSalePrice1) : originalSalePrice1;
    const newSalePrice2 = data.has_temp_data ?
        (parseFloat(data.new_sale_price_2) || originalSalePrice2) : originalSalePrice2;
    const newSalePrice3 = data.has_temp_data ?
        (parseFloat(data.new_sale_price_3) || originalSalePrice3) : originalSalePrice3;

    // Rellenar los inputs con validaciones
    $('#temp_id').val(data.id_temp || 0);
    $('#cost').val(purchasePrice);
    $('#new-price-unit').val(purchasePrice);
    $('#quantity').val(quantity);
    $('#discount-number').val(discount);

    // Validar antes de asignar valores a los inputs de precios de venta
    if ($('.price-sale-1').length) $('.price-sale-1').val(newSalePrice1);
    if ($('.price-sale-2').length) $('.price-sale-2').val(newSalePrice2);
    if ($('.price-sale-3').length) $('.price-sale-3').val(newSalePrice3);

    // Factor con validación
    if (factor === 1) {
        $('.factor').prop('disabled', true);
    } else {
        $('.factor').prop('disabled', false);
    }
    $('.factor').val(factor);
    $('.price-unit').text(unitPrice);

    // Calcular y mostrar márgenes
    [1, 2, 3].forEach(index => {
        // Seleccionar el precio de venta correcto basado en si es edición o nuevo
        const salePrice = data.has_temp_data ? 
            parseFloat(data[`new_sale_price_${index}`] || 0) : 
            parseFloat(data[`sale_price_${index}`] || 0);

        const unitCost = parseFloat(purchasePrice) / parseFloat(factor);

        let margin = 0;
        if (salePrice > 0 && unitCost > 0) {
            margin = calculateMarginFromSalePrice(unitCost, salePrice);
            // Validar que el margen sea un número válido
            if (isNaN(margin) || !isFinite(margin)) {
                margin = 0;
            }
        }

        const marginElement = $(`.margin-${index}`);
        if (marginElement.length) {
            marginElement.text(margin ? margin + '%' : '0%');
        }
    });

    // Validar unidad
    const unitName = data.unit_name || data.purchase_unit_name || 'UNIDAD';
    $('.unit-purchase').text(`X ${unitName}`);

    // Calcular descuento porcentual
    if (discount > 0 && purchasePrice > 0) {
        const resultDiscount = calculateDiscountNumber(discount, purchasePrice);
        $('#discount-percentage').val(resultDiscount || 0);
    } else {
        $('#discount-percentage').val(0);
    }

    $('#modal-product-details').modal('show');
}

// =========================================
// FUNCIÓN: Cancelar la compra
// =========================================
/**
 * Envia el id de temp_purchase para buscar si existen registros en la tabla temporal
 * en caso de que existan los elimina
 * 
 * @param {number} temp_purchase_id - id de la compra
 */
function cancelTempPurchase() {
    const tempActualId = $('#temp_purchase_id').val();
    $.ajax({
        url: `/temp_purchases_detail/cancelPurchase/${tempActualId}`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            cleanInputPurchase();
            applyDiscount(0);
            location.reload();

        }
    });
}

// =========================================
// FUNCIÓN: Limpia todos los datos del modal de detalle de los productos para compra
// =========================================
function clearProductDetailModal() {
    // Limpia inputs y selects
    $('#productDetails').find('input, select, textarea').each(function () {
        if ($(this).is(':checkbox') || $(this).is(':radio')) {
            $(this).prop('checked', false);
        } else {
            $(this).val('');
        }
    });
    $('.factor').prop('disabled', false);
    // Limpia los textos de los spans/divs
    $('.product-name, .barcode, .stock, .factor, .price-purchase, .price-purchase-iva, .price-sale-1, .price-sale-2, .price-sale-3, .price-unit, .unit-purchase, .margin-1, .margin-2, .margin-3').text('');

    // Si usas clases para los márgenes, también puedes limpiar así:
    [1, 2, 3].forEach(index => {
        $(`.margin-${index}`).text('');
    });
}

// =========================================
// FUNCIÓN: Para limpiar los campos de la compra
// =========================================
function cleanInputPurchase() {
    // Limpia los campos del proveedor
    $('#supplier_id').val(0)
    $('.company_name').html('No seleccionado')
    $('.name_supplier').html('Proveedor')
    $('.email_supplier').html('')
    $('.phone_supplier').html('')
    $('.rfc_supplier').html('')
    $('.credit_supplier').html('')
    $('#general-discount-number').val(0.00);
    $('.credit-terms').val(0);
    $('.credit-limit').val(0);
    $('.credit_available').val(0);
    $('.credit-due-date').val(0);

    // Limpia el campo de autocompletado
    $('#auto_complete_supplier').val('');
    $('#auto_complete_product').val('');

    // Para restablecer los selects y inputs de la compra
    $('#document-type').val(1).trigger('change');
    $('#voucher-type').val(1).trigger('change');
    $('#invoice_number').val('');

    // Limpiar los campos del detalle del proveedor 
    localStorage.removeItem("proveedorSeleccionado");

    // Restablecer la fecha de compra al día actual
    const dateInput = $('input[data-provider="flatpickr"]')[0];
    const flatpickrInstance = dateInput._flatpickr;

    if (flatpickrInstance) {
        const today = new Date();
        const currentDate = flatpickrInstance.selectedDates[0];

        // Solo cambiar si es diferente a hoy
        if (!currentDate || currentDate.toDateString() !== today.toDateString()) {
            flatpickrInstance.setDate(today, true);
        }
    }
}
// =========================================
// FUNCIÓN: Calcula el descuento en porcentaje
// =========================================

// =========================================
// FUNCIONES DE CÁLCULO (Legacy - usando el nuevo módulo)
// =========================================

/**
 * @deprecated Usar CalculationHelper.calculateDiscountAmount()
 */
function calculateDiscountPercentage(discount, costPrice) {
    return CalculationHelper.calculateDiscountAmount(discount, costPrice);
}

/**
 * @deprecated Usar CalculationHelper.calculateDiscountPercentage()
 */
function calculateDiscountNumber(discount, costPrice) {
    return CalculationHelper.calculateDiscountPercentage(discount, costPrice);
}

// =================================================================================
// FUNCIÓN: Carga los datos de los proveedores en la tabla dentro del modal para busqueda
// profunda
// =================================================================================
function loadListSuppliers() {
    if ($.fn.DataTable.isDataTable('#tableSuppliers')) {
        $('#tableSuppliers').DataTable().destroy();
        $('#tableSuppliers tbody').empty();
    }

    suppliersTable = $('#tableSuppliers').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/suppliers/data',
        columns: [
            { data: 'id', name: 'id' },
            { data: 'representative', name: 'representative' },
            { data: 'company_name', name: 'company_name' },
            {
                data: 'rfc',
                name: 'rfc',
                orderable: false,
                searchable: false
            },
            {
                data: 'phone',
                name: 'phone',
                orderable: false,
                searchable: false,
                render: function (data, type, row) {
                    // Si está vacío o null
                    if (!data) return '';

                    // Quitar todo lo que no sea número
                    const cleaned = data.replace(/\D/g, '');

                    // Aplicar el formato
                    if (cleaned.length === 10) {
                        return `(${cleaned.substr(0, 3)}) ${cleaned.substr(3, 3)}-${cleaned.substr(6, 4)}`;
                    }

                    // Si no tiene 10 dígitos, devuélvelo tal cual
                    return data;
                }
            },
            {
                data: 'email',
                name: 'email',
                orderable: false,
            },
            {
                data: 'address',
                name: 'address',
                orderable: false,
                searchable: false,
                visible: false
            },
            {
                data: null,
                name: 'credit_available',
                orderable: false,
                searchable: false,
                render: function (data, type, row) {
                    return data.credit_available - data.credit;
                }
            },
            {
                data: 'credit',
                name: 'credit',
                visible: false
            },
            {
                data: 'credit_due_date',
                name: 'credit_due_date',
                visible: false
            },
            {
                data: 'credit_terms',
                name: 'credit_terms',
                visible: false
            },

        ],
        scrollY: 450,
        deferRender: true,
        scroller: true,
        language: idiomaEspanol,
        searching: false,
        info: false,
        dom: 'frt<"bottom row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>><"clear">',
    });
}
// =================================================================================
// FUNCIÓN: Carga los datos de los productos en la tabla dentro del modal para busqueda
// profunda
// =================================================================================
function loadListProducts() {
    if ($.fn.DataTable.isDataTable('#tableProducts')) {
        $('#tableProducts').DataTable().destroy();
        $('#tableProducts tbody').empty();
    }

    productsTable = $('#tableProducts').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/products/data',
        columns: [
            { data: 'id', name: 'id' },
            { data: 'product_name', name: 'product_name' },
            {
                data: 'barcode',
                name: 'barcode',
                orderable: false,
                searchable: false
            },
            {
                data: 'category_name',
                name: 'category_name',
                className: 'text-center',
            },
            {
                data: 'department_name',
                name: 'department_name',
                className: 'text-center',
            },
            {
                data: 'sale_price_1',
                name: 'sale_price_1',
                orderable: false,
                searchable: false,
                className: 'text-end',
            },
            {
                data: 'stock',
                name: 'stock',
                orderable: false,
                searchable: false,
                className: 'text-end',
            },
            {
                data: 'sale_unit_name',
                name: 'sale_unit_name',
                searchable: false,
                className: 'text-center',
            },
        ],
        scrollY: 500,
        deferRender: true,
        scroller: true,
        language: idiomaEspanol,
    });
}
// =================================================================================
//  CONSTANTE: Configuracion global para validar el metodo de pago seleccionado
// =================================================================================
const PAYMENT_CONFIG = {
    methods: {
        BOX: 'payment-box',
        CREDIT: 'payment-credit',
    },
    fields: {
        box: ['#payment-cash', '#payment-card', '#payment-transfer', '#payment-voucher'],
        credit: ['#current-credit', '#credit-days', '#due-date'],
        creditDisabled: ['#credit', '#credit_available']
    }
};

// =================================================================================
//  FUNCIÓN: Para validar el método de pago seleccionado y mostrar/ocultar campos
// =================================================================================
function validatePaymentMethod() {
    // Evento para mostrar/ocultar campos según el método de pago seleccionado
    $('input[name="payment_method"]').on('change', function () {
        const selectedMethod = $(this).attr('id');

        // Resetear todos los campos
        resetPaymentFields();

        // Configura los campos según el método seleccionado
        configurePaymentFields(selectedMethod);

        // Procesar la compra
        //processPurchasesByMethod(selectedMethod);
    });
}

// =================================================================================
//  FUNCTIÓN: Resetea los campos de formulario para finalizar la compra
// =================================================================================
function resetPaymentFields() {

    // Resetea los campos de caja
    PAYMENT_CONFIG.fields.box.forEach(field => {
        $(field).val('0.00').prop('disabled', true);
    })

    // Resetea los campos de crédito
    PAYMENT_CONFIG.fields.credit.forEach(field => {
        $(field).prop('disabled', true);
    })

    // Resetea los campos de crédito deshabilitados
    PAYMENT_CONFIG.fields.creditDisabled.forEach(field => {
        $(field).prop('disabled', true);
    })
}
// =================================================================================
//  FUNCIÓN: Para configurar los campos según el método de pago seleccionado
// =================================================================================
function configurePaymentFields(method) {
    if (method === PAYMENT_CONFIG.methods.BOX) {
        // Configurar para pago de contado
        const totalAmount = parseFloat($('.total').text().replace(/[$,]/g, '')) || 0;

        $('#payment-cash').val(totalAmount.toFixed(2)).prop('disabled', false);
        $('#payment-card, #payment-transfer, #payment-voucher').val(0).prop('disabled', false);

    } else if (method === PAYMENT_CONFIG.methods.CREDIT) {
        // Configurar para pago a crédito
        PAYMENT_CONFIG.fields.credit.forEach(field => {
            $(field).prop('disabled', false);
        });
    }
}

// =================================================================================
//  FUNCIÓN: Obtiene los detalles de la compra y procesa la compra según el método seleccionado
// =================================================================================
function processPurchasesByMethod(payment_method = PAYMENT_CONFIG.methods.BOX) {
    const purchase_data = getPurchaseDetails();
    processPurchases(payment_method, purchase_data);
}

// =================================================================================
//  FUNCIÓN: Obtiene los detalles de la compra generales y específicos según el método de pago
// =================================================================================
function getPurchaseDetails() {
    // Obtener valores con valores por defecto
    const getFieldValue = (selector, defaultValue = '') => {
        return $(selector).val() || defaultValue;
    };

    // Valores goblales de la compra
    const data = {
        id_supplier: getFieldValue('#supplier_id'),
        id_voucher: getFieldValue('#voucher-type'),
        id_document: getFieldValue('#document-type'),
        invoice_number: getFieldValue('#invoice_number'),
        date: getFieldValue('#purchase-date'),
        amount_paid: sumPaymentMethods(),
    };

    // Agregar datos específicos según el método de pago
    const selectedMethod = $('input[name="payment_method"]:checked').attr('id');

    if (selectedMethod === PAYMENT_CONFIG.methods.BOX) {
        data.payment_details = {
            efectivo: parseFloat($('#payment-cash').val()) || 0,
            tarjeta: parseFloat($('#payment-card').val()) || 0,
            transferencia: parseFloat($('#payment-transfer').val()) || 0,
            vale: parseFloat($('#payment-voucher').val()) || 0
        };
    } else if (selectedMethod === PAYMENT_CONFIG.methods.CREDIT) {
        data.credit_details = {
            current_credit: getFieldValue('#current-credit'),
            credit_days: getFieldValue('#credit-days'),
            due_date: getFieldValue('#due-date')
        };
    }

    return data;
}

// =================================================================================
//  FUNCIÓN: Procesar la compra enviando los datos al servidor
// =================================================================================
function processPurchases(method, details) {
    $.ajax({
        url: '/temp_purchases_detail/processPurchase',
        type: 'POST',
        dataType: 'json',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'),
            method: method,
            data: details,
            temp_id: $('#temp_purchase_id').val(),
        },
        success: function (response) {
            if (response.success) {
                showAlert('success', 'Éxito', response.message || 'Compra procesada correctamente');

                /*
                if (response.purchase_id) {
                    // Opcional: Imprimir ticket/factura
                    if (confirm('¿Desea imprimir el comprobante?')) {
                        printPurchaseReceipt(response.purchase_id);
                    }
                }*/

                // Recargar después de un breve delay para mostrar el mensaje
                setTimeout(() => {
                    cleanInputPurchase();
                    applyDiscount(0);
                    window.location.reload();
                }, 1500);
            } else {
                showAlert('warning', 'Advertencia', response.message);
            }
        },
        error: function (xhr) {
            // Manejo mejorado de errores
            let errorMessage = 'Error al procesar la compra';

            try {
                const response = JSON.parse(xhr.responseText);
                errorMessage = response.message || errorMessage;

                // Si hay errores de validación específicos
                if (response.errors) {
                    errorMessage = Object.values(response.errors).flat().join(', ');
                }
            } catch (e) {
                // Si no se puede parsear la respuesta
                errorMessage = xhr.statusText || errorMessage;
            }
            showAlert('error', 'Error', errorMessage);
        },
    });
}
function sumPaymentMethods() {
    let total_amount = 0;
    $('.payment_method').each(function () {
        const value = parseFloat($(this).val()) || 0;
        total_amount += value;
    })

    return total_amount.toFixed(2);
}
// =========================================
// FUNCTION: Obtener los precios de venta validos
// =========================================
function getValidSalePrice(data, index, hasTemp) {
    let salePrice = 0;

    if (hasTemp) {
        const tempPrice = parseFloat(data[`new_sale_price_${index}`]);
        if (tempPrice && tempPrice > 0) {
            salePrice = tempPrice;
        }
    }

    // Si no hay precio temporal válido, usar el original
    if (salePrice === 0) {
        const originalPrice = parseFloat(data[`original_sale_price_${index}`]);
        if (originalPrice && originalPrice > 0) {
            salePrice = originalPrice;
        }
    }

    return salePrice;
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
    info: "Mostrando registros del _START_ al _END_ de _TOTAL_ registros"
};
