import { showAlert } from '../../utils/alerts';
import { initCreditTermsAndDate } from '../../helpers/supplierHelper';
import { PURCHASES_CONFIG as CONFIG } from '../../helpers/PurchasesHelper';
import { getTableDetails, loadTotals, showTotals, cleanInputPurchase, applyDiscount } from './detailModule';
import { getCurrentSupplierId, getCurrentSupplierData } from './supplierModule';

// =========================================
// CONFIGURACIÓN DEL MÓDULO
// =========================================
const PAYMENT_CONFIG = {
    // Identificadores de métodos de pago (coinciden con el atributo id del radio button)
    methods: {
        BOX: 'payment-box',
        CREDIT: 'payment-credit',
    },
    // Grupos de campos por método
    fields: {
        box: ['#payment-cash', '#payment-card', '#payment-transfer', '#payment-voucher'],
        credit: ['#credit-payment', '#grace_period_days', '#due-date'],
        creditDisabled: ['#credit', '#credit_available'],
    },
    selectors: {
        modal: '#modal-payment-detail',
        btnProcess: '#btn-process-purchase',
        btnFinalize: '#btn-finalize-purchase',
        btnCloseModal: '#btn-close-modal-payment',
        paymentMethodRadio: 'input[name="payment_method"]',
        paymentInputs: '.payment_method',
        paymentChange: '.payment-change',
        totalDisplay: '.total',
        creditLimit: '.credit-limit-supplier',
        creditTerms: '.credit-terms',
        creditAvailable: '.credit_supplier',
        creditAvailableInput: '.credit-available',
        creditLimitInput: '#credit-limit',
        creditDaysInput: '#grace_period_days',
        creditPaymentInput: '#credit-payment',
        dueDateInput: '#due-date',
        paymentCash: '#payment-cash',
        paymentCard: '#payment-card',
        paymentTransfer: '#payment-transfer',
        paymentVoucher: '#payment-voucher',
        supplierId: '#supplier_id',
        tempPurchaseId: '#temp_purchase_id',
        // Datos del documento
        voucherType: '#voucher-type',
        documentType: '#document-type',
        invoiceNumber: '#invoice-number',
        purchaseDate: '#purchase-date',
    },
    api: {
        processPurchase: '/temp_purchases_detail/processPurchase',
    }
};

// =========================================
// INICIALIZACIÓN
// =========================================

/**
 * Punto de entrada del módulo. Llamar desde purchaseMain.js
 */
export function initPaymentModule() {
    try {
        bindPaymentEvents();
        console.log('✅ Módulo de pagos inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar módulo de pagos:', error);
    }
}

// =========================================
// EVENTOS
// =========================================

function bindPaymentEvents() {
    const sel = PAYMENT_CONFIG.selectors;

    // ── Abrir modal de pago ───────────────────────────────────────────────
    $(sel.btnProcess).on('click', (e) => {
        e.preventDefault();
        _openPaymentModal();
    });

    // ── Finalizar / procesar compra ───────────────────────────────────────
    $(sel.btnFinalize).on('click', () => {
        const selectedMethod = $(`${sel.paymentMethodRadio}:checked`).attr('id')
            || PAYMENT_CONFIG.methods.BOX;
        _processPurchaseByMethod(selectedMethod);
    });

    // ── Cerrar modal de pago ──────────────────────────────────────────────
    $(sel.btnCloseModal).on('click', () => $(sel.modal).modal('hide'));

    // ── Cambio de método de pago → reconfigurar campos ────────────────────
    $(document).on('change', sel.paymentMethodRadio, function () {
        const selectedMethod = $(this).attr('id');
        _resetPaymentFields();
        _configurePaymentFields(selectedMethod);
    });

    // ── Actualizar cambio al escribir en cualquier campo de pago ──────────
    $(document).on('input', sel.paymentInputs, function () {
        const totalPaid = _sumPaymentMethods();
        const totalFinal = _getTotalAmount();
        const change = (totalPaid - totalFinal).toFixed(2);
        $(sel.paymentChange).html(change);
    });

    // ── Al cerrar el modal → limpiar y restablecer a estado inicial ───────
    $(sel.modal).on('hidden.bs.modal', () => _resetModalState());

    // ── Al abrir el modal → reinicializar flatpickr del crédito ──────────
    $(sel.modal).on('show.bs.modal', () => {
        const creditDays = $(sel.creditTerms).val() || 30;
        initCreditTermsAndDate(sel.creditDaysInput, sel.dueDateInput, creditDays);
    });
}

// =========================================
// ABRIR MODAL DE PAGO
// =========================================

/**
 * Valida las condiciones previas y si todo está bien abre el modal de pago
 * con los valores actuales de la compra precargados.
 */
function _openPaymentModal() {
    const sel = PAYMENT_CONFIG.selectors;
    const supplierId = getCurrentSupplierId();
    const table = getTableDetails();

    // Validar proveedor
    if (!supplierId || supplierId == 0) {
        showAlert('warning', 'Alerta', CONFIG.messages.noSupplier);
        return;
    }

    // Validar productos
    if (!table || table.rows().count() === 0) {
        showAlert('warning', 'Alerta', CONFIG.messages.noProducts);
        return;
    }

    // Precargar valores en el modal
    _prefillPaymentModal();

    $(sel.modal).modal('show');
}

/**
 * Rellena los campos del modal con los valores actuales de la compra.
 */
function _prefillPaymentModal() {
    const sel = PAYMENT_CONFIG.selectors;
    const total = _getTotalAmount();
    const supplierData = getCurrentSupplierData();

    // Datos del proveedor desde localStorage (actualizados al seleccionar el proveedor)
    const creditLimit = parseFloat(supplierData?.credit_limit) || 0;
    const creditAvailable = parseFloat(supplierData?.credit_available) || 0;
    const creditDays = supplierData?.grace_period_days || 30;

    // Precargar campos del modal
    $(sel.paymentCash).val(total > 0 ? total.toFixed(2) : '0.00');
    $(sel.creditPaymentInput).val(total > 0 ? total.toFixed(2) : '0.00');
    $(sel.creditLimitInput).val(creditLimit.toFixed(2));
    $(sel.creditAvailableInput).val(creditAvailable.toFixed(2));

    // Usar los días de crédito del proveedor para inicializar flatpickr
    initCreditTermsAndDate(
        sel.creditDaysInput,
        sel.dueDateInput,
        creditDays
    );

    // Deshabilitar campos de crédito hasta que se seleccione ese método
    $(sel.creditDaysInput).prop('disabled', true);
    $(sel.dueDateInput).prop('disabled', true);
    $(sel.creditPaymentInput).prop('disabled', true);
}

// =========================================
// GESTIÓN DE CAMPOS SEGÚN MÉTODO DE PAGO
// =========================================

/**
 * Deshabilita y limpia todos los campos de pago.
 * Se llama antes de configurar el método seleccionado.
 */
function _resetPaymentFields() {
    PAYMENT_CONFIG.fields.box.forEach(field => {
        $(field).val('0.00').prop('disabled', true);
    });

    PAYMENT_CONFIG.fields.credit.forEach(field => {
        $(field).prop('disabled', true);
    });

    PAYMENT_CONFIG.fields.creditDisabled.forEach(field => {
        $(field).prop('disabled', true);
    });
}

/**
 * Habilita y precarga los campos correspondientes al método seleccionado.
 *
 * @param {string} method - ID del método ('payment-box' | 'payment-credit')
 */
function _configurePaymentFields(method) {
    const sel = PAYMENT_CONFIG.selectors;
    const total = _getTotalAmount();

    if (method === PAYMENT_CONFIG.methods.BOX) {
        // Pago de contado: habilitar todos los campos de caja
        $(sel.paymentCash)
            .val(total > 0 ? total.toFixed(2) : '0.00')
            .prop('disabled', false);

        $(`${sel.paymentCard}, ${sel.paymentTransfer}, ${sel.paymentVoucher}`)
            .val('0.00')
            .prop('disabled', false);

    } else if (method === PAYMENT_CONFIG.methods.CREDIT) {
        // Pago a crédito: habilitar campos de crédito
        PAYMENT_CONFIG.fields.credit.forEach(field => {
            $(field).prop('disabled', false);
        });
    }
}

// =========================================
// PROCESAR COMPRA
// =========================================

/**
 * Recopila los datos y dispara el procesamiento según el método de pago.
 *
 * @param {string} method - ID del método seleccionado
 */
function _processPurchaseByMethod(method) {
    const invoiceNumber = $(PAYMENT_CONFIG.selectors.invoiceNumber).val();
    if (!invoiceNumber) {
        showAlert('warning', 'Alerta', 'Por favor, ingresa el número de factura.');
        $(PAYMENT_CONFIG.selectors.modal).modal('hide');
        $(PAYMENT_CONFIG.selectors.invoiceNumber).trigger('focus').trigger('select');
        return;
    } else {
        const purchaseData = _getPurchaseDetails(method);
        _sendPurchase(method, purchaseData);
    }

}

/**
 * Construye el objeto de datos de la compra según el método de pago activo.
 *
 * @param {string} method - ID del método de pago
 * @returns {Object}
 */
function _getPurchaseDetails(method) {
    const sel = PAYMENT_CONFIG.selectors;

    // Datos comunes a todos los métodos
    const data = {
        id_supplier: $(sel.supplierId).val(),
        id_voucher: $(sel.voucherType).val() || '',
        id_document: $(sel.documentType).val() || '',
        invoice_number: $(sel.invoiceNumber).val() || '',
        date: $(sel.purchaseDate).val() || '',
        amount_paid: _sumPaymentMethods(),
    };

    // Datos específicos del método
    if (method === PAYMENT_CONFIG.methods.BOX) {
        data.payment_details = {
            efectivo: parseFloat($(sel.paymentCash).val()) || 0,
            tarjeta: parseFloat($(sel.paymentCard).val()) || 0,
            transferencia: parseFloat($(sel.paymentTransfer).val()) || 0,
            vale: parseFloat($(sel.paymentVoucher).val()) || 0,
        };
    } else if (method === PAYMENT_CONFIG.methods.CREDIT) {
        data.credit_details = {
            current_credit: $(sel.creditPaymentInput).val() || '0.00',
            credit_days: $(sel.creditDaysInput).val() || 0,
            due_date: $(sel.dueDateInput).val() || '',
        };
    }

    return data;
}

/**
 * Envía los datos de la compra al servidor.
 *
 * @param {string} method  - Método de pago
 * @param {Object} details - Datos de la compra
 */
function _sendPurchase(method, details) {
    const sel = PAYMENT_CONFIG.selectors;

    $.ajax({
        url: PAYMENT_CONFIG.api.processPurchase,
        type: 'POST',
        dataType: 'json',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'),
            method: method,
            data: details,
            temp_id: $(sel.tempPurchaseId).val(),
        },
        success: (response) => {
            if (response.success) {
                showAlert('success', 'Éxito', response.message || 'Compra procesada correctamente.');

                // Actualizar el temp_purchase_id para la siguiente compra
                if (response.new_temp_purchase_id) {
                    $(sel.tempPurchaseId).val(response.new_temp_purchase_id);
                }

                // Esperar la alerta y luego limpiar + recargar
                setTimeout(() => {
                    cleanInputPurchase();
                    applyDiscount(0);
                    location.reload();
                }, 1500);

            } else {
                showAlert('warning', 'Advertencia', response.message || 'No se pudo procesar la compra.');
            }
        },
        error: (xhr) => {
            const errorMsg = _parseErrorMessage(xhr);
            showAlert('error', 'Error', errorMsg);
        }
    });
}

// =========================================
// RESET DEL MODAL AL CERRARSE
// =========================================

/**
 * Restablece todos los campos del modal al estado inicial.
 * Se ejecuta en el evento hidden.bs.modal para dejar todo limpio
 * si el usuario decide no procesar y vuelve a abrir el modal.
 */
function _resetModalState() {
    const sel = PAYMENT_CONFIG.selectors;

    // Limpiar campos de caja
    $(sel.paymentCard).val('0.00');
    $(sel.paymentTransfer).val('0.00');
    $(sel.paymentVoucher).val('0.00');

    // Restablecer radio al método por defecto (contado)
    $(`#${PAYMENT_CONFIG.methods.BOX}`).prop('checked', true);
    $(`#${PAYMENT_CONFIG.methods.CREDIT}`).prop('checked', false);

    // Limpiar campos de crédito
    $(sel.creditPaymentInput).val('0.00');
    $(sel.creditDaysInput).val(30);

    // Destruir flatpickr del campo de fecha para evitar instancias huérfanas
    const dueDateEl = $(sel.dueDateInput)[0];
    if (dueDateEl?._flatpickr) {
        dueDateEl._flatpickr.destroy();
    }
    $(sel.dueDateInput).val('');

    // Cambio visible al 0
    $(sel.paymentChange).html('0.00');

    // Reconfigurar al método por defecto
    _resetPaymentFields();
    _configurePaymentFields(PAYMENT_CONFIG.methods.BOX);
}

// =========================================
// HELPERS DE CÁLCULO
// =========================================

/**
 * Suma todos los campos de pago visibles y activos.
 * @returns {string} Total con 2 decimales
 */
function _sumPaymentMethods() {
    let total = 0;
    $(PAYMENT_CONFIG.selectors.paymentInputs).each(function () {
        total += parseFloat($(this).val()) || 0;
    });
    return total.toFixed(2);
}

/**
 * Lee el total de la compra desde el DOM.
 * @returns {number}
 */
function _getTotalAmount() {
    return parseFloat(
        $(PAYMENT_CONFIG.selectors.totalDisplay).text().replace(/[$,]/g, '')
    ) || 0;
}

/**
 * Lee el crédito disponible del proveedor desde el DOM.
 * @returns {number}
 */
function _getCreditAvailable() {
    return parseFloat(
        $(PAYMENT_CONFIG.selectors.creditAvailable).text().replace(/[$,]/g, '')
    ) || 0;
}

/**
 * Extrae el mensaje de error de una respuesta XHR de forma segura.
 * @param {Object} xhr
 * @returns {string}
 */
function _parseErrorMessage(xhr) {
    try {
        const response = JSON.parse(xhr.responseText);
        if (response.errors) {
            return Object.values(response.errors).flat().join(', ');
        }
        return response.message || 'Error al procesar la compra.';
    } catch {
        return xhr.statusText || 'Error al procesar la compra.';
    }
}

// =========================================
// GETTERS PÚBLICOS
// =========================================

/**
 * Retorna la configuración de métodos de pago.
 * Útil si otros módulos necesitan conocer los IDs de los métodos.
 */
export function getPaymentMethods() {
    return PAYMENT_CONFIG.methods;
}

/**
 * Retorna el método de pago actualmente seleccionado.
 * @returns {string}
 */
export function getSelectedPaymentMethod() {
    return $(`${PAYMENT_CONFIG.selectors.paymentMethodRadio}:checked`).attr('id')
        || PAYMENT_CONFIG.methods.BOX;
}