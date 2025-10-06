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
        success: function(response) {
            if (onSuccess && typeof onSuccess === 'function') {
                onSuccess(response);
            }
        },
        error: function(xhr) {
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