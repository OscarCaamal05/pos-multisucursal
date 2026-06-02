import { makeNumericInput } from '../../utils/numericInputs';
// ── Módulos de VENTAS ────────────────────────────────────────────────────────
import { initCustomerModule, getCustomerData, cleanCustomerData } from './customerModule';

// =========================================
// ENTRY POINT — document.ready
// =========================================

$(document).ready(function () {
    try {
        _initModules();
        _initCustomerForm();
        console.log('✅ purchaseMain inicializado correctamente');
    } catch (error) {
        console.error('❌ Error crítico al inicializar ventas:', error);
    }
});

function _initModules() {
    initCustomerModule();
}