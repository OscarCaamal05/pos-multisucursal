import { showAlert, clearValidationErrors, handleValidationError, showConfirmationAlert } from '../utils/alerts';
/**
 * Asigna el submit de un formulario de departamento con opciones personalizadas.
 *
 * @param {string} options.formSelector - Selector del formulario
 * @param {string} options.modalSelector - Selector del modal
 * @param {DataTable|null} options.table - Instancia de DataTable a recargar (o null si no hay)
 * @param {Function|null} options.onSuccess - Callback extra después de guardar
 */

export function bindProductFormSubmit({
    formSelector = '#productForm',
    modalSelector = '#productsModal',
    table = null,
    onSuccess = null
} = {}) {
    $(formSelector).off('submit').on('submit', function (e) {
        e.preventDefault();

        const $form = $(this);
        const productId = $('#productId').val();
        const isEdit = productId != 0;

        clearValidationErrors();
        const disabledFields = $(this).find(':input:disabled').removeAttr('disabled');
        const formObject = {};

        // Para depurar los datos del formulario
        /*$(this).serializeArray().forEach(({ name, value }) => {
            formObject[name] = value;
        });
        console.log(formObject)*/

        $.ajax({
            url: isEdit ? `/products/${productId}` : $form.data('storeUrl'),
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
                resetProductForm();
                // Re-vuelve a deshabilitar los campos después de serializar
                disabledFields.attr('disabled', 'disabled');

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
export function closeProductModal() {
    $(document).on('click', '#btn-cancelar-product, #btn-close-modal-product', function (e) {
        e.preventDefault();

        //Valida si hay datos ingresados en el formulario de manera dinamica
        const hasData = $('#productForm').find(':input').filter(function () {
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
                        $('#productsModal').modal('hide');
                        resetProductForm();
                    }
                }
            );
        } else {
            $('#productsModal').modal('hide');
            resetProductForm();
        }
    });
}

/**
 * Muestra el modal de creación o edición de producto.
 *
 * @param {Object|null} data - Datos del producto o null si es nuevo.
 */
export function showProductsModal(data = null) {
    resetProductForm();

    if (data) {
        $('#productsModalLabel').text('Editar Producto');
        $('#productId').val(data.id);

        // Mostrar el modal desde aquí
        $('#productsModal').modal('show');

        // Retornar la promesa directamente SIN success/error
        return $.ajax({
            url: `/products/${data.id}/edit`,
            method: 'GET',
            dataType: 'json'
        });
    } else {
        $('#productsModalLabel').text('Agregar departamento');
        $('#productsModal').modal('show');
        return Promise.resolve(null);
    }
}


// =========================================
// FUNCIÓN: Restablece el formulario del modal
// =========================================

/**
 * Resetea el formulario de productos a su estado inicial.
 */
export function resetProductForm() {
    $('#productForm')[0].reset();
    $('#productId').val(0);
    $('#product_department_id').val(1).trigger('change');
    $('#product_category_id').val(1).trigger('change');
    $('#purchase_unit_id').val(1).trigger('change');
    $('#sale_unit_id').val(1).trigger('change');
    clearValidationErrors();
    $('#productsModalLabel').text('Agregar Producto');
}