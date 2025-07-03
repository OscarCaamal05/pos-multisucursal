// =========================================
// FUNCIÓN: Muestra una alerta simple
// =========================================
export function showAlert(icon, title, message) {
    Swal.fire({
        position: 'center',
        icon: icon,
        title: title,
        text: message,
        showConfirmButton: false,
        popup: 'swal2-show',
        timer: 1500
    });
}

// =========================================
// FUNCIÓN: Muestra alerta de confirmación
// =========================================
export function showConfirmationAlert(title, message, confirmText, cancelText, callback = () => {}) {
    Swal.fire({
        title: title,
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        customClass: {
            confirmButton: 'btn btn-primary w-xs me-2 mb-1',
            cancelButton: 'btn btn-danger w-xs mb-1',
        },
        buttonsStyling: false
    }).then((result) => {
        callback(result.isConfirmed);
    });
}

// =========================================
// FUNCIÓN: Limpia errores de validación
// =========================================
export function clearValidationErrors() {
    $('.is-invalid').removeClass('is-invalid');
    $('.invalid-feedback').remove();
}

// =========================================
// FUNCIÓN: Maneja errores de validación
// =========================================

/**
 * Muestra los mensajes de error si ocurre un error de validación.
 *
 * @param {Object} xhr - Objeto XMLHttpRequest
 */
export function handleValidationError(xhr) {
    if (xhr.status === 422) {
        const errors = xhr.responseJSON.errors;
        const firstError = Object.values(errors)[0][0];

        showAlert({
            icon: 'error',
            title: 'Error',
            text: firstError
        });

        $.each(errors, function (key, messages) {
            const $input = $('[name="' + key + '"]');
            $input.addClass('is-invalid');
            $input.after('<div class="invalid-feedback">' + messages[0] + '</div>');
        });
    } else {
        showAlert({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al procesar la solicitud.'
        });
    }
}
