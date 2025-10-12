import { showAlert, clearValidationErrors, handleValidationError, showConfirmationAlert } from './utils/alerts';
import { calculateUnitPrice, calculateMarginFromSalePrice } from './functionAjaxProducts';
import { makeNumericInput } from './utils/numericInputs';
//import { initCreditTermsAndDate, closeSupplierModal, bindSupplierFormSubmit, formatCleave } from './helpers/supplierHelper';
import { closeProductModal, bindProductFormSubmit } from './helpers/productHelper';
import { closeDepartmentModal, bindDepartmentFormSubmit, selectDepartmet } from './helpers/departmentHelper';
import { closeCategoryModal, bindCategoryFormSubmit, selectCategoryAndDept } from './helpers/categoryHelper';
import { initial } from 'lodash';
import flatpickr from 'flatpickr';


// =========================================
// VARIABLES GLOBALES
// =========================================

let tableDetails = null;
let selectedRowDetail = null;
let productsTable = null;
let salesTable = null;
let customersTable = null;

$(document).ready(function () {
    // Configuración inicial
    initializeDatePicker();
    initializeNumericInputs();
    loadInitalData();
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