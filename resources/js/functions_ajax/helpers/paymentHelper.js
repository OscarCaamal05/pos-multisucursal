import { showAlert } from '../utils/alerts';
// =========================================
// CONFIGURACIÓN BASE COMPARTIDA
// =========================================

/**
 * Configuración base para los módulos de pago.
 * Cada módulo puede extenderla sobreescribiendo solo lo que necesite.
 */
export const BASE_PAYMENT_CONFIG = {
    methods: {
        BOX: 'payment-box',
        CREDIT: 'payment-credit',
    },
    fields: {
        box: ['#payment-cash', '#payment-card', '#payment-transfer', '#payment-voucher'],
        credit: ['#credit-payment', '#grace_period_days', '#due-date'],
        creditDisabled: ['#credit', '#credit_available'],
    },
    selectors: {
        modal: '#modal-payment-detail',
        btnProcess: '#btn-modal-payment',
        btnFinalize: '#btn-process-payment',
        btnCloseModal: '#btn-close-modal-payment',
        paymentMethodRadio: 'input[name="payment_method"]',
        paymentInputs: '.payment_method',
        paymentChange: '.payment-change',
        totalDisplay: '.total',
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
        voucherType: '#voucher-type',
        documentType: '#document-type',
        invoiceNumber: '#current-number',
        operationDate: '#date-operation',
    },
    api: {
        processUrl: '/temp_sales_detail/processPayment',
    }
};

// =========================================
// EVENTOS
// =========================================

/**
 * Registra todos los eventos del modal de pago.
 *
 * @param {Object}   config                    - PAYMENT_CONFIG del módulo que llama
 * @param {Object}   callbacks                 - Funciones específicas del dominio
 * @param {Function} callbacks.openModal       - Lógica para abrir/validar el modal
 * @param {Function} callbacks.processPayment  - Lógica para procesar el pago (recibe el method ID)
 * @param {Function} callbacks.initCreditDate  - initCreditTermsAndDate del helper del dominio
 */
export function bindPaymentEvents(config, callbacks) {
    const sel = config.selectors;

    // ── Abrir modal de pago ───────────────────────────────────────────────
    $(sel.btnProcess).on('click', (e) => {
        e.preventDefault();
        callbacks.openModal();
    });

    // ── Abrir modal de pago con la tecla 'ESC' ───────────────────────────────────────────────
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = $(sel.modal);
            if (!modal.hasClass('show')) {
                callbacks.openModal();
            }
        }
    });

    // ── Finalizar / procesar ──────────────────────────────────────────────
    $(sel.btnFinalize).on('click', () => {
        const selectedMethod = $(`${sel.paymentMethodRadio}:checked`).attr('id')
            || config.methods.BOX;
        callbacks.processPayment(selectedMethod);
    });

    // ── Finalizar / procesar con la tecla 'Enter' ──────────────────────────────────────────────
    $(sel.modal).on('keypress', function (e) {
        if (e.key === 'Enter') {
            const selectedMethod = $(`${sel.paymentMethodRadio}:checked`).attr('id')
                || config.methods.BOX;
            callbacks.processPayment(selectedMethod);
        }
    });

    // ── Cerrar modal ──────────────────────────────────────────────────────
    $(sel.btnCloseModal).on('click', () => $(sel.modal).modal('hide'));

    // ── Cambio de método → reconfigurar campos ────────────────────────────
    $(document).on('change', sel.paymentMethodRadio, function () {
        const selectedMethod = $(this).attr('id');
        resetPaymentFields(config);
        configurePaymentFields(selectedMethod, config);
    });

    // ── Actualizar cambio al escribir en campos de pago ───────────────────
    $(document).on('input', sel.paymentInputs, function () {
        const totalPaid = sumPaymentMethods(config);
        const totalFinal = getTotalAmount(config);
        const change = (totalPaid - totalFinal).toFixed(2);
        $(sel.paymentChange).html(change);
    });

    // ── Al cerrar el modal → limpiar y restablecer ────────────────────────
    $(sel.modal).on('hidden.bs.modal', () => resetModalState(config));

    // ── Al abrir el modal → reinicializar flatpickr del crédito ──────────
    $(sel.modal).on('show.bs.modal', () => {
        const creditDays = $(sel.creditTerms).val() || 30;
        callbacks.initCreditDate(sel.creditDaysInput, sel.dueDateInput, creditDays);
    });
}

// =========================================
// GESTIÓN DE CAMPOS SEGÚN MÉTODO DE PAGO
// =========================================

/**
 * Deshabilita y limpia todos los campos de pago.
 * Llamar antes de configurar el método seleccionado.
 *
 * @param {Object} config - PAYMENT_CONFIG del módulo
 */
export function resetPaymentFields(config) {
    config.fields.box.forEach(field => {
        $(field).val('0.00').prop('disabled', true);
    });

    config.fields.credit.forEach(field => {
        $(field).prop('disabled', true);
    });

    config.fields.creditDisabled.forEach(field => {
        $(field).prop('disabled', true);
    });
}

/**
 * Habilita y precarga los campos del método de pago seleccionado.
 *
 * @param {string} method  - ID del método ('payment-box' | 'payment-credit')
 * @param {Object} config  - PAYMENT_CONFIG del módulo
 */
export function configurePaymentFields(method, config) {
    const sel = config.selectors;
    const total = getTotalAmount(config);

    if (method === config.methods.BOX) {
        $(sel.paymentCash)
            .val(total > 0 ? total.toFixed(2) : '0.00')
            .prop('disabled', false);

        $(`${sel.paymentCard}, ${sel.paymentTransfer}, ${sel.paymentVoucher}`)
            .val('0.00')
            .prop('disabled', false);

    } else if (method === config.methods.CREDIT) {
        config.fields.credit.forEach(field => {
            $(field).prop('disabled', false);
        });
    }
}

// =========================================
// RESET DEL MODAL AL CERRARSE
// =========================================

/**
 * Restablece todos los campos del modal al estado inicial.
 *
 * @param {Object} config - PAYMENT_CONFIG del módulo
 */
export function resetModalState(config) {
    const sel = config.selectors;

    $(sel.paymentCard).val('0.00');
    $(sel.paymentTransfer).val('0.00');
    $(sel.paymentVoucher).val('0.00');

    $(`#${config.methods.BOX}`).prop('checked', true);
    $(`#${config.methods.CREDIT}`).prop('checked', false);

    $(sel.creditPaymentInput).val('0.00');
    $(sel.creditDaysInput).val(30);

    const dueDateEl = $(sel.dueDateInput)[0];
    if (dueDateEl?._flatpickr) {
        dueDateEl._flatpickr.destroy();
    }
    $(sel.dueDateInput).val('');

    $(sel.paymentChange).html('0.00');

    resetPaymentFields(config);
    configurePaymentFields(config.methods.BOX, config);
}

// =========================================
// ENVÍO AL SERVIDOR
// =========================================

/**
 * Envía los datos de la transacción al servidor vía AJAX.
 *
 * @param {Object}   config              - PAYMENT_CONFIG del módulo
 * @param {string}   method              - ID del método de pago
 * @param {Object}   details             - Datos de la transacción
 * @param {Object}   callbacks
 * @param {Function} callbacks.onSuccess - Se ejecuta cuando la respuesta es exitosa
 * @param {Function} callbacks.onError   - (opcional) Manejo de error personalizado
 */
export function sendPayment(config, method, details, callbacks) {
    const sel = config.selectors;

    $.ajax({
        url: config.api.processUrl,
        type: 'POST',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'),
            method: method,
            data: details,
            temp_id: $(sel.tempId).val(),
        },
        success: (response) => {
            if (response.status === 'success') {
                callbacks.onSuccess(response);
            } else {
                showAlert('warning', 'Advertencia', response.message || 'No se pudo procesar la solicitud.');
            }
        },
        error: (xhr) => {
            const errorMsg = parseErrorMessage(xhr);
            const customError = callbacks.onError?.(xhr, errorMsg);
            if (!customError) {
                showAlert('error', 'Error', errorMsg);
            }
        }
    });
}

// =========================================
// HELPERS DE CÁLCULO
// =========================================

/**
 * Suma todos los campos de pago visibles y activos.
 *
 * @param {Object} config
 * @returns {number}
 */
export function sumPaymentMethods(config) {
    let total = 0;

    $(config.selectors.paymentInputs).each(function () {
        const value = parseFloat($(this).val()) || '0.00';
        total += value;
    });
    return parseFloat(total.toFixed(2));
}

/**
 * Lee el total de la transacción desde el DOM.
 *
 * @param {Object} config
 * @returns {number}
 */
export function getTotalAmount(config) {

    const raw = parseFloat(
        $(config.selectors.totalDisplay).text().replace(/[$,]/g, '')
    ) || 0;
    
    return parseFloat(raw.toFixed(2));
}

/**
 * Lee el crédito disponible desde el DOM.
 *
 * @param {Object} config
 * @returns {number}
 */
export function getCreditAvailable(config) {
    
    const raw = parseFloat(
        $(config.selectors.creditAvailable).text().replace(/[$,]/g, '')
    ) || 0;

    return parseFloat(raw.toFixed(2));
}

/**
 * Extrae el mensaje de error de una respuesta XHR de forma segura.
 *
 * @param {Object} xhr
 * @returns {string}
 */
export function parseErrorMessage(xhr) {
    try {
        const response = JSON.parse(xhr.responseText);
        if (response.errors) {
            return Object.values(response.errors).flat().join(', ');
        }
        return response.message || 'Error al procesar la solicitud.';
    } catch {
        return xhr.statusText || 'Error al procesar la solicitud.';
    }
}

// =========================================
// GETTERS PÚBLICOS
// =========================================

/**
 * Retorna el método de pago actualmente seleccionado.
 *
 * @param {Object} config
 * @returns {string}
 */
export function getSelectedPaymentMethod(config) {
    return $(`${config.selectors.paymentMethodRadio}:checked`).attr('id')
        || config.methods.BOX;
}