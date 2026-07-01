import { makeNumericInput } from '../../utils/numericInputs';
// ── Módulos de VENTAS ────────────────────────────────────────────────────────
import { initCustomerModule, getCustomerData, cleanCustomerData } from './customerModule';
import { initProductModule } from './productModule';
import { initDetailModule, loadTotals } from './detailModule';
import { initWaitingModule } from './waitingModule';
import { initPaymentModule } from './paymentModule';

// =========================================
// CONFIGURACIÓN GENERAL DEL MÓDULO PRINCIPAL
// =========================================
const MAIN_CONFIG = {
    selectors: {
        operationDate: '#date-operation',
        tempSaleId: '#temp_sale_id',
        btnAddSupplier: '#btn-add-supplier',
        supplierModal: '#supplierModal',
        supplier_id: '#supplier_id',
    },
    // Campos numéricos con su configuración
    numericFields: [
        { selector: '.product-quantity', config: { type: 'decimal', min: 0, decimals: 2 } },
        { selector: '#current-number', config: { type: 'integer', min: 1 } },
        { selector: '#general-discount-number', config: { type: 'decimal', min: 0 } },
        { selector: '#quantity', config: { type: 'integer', min: 1 } },
        { selector: '#product-discount-number', config: { type: 'decimal', min: 0, decimals: 2 } },
        { selector: '#product-discount-percentage', config: { type: 'decimal', min: 0, decimals: 2 } },
        { selector: '#payment-card', config: { type: 'decimal', min: 0, decimals: 2 } },
        { selector: '#payment-cash', config: { type: 'decimal', min: 0, decimals: 2 } },
        { selector: '#payment-transfer', config: { type: 'decimal', min: 0, decimals: 2 } },
        { selector: '#payment-voucher', config: { type: 'decimal', min: 0, decimals: 2 } },
    ]
};
// =========================================
// ENTRY POINT — document.ready
// =========================================

$(document).ready(function () {
    try {
        _initModules();
        _initNumericInputs();
        _loadInitialData();
        _initDatePicker();
        console.log('✅ saleMain inicializado correctamente');
    } catch (error) {
        console.error('❌ Error crítico al inicializar ventas:', error);
    }
});

// =========================================
// FUNCIONES DE INICIALIZACIÓN
// =========================================

/**
 * Inicializa el datepicker de la fecha de compra.
 */
function _initDatePicker() {
    flatpickr(MAIN_CONFIG.selectors.operationDate, {
        dateFormat:  'd M, Y',
        altFormat:   'd M, Y',
        defaultDate: new Date(),
    });
}

/**
 * Inicializa todos los inputs numéricos definidos en MAIN_CONFIG.
 * Iterar el array es más limpio que 14 llamadas manuales.
 */
function _initNumericInputs() {
    MAIN_CONFIG.numericFields.forEach(({ selector, config }) => {
        makeNumericInput(selector, config);
    });
}


function _initModules() {
    initCustomerModule();
    initDetailModule();
    initProductModule();
    initWaitingModule();
    initPaymentModule();
}

/**
 * Carga los datos persistentes al iniciar la página.
 * Se ejecuta después de inicializar los módulos para que
 * los handlers ya estén registrados.
 */
function _loadInitialData() {
    const tempSaleId = $(MAIN_CONFIG.selectors.tempSaleId).val();
    console.log(tempSaleId);
    if (tempSaleId) {
        loadTotals(tempSaleId);
    }
}