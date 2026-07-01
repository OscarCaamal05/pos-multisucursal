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
        const isEdit = supplierId != 0 && supplierId != '0' && supplierId != '';

        clearValidationErrors();

        const formDataArray = $form.serializeArray();
        const cleanData = {};

        formDataArray.forEach(field => {
            const input = $(`[name="${field.name}"]`);
            let rawValue = field.value;

            // Si el input tiene cleave, obtener el valor limpio
            if (input[0] && input[0].cleave) {
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

        const storeUrl = $form.data('store-url') || $form.attr('data-store-url');
        const updateUrlBase = $form.data('update-url-base') || $form.attr('data-update-url-base') || '/suppliers/';

        // Construir la URL
        let url;
        if (isEdit) {
            url = updateUrlBase + supplierId;
        } else {
            url = storeUrl || '/suppliers';
        }

        $.ajax({
            url: url,
            method: isEdit ? 'PUT' : 'POST',
            data: cleanData,
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
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

                // Callback opcional
                if (typeof onSuccess === 'function') {
                    onSuccess(response);
                }

                resetSupplierForm();
            },
            error: function (xhr) {
                console.error('Error en la petición:', xhr);
                console.error('Estado:', xhr.status);
                console.error('Respuesta:', xhr.responseText);

                if (xhr.status === 500) {
                    // Para error 500, intenta parsear la respuesta
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        console.error('Mensaje del servidor:', errorResponse.message);
                        console.error('Archivo:', errorResponse.file);
                        console.error('Línea:', errorResponse.line);
                    } catch (e) {
                        console.error('No se pudo parsear la respuesta de error');
                    }
                }

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

    // Verificar si ya existe una instancia de Flatpickr y destruirla
    const dateElement = $dateInput[0];
    if (dateElement && dateElement._flatpickr) {
        dateElement._flatpickr.destroy();
    }

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

    // Remover event listeners anteriores para evitar duplicados
    $daysInput.off("input.creditTerms");

    // Escuchar cambios en input días -> actualizar fecha
    $daysInput.on("input.creditTerms", function () {
        const days = parseInt($(this).val());
        if (!isNaN(days) && days > 0) {
            const newDate = new Date(today);
            newDate.setDate(today.getDate() + days);
            if (fp && fp.setDate) {
                fp.setDate(newDate, true);
            }
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

        const hasData = $('#supplierForm').find(':input').filter(function () {
            const tag = this.tagName.toLowerCase();
            return tag !== 'select' && $(this).val().trim() !== '' && !$(this).is(':disabled');
        }).length > 0;

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
        $('#supplierId').val(data.id);
        $('#supplierModal').modal('show');

        return $.ajax({
            url: `/suppliers/${data.id}/edit`,
            method: 'GET',
            dataType: 'json'
        });
    } else {
        $('.modal-title').text('Agregar Proveedor');
        $('#supplierModal').modal('show');
        return Promise.resolve(null);
    }
    formatCleave();
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