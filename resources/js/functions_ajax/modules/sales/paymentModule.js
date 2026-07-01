import { showAlert } from '../../utils/alerts';
import { initCreditTermsAndDate } from '../../helpers/customerHelper';
import { SALES_CONFIG as CONFIG } from '../../helpers/SalesHelper';
import {
    BASE_PAYMENT_CONFIG, bindPaymentEvents, resetPaymentFields,
    configurePaymentFields, sendPayment, getTotalAmount,
    getCreditAvailable, parseErrorMessage, getSelectedPaymentMethod, sumPaymentMethods,
} from '../../helpers/paymentHelper';
import { getTableDetails, loadTotals, showTotals, cleanInputSale, applyDiscount } from './detailModule';
import { getCurrentCustomerId, getCurrentCustomerData } from './customerModule';

const PAYMENT_CONFIG = {
    ...BASE_PAYMENT_CONFIG,
    selectors: {
        ...BASE_PAYMENT_CONFIG.selectors,
        tempId: '#temp_sale_id',
        entityId: '#customer_id',
        creditLimit: '.credit-limit-customer',
    },
    api: {
        processUrl: '/temp_sales_detail/processPayment',
    },
};

// =========================================
// INICIALIZACIÓN
// =========================================

export function initPaymentModule() {
    try {
        bindPaymentEvents(PAYMENT_CONFIG, {
            openModal: _openPaymentModal,
            processPayment: _processSaleByMethod,
            initCreditDate: initCreditTermsAndDate,
        });
        console.log('✅ Módulo de pagos inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar módulo de pagos:', error);
    }
}

// =========================================
// ABRIR MODAL DE PAGO
// =========================================

function _openPaymentModal() {
    const sel = PAYMENT_CONFIG.selectors;
    const customerId = getCurrentCustomerId();
    const table = getTableDetails();

    if (!customerId || customerId == 0) {
        showAlert('warning', 'Alerta', CONFIG.messages.noCustomer);
        return;
    }

    if (!table || table.rows().count() === 0) {
        showAlert('warning', 'Alerta', CONFIG.messages.noProducts);
        return;
    }

    _prefillPaymentModal();
    $(sel.modal).modal('show');
}

function _prefillPaymentModal() {
    const sel = PAYMENT_CONFIG.selectors;
    const total = getTotalAmount(PAYMENT_CONFIG);
    const customerData = getCurrentCustomerData();

    const creditLimit = parseFloat(customerData?.credit_limit) || 0;
    const creditAvailable = parseFloat(customerData?.credit_available) || 0;
    const creditDays = customerData?.grace_period_days || 30;
    console.log(customerData);
    $(sel.paymentCash).val(total > 0 ? total.toFixed(2) : '0.00');
    $(sel.creditPaymentInput).val(total > 0 ? total.toFixed(2) : '0.00');
    $(sel.creditLimitInput).val(creditLimit.toFixed(2));
    $(sel.creditAvailableInput).val(creditAvailable.toFixed(2));

    initCreditTermsAndDate(sel.creditDaysInput, sel.dueDateInput, creditDays);

    $(sel.creditDaysInput).prop('disabled', true);
    $(sel.dueDateInput).prop('disabled', true);
    $(sel.creditPaymentInput).prop('disabled', true);
}

// =========================================
//  EJECUTAR PAGO - funcion privada compartida
// =========================================
function _executeSalePayment(method) {
    const sel = PAYMENT_CONFIG.selectors;
    const saleData = _getSaleDetails(method);
    // Quitar el readonly del campo de número de comprobante antes de enviar la solicitud
    $(sel.invoiceNumber).prop('readonly', false);

    const printWindow = window.open(
        '',
        'printReceipt',
        'width=600,height=600,left=200,top=80,toolbar=no,menubar=no,scrollbars=yes,resizable=yes'
    );

    sendPayment(PAYMENT_CONFIG, method, saleData, {
        onSuccess: (response) => {

            showAlert('success', 'Éxito', response.message || 'Venta procesada correctamente.');

            const saleId = response.sale_id;
            const voucherId = parseInt($('#voucher-type').val()); // El comprobante seleccionado

            if (response.data?.new_temp_sale_id) {
                $(sel.tempId).val(response.data.new_temp_sale_id);
            }

            if (printWindow && !printWindow.closed) {
                printWindow.location.href = `/sales/${response.sale_id}/receipt/${voucherId}/preview`;
            } else {
                showAlert('warning', 'Ventana bloqueada', 'Habilita las ventanas emergentes para ver el ticket.');
            }
            
            setTimeout(() => {
                cleanInputSale();
                applyDiscount(0);
                location.reload();
                $(sel.invoiceNumber).prop('readonly', true);
            }, 1500);

        },
    });
}

// =========================================
// PROCESAR VENTA
// =========================================
function _processSaleByMethod(method) {
    const sel = PAYMENT_CONFIG.selectors;
    const invoiceNumber = $(sel.invoiceNumber).val();

    if (!invoiceNumber) {
        showAlert('warning', 'Alerta', 'Por favor, ingresa el número de comprobante.');
        $(sel.modal).modal('hide');
        $(sel.invoiceNumber).trigger('focus').trigger('select');
        return;
    }

    // Obtiene el total de la venta y el total pagado por los métodos de pago
    const total = getTotalAmount(PAYMENT_CONFIG);
    const totalPaid = sumPaymentMethods(PAYMENT_CONFIG);

    if (PAYMENT_CONFIG.methods.CREDIT === method && getCurrentCustomerId() === '1') {
        showAlert('warning', 'Alerta', 'No se puede procesar una venta a crédito a público en general.');
        return;
    }

    if (totalPaid < total && method !== PAYMENT_CONFIG.methods.CREDIT) {
        showAlert('warning', 'Alerta', 'El monto pagado es menor al total de la venta.');
        return;
    }

    if (totalPaid > total) {
        const change = (totalPaid - total).toFixed(2);
        $('.info-change-sale').text(`$ ${change}`);
        $(sel.modal).modal('hide');
        $('#modal-change').modal('show');
        return;
    }

    // Si el total pagado es igual al total, procesar la venta directamente
    _executeSalePayment(method);

}

// =========================================
// CONFIRMAR DESDE EL MODAL DE CAMBIO
// =========================================

// botón de confirmar desde el modal de cambio
$('#btn-confirm-change').on('click', function () {
    const method = getSelectedPaymentMethod(PAYMENT_CONFIG);
    _executeSalePayment(method);
})

// Tecla Enter en el modal de cambio
$('#modal-change').on('keypress', function (e) {
    if (e.which === 13) { // Enter key
        e.preventDefault();
        $('#btn-confirm-change').trigger('click');
    }
});

// Enfocar el botón al abrir el modal para que Enter funcione inmediatamente
$('#modal-change').on('shown.bs.modal', function () {
    $('#btn-confirm-change').trigger('focus');
});

// =========================================
// OBTENER DETALLES DE LA VENTA
// =========================================
function _getSaleDetails(method) {
    const sel = PAYMENT_CONFIG.selectors;

    const data = {
        id_customer: $(sel.entityId).val(),
        id_voucher: $(sel.voucherType).val() || '',
        id_document: $(sel.documentType).val() || '',
        invoice_number: $(sel.invoiceNumber).val() || '',
        date: $(sel.operationDate).val() || '',
        amount_paid: (parseFloat($(sel.paymentCash).val()) || 0) + (parseFloat($(sel.paymentCard).val()) || 0) + (parseFloat($(sel.paymentTransfer).val()) || 0) + (parseFloat($(sel.paymentVoucher).val()) || 0),
    };

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

// =========================================
// GETTERS PÚBLICOS
// =========================================

export function getPaymentMethods() {
    return PAYMENT_CONFIG.methods;
}