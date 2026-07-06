import { showAlert, showConfirmationAlert, clearValidationErrors, handleValidationError } from '../utils/alerts';

/**
 * Asigna el submit de un formulario de departamento con opciones personalizadas.
 *
 * @param {string} options.formSelector - Selector del formulario
 * @param {string} options.modalSelector - Selector del modal
 * @param {DataTable|null} options.table - Instancia de DataTable a recargar (o null si no hay)
 * @param {Function|null} options.onSuccess - Callback extra después de guardar
 */
export function bindBranchesFormSubmit({
    formSelector = '#branchForm',
    onSuccess = null
} = {}) {
    $(formSelector).off('submit').on('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const $form = $(this);
        const branchId = $('#branchId').val();
        const isEdit = branchId != 0;
        console.log($form.serialize());
        clearValidationErrors();
        $.ajax({
            url: isEdit ? `/branches/${branchId}` : $form.data('storeUrl'),
            method: isEdit ? 'PUT' : 'POST',
            data: $form.serialize(),
            success: function (response) {

                // Mostrar alerta
                showAlert(
                    'success',
                    'Éxito',
                    response.message
                );

                // Callback extra si se pasa
                if (typeof onSuccess === 'function') {
                    onSuccess(response);
                }
            },
            error: function (xhr) {
                handleValidationError(xhr);
            }
        });
    });
}