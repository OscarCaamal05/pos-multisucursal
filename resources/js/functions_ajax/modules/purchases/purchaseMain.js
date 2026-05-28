import { makeNumericInput } from '../../utils/numericInputs';
import { initCreditTermsAndDate, closeSupplierModal, bindSupplierFormSubmit, formatCleave } from '../../helpers/supplierHelper';

// ── Módulos de compras ────────────────────────────────────────────────────────
import { initSupplierModule, getSupplierData, cleanSupplierData } from './supplierModule';
import { initDetailModule, loadTotals, getTableDetails } from './detailModule';
import { initProductModule } from './productModule';
import { initWaitingModule } from './waitingModule';
import { initPaymentModule } from './paymentModule';

// =========================================
// CONFIGURACIÓN GENERAL DEL MÓDULO PRINCIPAL
// =========================================
const MAIN_CONFIG = {
    selectors: {
        purchaseDate:   '#purchase-date',
        tempPurchaseId: '#temp_purchase_id',
        btnAddSupplier: '#btn-add-supplier',
        supplierModal:  '#supplierModal',
        supplier_id:    '#supplier_id',
    },
    // Campos numéricos con su configuración
    numericFields: [
        { selector: '.price-sale',           config: { type: 'decimal',  min: 0,  decimals: 2 } },
        { selector: '#folio',                config: { type: 'integer',  min: 1               } },
        { selector: '#general-discount-number', config: { type: 'decimal', min: 0              } },
        { selector: '#quantity',             config: { type: 'integer',  min: 1               } },
        { selector: '#cost',                 config: { type: 'decimal',  min: 0, decimals: 2  } },
        { selector: '#discount-number',      config: { type: 'decimal',  min: 0, decimals: 2  } },
        { selector: '#new_price_sale_1',     config: { type: 'decimal',  min: 0, decimals: 2  } },
        { selector: '#new_price_sale_2',     config: { type: 'decimal',  min: 0, decimals: 2  } },
        { selector: '#new_price_sale_3',     config: { type: 'decimal',  min: 0, decimals: 2  } },
        { selector: '#discount-percentage',  config: { type: 'integer',  min: 0, max: 100     } },
        { selector: '#payment-card',         config: { type: 'decimal',  min: 0, decimals: 2  } },
        { selector: '#payment-cash',         config: { type: 'decimal',  min: 0, decimals: 2  } },
        { selector: '#payment-transfer',     config: { type: 'decimal',  min: 0, decimals: 2  } },
        { selector: '#payment-voucher',      config: { type: 'decimal',  min: 0, decimals: 2  } },
    ]
};

// =========================================
// ENTRY POINT — document.ready
// =========================================

$(document).ready(function () {
    try {
        _initDatePicker();
        _initNumericInputs();
        _initSupplierForm();
        _initModules();
        _loadInitialData();
        console.log('✅ purchaseMain inicializado correctamente');
    } catch (error) {
        console.error('❌ Error crítico al inicializar compras:', error);
    }
});

// =========================================
// FUNCIONES DE INICIALIZACIÓN
// =========================================

/**
 * Inicializa el datepicker de la fecha de compra.
 */
function _initDatePicker() {
    flatpickr(MAIN_CONFIG.selectors.purchaseDate, {
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

/**
 * Inicializa el formulario de nuevo proveedor (modal #supplierModal).
 * Se separa de initSupplierModule porque este formulario puede ser
 * disparado desde múltiples vistas, no solo desde el módulo de compras.
 */
function _initSupplierForm() {
    // Formateo del input de teléfono con Cleave.js
    formatCleave();

    // Flatpickr para los plazos de crédito del proveedor
    initCreditTermsAndDate('#credit_terms', '#credit_due_date', 30);

    // Submit del formulario de proveedor
    bindSupplierFormSubmit({
        table: null,
        onSuccess: (response) => {
            // Si se crea un proveedor nuevo, seleccionarlo automáticamente
            if (response.supplier?.id) {
                getSupplierData(response.supplier.id);
            }
            $(`${MAIN_CONFIG.selectors.supplierModal}`).modal('hide');
        }
    });

    // Botón abrir modal de nuevo proveedor
    $(MAIN_CONFIG.selectors.btnAddSupplier).on('click', (e) => {
        e.preventDefault();
        $(MAIN_CONFIG.selectors.supplierModal).modal('show');
    });

    // Cerrar modal proveedor con confirmación si hay datos
    closeSupplierModal();
}

/**
 * Inicializa todos los módulos en el orden correcto.
 * Cada módulo registra sus propios eventos internamente.
 *
 * Orden:
 *  1. supplierModule  → proveedor (sin dependencias de otros módulos de compras)
 *  2. detailModule    → tabla temporal (depende de supplierModule para limpiar)
 *  3. productModule   → productos (depende de detailModule via eventos)
 *  4. waitingModule   → espera (depende de supplierModule + detailModule)
 *  5. paymentModule   → pago (depende de supplierModule + detailModule)
 */
function _initModules() {
    initSupplierModule();
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
    const tempPurchaseId = $(MAIN_CONFIG.selectors.tempPurchaseId).val();
    if (tempPurchaseId) {
        loadTotals(tempPurchaseId);
    }
}