import { makeNumericInput } from '../../utils/numericInputs';
// ── Módulos de VENTAS ────────────────────────────────────────────────────────
import { initCustomerModule, getCustomerData, cleanCustomerData } from './customerModule';
import { initProductModule } from './productModule';
import { initDetailModule, loadTotals } from './detailModule';
import { initWaitingModule } from './waitingModule';

// =========================================
// CONFIGURACIÓN GENERAL DEL MÓDULO PRINCIPAL
// =========================================
const MAIN_CONFIG = {
    selectors: {
        purchaseDate:   '#purchase-date',
        tempSaleId: '#temp_sale_id',
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
        _initModules();
        _loadInitialData();
        console.log('✅ saleMain inicializado correctamente');
    } catch (error) {
        console.error('❌ Error crítico al inicializar ventas:', error);
    }
});

function _initModules() {
    initCustomerModule();
    initDetailModule();
    initProductModule();
    initWaitingModule();
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