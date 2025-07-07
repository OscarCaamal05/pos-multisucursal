import { showAlert, clearValidationErrors, handleValidationError } from '../utils/alerts';

/**
 * Asigna el submit de un formulario de categoría con opciones personalizadas.
 *
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
    $(formSelector).off('submit').on('submit', function (e) {
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
// FUNCIÓN: Maneja eventos de cierre del modal
// =========================================

/**
 * Confirma el cierre del modal si hay datos ingresados.
 */
export function closeCategoryModal() {
    $(document).on('click', '#btn-cancelar-category, #btn-close-modal-category', function (e) {
        e.preventDefault();

        const hasData = $('#category_name').val().trim() !== '' ||
            $('#category_description').val().trim() !== '';

        if (hasData) {
            showConfirmationAlert(
                '¿Estás seguro?',
                'Perderás los datos ingresados.',
                'Sí, cancelar',
                'No, volver',
                (confirmed) => {
                    if (confirmed) {
                        $('#categoryModal').modal('hide');
                        resetCategoryForm();
                    }
                }
            );
        } else {
            $('#categoryModal').modal('hide');
            resetCategoryForm();
        }
    });
}

// =========================================
// FUNCIÓN: Abre el modal de categorias
// =========================================

/**
 * Muestra el modal de creación o edición de categorias.
 *
 * @param {Object|null} data - Datos de la categorias o null si es nuevo.
 */
export function showCategoryModal(data = null) {
    resetCategoryForm();

    if (data) {
        $('#categoryModalLabel').text('Editar Categoria');
        $('#category_name').val(data.category_name);
        $('#category_description').val(data.category_description);
        $('#department_id').val(data.department_id).trigger('change');
        $('#categoryId').val(data.id);
    } else {
        $('#categoryModalLabel').text('Agregar Categoria');
    }

    $('#categoryModal').modal('show');
}
// =========================================
// FUNCIÓN: Restablece el formulario del modal
// =========================================

/**
 * Resetea el formulario de categorias a su estado inicial.
 */
export function resetCategoryForm() {
    $('#categoryForm')[0].reset();
    $('#categoryId').val(0);
    $('#department_id').val(null).trigger('change');
    clearValidationErrors();
    $('#categoryModalLabel').text('Agregar Categoria');
}