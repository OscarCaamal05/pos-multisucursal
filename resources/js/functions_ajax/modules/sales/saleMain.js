import { showAlert } from "../../utils/alerts";
import { makeNumericInput } from "../../utils/numericInputs";
import { initCustomerModule } from './customerModule';

// =========================================
// CONFIGURACIÓN CENTRALIZADA
// =========================================
const SALES_CONFIG = {
    api: {
        base: '/temp_sales_detail',
        customers: '/customers',
        products: '/products',
        process: '/sales/process'
    },
    selectors: {
        tempId: '#temp_sale_id',
        customerId: '#customer_id',
        dateInput: '#sale-date',
        autoCompleteCustomer: '#auto_complete_customer',
        tableDetails: '#tableDetails',
        modalCustomers: '#modal-customers',
        modalProducts: '#modal-products'
    },
    storage: {
        customerKey: 'clienteSeleccionado',
        saleKey: 'ventaEnProceso'
    },
    messages: {
        noCustomer: 'Seleccione un cliente para continuar',
        noProducts: 'Agregue productos a la venta para continuar',
        productExists: 'El producto ya existe en la lista de venta',
        saleProcessed: 'Venta procesada exitosamente'
    }
};

// =========================================
// VARIABLES GLOBALES EXPORTADAS
// =========================================
export let tableDetails = null;
export let selectedRowDetail = null;
export let productsTable = null;
export let salesTable = null;
export let customersTable = null;

$(document).ready(function () {
    // Configuración inicial
    initializeDatePicker();
    initializeNumericInputs();
    loadInitalData();

    // Inicializar módulo de clientes
    initCustomerModule();
});
/**
 * ------------------------------------------ FIN READY -------------------------------------------------
 */

// ===================================================================
// CONFIGURACIÓN INICIAL DEL SISTEMA
// ===================================================================

function initializeDatePicker() {
    const currentDate = $('#sale-date').val();
    flatpickr(currentDate, {
        dateFormat: "d M, Y",
        altFormat: "d M, Y",
        defaultDate: new Date(),
    })
}

function initializeNumericInputs() {
    // Arreglo para los campos numéricos
    const numericFields = [
        { selector: '#folio', config: { type: 'integer', min: 1 } },
        { selector: '#general-discount-number', config: { type: 'decimal', min: 1 } },
        { selector: '#payment-cash', config: { type: 'decimal', min: 1, decimals: 2 } },
        { selector: '#payment-card', config: { type: 'decimal', min: 1, decimals: 2 } },
        { selector: '#payment-transfer', config: { type: 'decimal', min: 1, decimals: 2 } },
        { selector: '#payment-voucher', config: { type: 'decimal', min: 1, decimals: 2 } }
    ]

    // Inicializar cada campo numérico HACIENDO LA LLAMADA A LA FUNCIÓN UNA UNICA VEZ
    numericFields.forEach(field => {
        makeNumericInput(field.selector, field.config);
    });
}

function loadInitalData() {
    const tempSaleId = $('#temp_sale_id').val();
    loadTotals(tempSaleId);
}

// ===================================================================
// FUNCIONES GENERICAS DE LA VENTA
// ===================================================================

/**
 * Carga los totales de la venta temporal
 * @param {number} tempSaleId - ID de la venta temporal
 */
function loadTotals(tempSaleId) {

    if (!tempSaleId) {
        console.error('ID de venta temporal no válido');
        return;
    }

    $.ajax(
        {
            url: `${SALES_CONFIG.api.base}/totals/${tempSaleId}`,
            method: 'GET',
            dataType: 'json',
            success: function (response) {
                // Actualizar la interfaz con los totales
                showTotals(response);
            },
            error: function (error) {
                showAlert('Error al cargar los totales', 'error');
            }
        });
}

/** Muestra los totales en la interfaz
 * @param {object} totals - Objeto con los totales
 */
function showTotals(totals) {
    const formatCurrency = (value) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    $('.sub-total').text(`$${formatCurrency(totals.sub_total)}`);
    $('.total-tax').text(`$${formatCurrency(totals.total_siva)}`);
    $('.tax').text(`$${formatCurrency(totals.tax)}`);
    $('.total').text(`$${formatCurrency(totals.total)}`);
    $('.discount-general').val((totals.discount || 0.00).toFixed(2));
}

/**
 * Limpia los datos de entrada de la venta
 */
export function cleanInputSale() {
    // Limpiar campos principales
    $(SALES_CONFIG.selectors.customerId).val(0);
    $('#auto_complete_customer').val('');

    // Limpiar totales
    $('.sub-total, .total-tax, .tax, .total').text('$0.00');
    $('.discount-general').val('0.00');

    // Limpiar información del cliente
    $('.customer-name').text('Cliente General');
    $('.customer-email, .customer-phone, .customer-address').text('');

    // Limpiar localStorage
    localStorage.removeItem(SALES_CONFIG.storage.customerKey);
    localStorage.removeItem(SALES_CONFIG.storage.saleKey);

    console.log('✅ Datos de venta limpiados');
}

// ===================================================================
// FUNCIONES AUXILIARES DE VALIDACIÓN
// ===================================================================

/**
 * Valida si hay un cliente seleccionado
 * @returns {boolean} True si hay cliente seleccionado
 */
export function validateCustomerSelected() {
    const customerId = $(SALES_CONFIG.selectors.customerId).val();
    if (!customerId || customerId === '0') {
        showAlert('warning', 'Alerta', SALES_CONFIG.messages.noCustomer);
        return false;
    }
    return true;
}

/**
 * Valida si hay productos en la tabla de detalles
 * @returns {boolean} True si hay productos
 */
export function validateProductsInTable() {
    if (!tableDetails || tableDetails.rows().count() === 0) {
        showAlert('warning', 'Alerta', SALES_CONFIG.messages.noProducts);
        return false;
    }
    return true;
}

/**
 * Función helper para formatear valores monetarios
 * @param {number|string} value - Valor a formatear
 * @param {string} defaultValue - Valor por defecto si es inválido
 * @returns {string} Valor formateado
 */
export function formatCurrencyValue(value, defaultValue = '0.00') {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 ? num.toFixed(2) : defaultValue;
}

// =========================================
// EXPORTAR CONFIGURACIÓN PARA OTROS MÓDULOS
// =========================================
export { SALES_CONFIG };