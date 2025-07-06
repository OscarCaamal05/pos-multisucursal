import { showAlert, clearValidationErrors, handleValidationError } from '../utils/alerts';

/**
 * Asigna el submit de un formulario de categoría con opciones personalizadas.
 *
 * @param {Object} options - Opciones de configuración
 * @param {string} options.formSelector - Selector del formulario
 * @param {string} options.modalSelector - Selector del modal
 * @param {DataTable|null} options.table - Instancia de DataTable a recargar (o null si no hay)
 * @param {Function|null} options.onSuccess - Callback extra después de guardar
 */
export function bindCategoryFormSubmit({
    formSelector = '#categoryForm',
    modalSelector = '#categoryModal',
    table = null,
    onSuccess = null
} = {}) {
    $(document).off('submit').on('submit', formSelector, function (e) {
        e.preventDefault();

        const $form = $(this);
        const categoryId = $form.find('#categoryId').val();
        const isEdit = categoryId != 0;

        clearValidationErrors();

        $.ajax({
            url: isEdit ? `/categories/${categoryId}` : $form.data('storeUrl'),
            method: isEdit ? 'PUT' : 'POST',
            data: $form.serialize(),
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
                resetCategoryForm();

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

// =========================================
// FUNCIÓN: Restablece el formulario del modal
// =========================================

/**
 * Resetea el formulario de departamento a su estado inicial.
 */
export function resetCategoryForm() {
    $('#categoryForm')[0].reset();
    $('#categoryId').val(0);
    $('#department_id').val(null).trigger('change');
    clearValidationErrors();
    $('.modal-title').text('Agregar Categoria');
}