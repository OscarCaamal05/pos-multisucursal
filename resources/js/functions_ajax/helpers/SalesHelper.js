import { showAlert, handleValidationError, showConfirmationAlert } from '../utils/alerts';
import { showProductsModal } from './productHelper';
import { validateInputChecked, calculateUnitPrice, calculateMarginFromSalePrice } from '../functionAjaxProducts';

// =========================================
// CONFIGURACIÓN CENTRALIZADA PARA VENTAS
// =========================================
export const SALES_CONFIG = {

    // Clases CSS
    cssClasses: {
        selected: 'selected table-light',
        noResult: 'no_result'
    },

    // Mensajes
    messages: {
        noCustomer: 'Seleccione un cliente para continuar.',
        noProducts: 'Agregue productos a la venta para continuar.',
        productExists: 'El producto ya fue agregado a la lista.',
        selectRow: 'Seleccione una fila para continuar',
        quantityRequired: 'La cantidad del producto debe ser mayor a 0'
    },

    // LocalStorage keys
    storage: {
        customerKey: 'clienteSeleccionado'
    },

    // Configuración de modales
    modals: {
        products: '#modal-products',
        customers: '#modal-customers',
        productDetails: '#modal-product-details',
        payment: '#modal-payment-detail',
        saleWaiting: '#modal-sale-waiting'
    },

    // Configuración numérica
    numbers: {
        decimals: 2,
        defaultTax: 0
    }
};

// =========================================
// FUNCIONES DE VALIDACIÓN
// =========================================

/**
 * Valida que haya un cliente seleccionado
 * @param {string} customerId - ID del cliente
 * @returns {boolean} True si es válido
 */
export function validateCustomerSelected(customerId) {
    return customerId && customerId != 0;
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