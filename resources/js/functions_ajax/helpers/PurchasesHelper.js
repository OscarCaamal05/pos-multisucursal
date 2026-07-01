import { showAlert, handleValidationError, showConfirmationAlert } from '../utils/alerts';
import { showProductsModal } from './productHelper';
import { validateInputChecked, calculateUnitPrice, calculateMarginFromSalePrice } from '../functionAjaxProducts';

let filePondInitialized = false;
let pendingProductImage = null;
let imageLoadTimeout = null; // Para cancelar el setTimeout si se cierra el modal
// =========================================
// CONFIGURACIÓN CENTRALIZADA PARA COMPRAS
// =========================================
export const PURCHASES_CONFIG = {

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
    },

    // Configuración numérica
    numbers: {
        decimals: 2,
        defaultTax: 0
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
export function openModalWithData(modalId, loadFunction = null) {
    $(modalId).modal('show');
    if (loadFunction && typeof loadFunction === 'function') {
        loadFunction();
    }
}

/**
 * Cierra un modal específico
 * @param {string} modalId - ID del modal a cerrar
 */
export function closeModal(modalId) {
    $(modalId).modal('hide');
}

/**
 * Maneja la selección de una fila en tablas de modales
 * @param {string} tableId - ID de la tabla
 * @param {Function} onDoubleClick - Función a ejecutar en doble click
 */
export function bindTableRowSelection(tableId, onDoubleClick) {
    $(`${tableId} tbody`).on('dblclick', 'tr', function () {
        const table = $(tableId).DataTable();
        const data = table.row(this).data();
        onDoubleClick(data);
    });
}

// =========================================
// FUNCIONES HELPER AJAX
// =========================================

/**
 * Realiza una petición AJAX estandarizada
 * @param {Object} options - Opciones de la petición
 * @param {string} options.url - URL del endpoint
 * @param {string} options.method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {Object} options.data - Datos a enviar
 * @param {Function} options.onSuccess - Callback de éxito
 * @param {Function} options.onError - Callback de error personalizado
 */
export function makeAjaxRequest({ url, method = 'GET', data = {}, onSuccess, onError }) {
    // Agregar token CSRF para métodos que lo requieren
    if (['POST', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
        data._token = $('meta[name="csrf-token"]').attr('content');
    }

    $.ajax({
        url,
        method,
        data,
        dataType: 'json',
        success: function (response) {
            if (onSuccess && typeof onSuccess === 'function') {
                onSuccess(response);
            }
        },
        error: function (xhr) {
            if (onError && typeof onError === 'function') {
                onError(xhr);
            } else {
                handleAjaxError(xhr);
            }
        }
    });
}

/**
 * Manejo centralizado de errores AJAX
 * @param {Object} xhr - Objeto XMLHttpRequest
 */
export function handleAjaxError(xhr) {
    if (xhr.status === 422) {
        // Error de validación - asumiendo que tienes una función handleValidationError importada
        if (typeof handleValidationError === 'function') {
            handleValidationError(xhr);
        }
    } else {
        // Otros errores - asumiendo que tienes showAlert importada
        if (typeof showAlert === 'function') {
            showAlert('error', 'Error', 'Ocurrió un error inesperado. Intente nuevamente.');
        }
    }
}

// =========================================
// MÓDULO DE CÁLCULOS
// =========================================

export const CalculationHelper = {
    /**
     * Calcula el descuento en valor monetario basado en porcentaje
     * @param {number} percentage - Porcentaje de descuento
     * @param {number} baseAmount - Monto base
     * @returns {string} Valor del descuento formateado
     */
    calculateDiscountAmount(percentage, baseAmount) {
        if (!percentage || !baseAmount) return '0.00';
        return (baseAmount * (percentage / 100)).toFixed(PURCHASES_CONFIG.numbers.decimals);
    },

    /**
     * Calcula el porcentaje de descuento basado en el monto
     * @param {number} discountAmount - Monto del descuento
     * @param {number} baseAmount - Monto base
     * @returns {string} Porcentaje formateado
     */
    calculateDiscountPercentage(discountAmount, baseAmount) {
        if (!discountAmount || !baseAmount) return '0.00';
        return ((discountAmount / baseAmount) * 100).toFixed(PURCHASES_CONFIG.numbers.decimals);
    },

    /**
     * Formatea un valor monetario
     * @param {number} amount - Monto a formatear
     * @returns {string} Monto formateado
     */
    formatCurrency(amount) {
        return parseFloat(amount || 0).toFixed(PURCHASES_CONFIG.numbers.decimals);
    },

    /**
     * Valida que la cantidad sea mayor a cero
     * @param {number} quantity - Cantidad a validar
     * @returns {boolean} True si es válida
     */
    isValidQuantity(quantity) {
        return quantity && quantity > 0;
    },

    /**
     * Calcula el total con descuento aplicado
     * @param {number} subtotal - Subtotal base
     * @param {number} discountAmount - Monto del descuento
     * @returns {number} Total con descuento
     */
    applyDiscount(subtotal, discountAmount) {
        return Math.max(0, subtotal - (discountAmount || 0));
    },

    /**
     * Calcula el impuesto sobre un monto
     * @param {number} amount - Monto base
     * @param {number} taxRate - Tasa de impuesto (por defecto usa la configurada)
     * @returns {number} Impuesto calculado
     */
    calculateTax(amount, taxRate = PURCHASES_CONFIG.numbers.defaultTax) {
        return (amount * (taxRate / 100));
    }
};

/**
 * Renderiza los botones de acciones (editar, eliminar)
 * @param {any} data - ID del elemento
 * @returns {string} HTML renderizado
 */
export function renderActionsColumn(data) {
    return `
        <div class="hstack gap-3 fs-15">
            <a href="javascript:void(0);" class="link-danger btn-delete-detail" data-id="${data}">
                <i class="ri-delete-bin-5-line"></i>
            </a>
        </div>
    `;
}

export function renderActionsColumnProduct(data) {
    return `
        <div class="hstack gap-3 fs-15">
            <a href="javascript:void(0);" class="link-warning btn-edit-product" data-id="${data}">
                <i class="ri-edit-2-line"></i>
            </a>
        </div>
    `;
}


// =========================================
// NOTA: FUNCIONES DE AUTOCOMPLETADO
// =========================================
// Las funciones de autocompletado se manejan directamente en el archivo principal
// para evitar problemas de contexto con la librería autoComplete.js

// =========================================
// FUNCIONES DE VALIDACIÓN
// =========================================

/**
 * Valida que haya un proveedor seleccionado
 * @param {string} supplierId - ID del proveedor
 * @returns {boolean} True si es válido
 */
export function validateSupplierSelected(supplierId) {
    return supplierId && supplierId != 0;
}

/**
 * Valida que haya productos en la tabla
 * @param {Object} table - Instancia del DataTable
 * @returns {boolean} True si hay productos
 */
export function validateProductsInTable(table) {
    return table && table.rows().count() > 0;
}

/**
 * Formatea un número de teléfono a formato (XXX)-XXX-XXXX
 * @param {string} phone - Número de teléfono
 * @returns {string} Teléfono formateado
 */
export function formatPhoneNumber(phone) {
    if (!phone || phone.length !== 10) return phone;
    return `(${phone.substring(0, 3)})-${phone.substring(3, 6)}-${phone.substring(6)}`;
}

// FUNCION PARA EDITAR PRODUCTOS
/*export function bindEditProduct(tableInstance) {

    $('#tableProducts tbody').off('click.editProduct', '.btn-edit-product');
    
    $('#tableProducts tbody').on('click', '.btn-edit-product', function () {
        const $button = $(this);

        const rowData = tableInstance.row($button.closest('tr')).data();

        // Verificar que tenemos datos
        if (!rowData) {
            showAlert('error', 'Error', 'No se pudieron obtener los datos de la fila');
            return;
        }

        showConfirmationAlert(
            '¿Estás seguro?',
            'Editar este registro.',
            'Sí, editar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    showProductsModal({ id: rowData.id })
                        .then((response) => {
                            if (response.status === 'success') {
                                // Valores para inputs de texto en general
                                $('#name').val(response.data.name);
                                $('#barcode').val(response.data.barcode);
                                $('#conversion_factor').val(response.data.conversion_factor);
                                $('#purchase_price').val(response.data.purchase_price).data('base-price', response.data.purchase_price);
                                $('#price_iva').val(response.data.purchase_price);
                                $('#sale_price_1').val(response.data.sale_price_1);
                                $('#price_1_min_qty').val(response.data.price_1_min_qty);
                                $('#sale_price_2').val(response.data.sale_price_2);
                                $('#price_2_min_qty').val(response.data.price_2_min_qty);
                                $('#sale_price_3').val(response.data.sale_price_3);
                                $('#price_3_min_qty').val(response.data.price_3_min_qty);

                                // Calcular el precio unitario basado en el precio de compra y el factor de conversión
                                calculateUnitPrice(response.data.purchase_price, response.data.conversion_factor);
                                const unitPrice = parseFloat(response.data.unit_price); // asegurarte de que sea número
                                $('#unit_price').val(unitPrice.toFixed(2));

                                // Funcion para mostrar los precios con sus respectivos margene
                                [1, 2, 3].forEach(index => {
                                    const salePrice = parseFloat(response.data[`sale_price_${index}`]);

                                    const margin = calculateMarginFromSalePrice(unitPrice, salePrice);
                                    $(`#margen_${index}`).val(margin); // solo mostrar el margen
                                });

                                // Cuando recibas los datos del producto para editar:
                                const taxIds = response.data.tax_ids ? response.data.tax_ids.split(',') : [];
                                // Marca los checkboxes correspondientes
                                $('input[name="taxes[]"]').each(function () {
                                    const taxId = $(this).val();
                                    if (taxIds.includes(taxId)) {
                                        $(this).prop('checked', true);
                                    }
                                });

                                // Validar los checkboxes de IVA y Neto para mostrar los precios correctamente
                                validateInputChecked();

                                // Valores para inputs de texto en adicional
                                $('#description').val(response.data.description);
                                $('#stock_min').val(response.data.stock_min);
                                $('#stock_max').val(response.data.stock_max);
                                $('#expiry-date').flatpickr().setDate(response.data.expiry_date);
                                $('#shelf_life_days').val(response.data.shelf_life_days);
                                $('#alert_days_before_expiration').val(response.data.alert_days_before_expiration);

                                // Valores para los select
                                $('.products_departments').val(response.data.department_id).trigger('change');
                                $('.products_categories').val(response.data.category_id).trigger('change');
                                $('.purchase_unit').val(response.data.purchase_unit_id).trigger('change');
                                $('.sale_unit').val(response.data.sale_unit_id).trigger('change');

                                // Valores para los checkboxes
                                $('#is_fractional').prop('checked', response.data.is_fractional === 1);
                                $('#is_net_price').prop('checked', response.data.is_net_price === 1);
                                $('#is_service').prop('checked', response.data.is_service === 1);
                                $().prop('checked', response.data.taxes ? response.data.taxes.map(tax => tax.id) : []);
                                $('#allow_fractional_sale').prop('checked', response.data.allow_fractional_sale === 1);
                                $('#allow_decimal_quantity').prop('checked', response.data.allow_decimal_quantity === 1);
                                $('#requires_batch_control').prop('checked', response.data.requires_batch_control === 1);
                                $('#requires_serial_number').prop('checked', response.data.requires_serial_number === 1);

                                // =========================================
                                // CARGAR IMAGEN EXISTENTE EN FILEPOND
                                // =========================================
                                if (response.data.image_url || response.data.image) {
                                    const imagePath = response.data.image_url || response.data.image;

                                    // Guardar en variable JavaScript
                                    pendingProductImage = imagePath;

                                    // Si ya está inicializado (tab activo), cargar inmediatamente
                                    if (filePondInitialized) {
                                        loadFilePondImage('product-main', imagePath);
                                        pendingProductImage = null; // Limpiar inmediatamente
                                    }
                                } else {
                                    // Limpiar si no hay imagen
                                    pendingProductImage = null;
                                    if (filePondInitialized) {
                                        clearFilePondFiles('product-main');
                                    }
                                    $('#remove_image').val('0');
                                }

                            } else {
                                showAlert('error', 'Error', response.message);
                            }
                        })
                        .catch((error) => {
                            showAlert('error', 'Error', error);
                        });
                }
            }
        );
    });
}*/