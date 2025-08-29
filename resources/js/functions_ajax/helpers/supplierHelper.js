import { showAlert, showConfirmationAlert, clearValidationErrors, handleValidationError } from '../utils/alerts';

/**
 * Asigna el submit de un formulario de clientes con opciones personalizadas.
 *
 * @param {string} options.formSelector - Selector del formulario
 * @param {string} options.modalSelector - Selector del modal
 * @param {DataTable|null} options.table - Instancia de DataTable a recargar (o null si no hay)
 * @param {Function|null} options.onSuccess - Callback extra después de guardar
 */
export function bindSupplierFormSubmit({
    formSelector = '#supplierForm',
    modalSelector = '#supplierModal',
    table = null,
    onSuccess = null
} = {}) {
    $(formSelector).off('submit').on('submit', function (e) {
        e.preventDefault();

        const $form = $(this);
        const supplierId = $('#supplierId').val();
        const isEdit = supplierId != 0;

        clearValidationErrors();

        const formDataArray = $form.serializeArray();
        const cleanData = {};

        formDataArray.forEach(field => {
            const input = $(`[name="${field.name}"]`);
            let rawValue = field.value;

            // Si el input tiene cleave, obtener el valor limpio
            if (input[0].cleave) {
                rawValue = input[0].cleave.getRawValue();
            }

            switch (field.name) {
                case 'phone':
                    cleanData[field.name] = rawValue.replace(/[^\d]/g, '');
                    break;
                default:
                    cleanData[field.name] = rawValue.trim();
            }
        });

        $.ajax({
            url: isEdit ? `/suppliers/${supplierId}` : $form.data('action'),
            method: isEdit ? 'PUT' : 'POST',
            data: cleanData,
            success: function (response) {
                // Cierra el modal
                $(modalSelector).modal('hide');

                // Si hay DataTable, recargarlo
                if (table) {
                    table.ajax.reload(null, false);
                }

                // Mostrar alerta
                showAlert(
                    'success',
                    'Éxito',
                    response.status === 'create' ? 'Registro creado exitosamente.' : 'Registro actualizado exitosamente.'
                );
                resetSupplierForm();
            },
            error: function (xhr) {
                handleValidationError(xhr);
            }
        });
    });
}

// =========================================
// FUNCIÓN: Para configurar el flatpickr
// =========================================
export function initCreditTermsAndDate(daysSelector, dateSelector, defaultDays = 30) {
    const $daysInput = $(daysSelector);
    const $dateInput = $(dateSelector);

    const today = new Date();

    // Valor inicial de días
    let initialDays = parseInt($daysInput.val()) || defaultDays;

    // Calcular fecha inicial con base en los días
    const initialDate = new Date(today);
    initialDate.setDate(today.getDate() + initialDays);

    // ⚡ Usamos [0] para obtener el elemento DOM nativo
    const fp = flatpickr($dateInput[0], {
        dateFormat: "Y-m-d",
        minDate: today,              // no permite antes de hoy
        defaultDate: initialDate,    // hoy + defaultDays
        altFormat: "d M, Y",
        onChange: function (selectedDates) {
            if (selectedDates.length > 0) {
                const selectedDate = selectedDates[0];
                const diffTime = selectedDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                $daysInput.val(diffDays);
            }
        }
    });

    // Escuchar cambios en input días -> actualizar fecha
    $daysInput.on("input", function () {
        const days = parseInt($(this).val());
        if (!isNaN(days) && days > 0) {
            const newDate = new Date(today);
            newDate.setDate(today.getDate() + days);
            fp.setDate(newDate, true);
        }
    });
}

// =========================================
// FUNCIÓN: Maneja eventos de cierre del modal
// =========================================

/**
 * Confirma el cierre del modal si hay datos ingresados.
 */
export function closeSupplierModal() {
    $(document).on('click', '#btn-cancelar-supplier, #btn-close-modal-supplier', function (e) {
        e.preventDefault();

        const hasData = $('#representative').val().trim() !== '' ||
            $('#company_name').val().trim() !== '' ||
            $('#rfc').val().trim() !== '' ||
            $('#phone').val().trim() !== '' ||
            $('#email').val().trim() !== '' ||
            $('#credit_available').val().trim() !== '' ||
            $('#address').val().trim() !== '';

        if (hasData) {
            showConfirmationAlert(
                '¿Estás seguro?',
                'Perderás los datos ingresados.',
                'Sí, cancelar',
                'No, volver',
                (confirmed) => {
                    if (confirmed) {
                        $('#supplierModal').modal('hide');
                        resetSupplierForm();
                    }
                }
            );
        } else {
            $('#supplierModal').modal('hide');
            resetSupplierForm();
        }
    });
}


// =========================================
// FUNCIÓN: Abre el modal de Proveedor
// =========================================

/**
 * Muestra el modal de creación o edición de Proveedor.
 *
 * @param {Object|null} data - Datos del cliente o null si es nuevo.
 */
export function showSupplierModal(data = null) {
    resetSupplierForm();

    if (data) {
        $('.modal-title').text('Editar Proveedor');
        $('#representative').val(data.representative);
        $('#company_name').val(data.company_name);
        $('#rfc').val(data.rfc);
        $('#phone').val(data.phone);
        $('#email').val(data.email);
        $('#credit_available').val(data.credit_available);
        $('#address').val(data.address);
        $('#credit_terms').val(data.credit_terms);
        $('#credit_due_date').val(data.credit_due_date);
        $('#supplierId').val(data.id);
    } else {
        $('.modal-title').text('Agregar Proveedor');
    }
    formatCleave();
    $('#supplierModal').modal('show');
}

// =========================================
// FUNCIÓN: Restablece el formulario del modal
// =========================================

/**
 * Resetea el formulario de Proveedor a su estado inicial.
 */
function resetSupplierForm() {
    $('#supplierForm')[0].reset();
    $('#supplierId').val(0);
    clearValidationErrors();
    $('.modal-title').text('Agregar Proveedor');
}

export function formatCleave() {
    if (document.querySelector("#phone")) {
        var cleaveBlocks = new Cleave('#phone', {
            delimiters: ['(', ')', '-'],
            blocks: [0, 3, 3, 4],
            numericOnly: true
        });
    }

    $('#credit_available').on('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

}