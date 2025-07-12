import { showAlert, clearValidationErrors, handleValidationError } from '../utils/alerts';

/**
 * Asigna el submit de un formulario de departamento con opciones personalizadas.
 *
 * @param {string} options.formSelector - Selector del formulario
 * @param {string} options.modalSelector - Selector del modal
 * @param {DataTable|null} options.table - Instancia de DataTable a recargar (o null si no hay)
 * @param {Function|null} options.onSuccess - Callback extra después de guardar
 */
export function bindDepartmentFormSubmit({
    formSelector = '#departmentForm',
    modalSelector = '#departmentModal',
    table = null,
    onSuccess = null
} = {}) {
    $(formSelector).off('submit').on('submit', function (e) {
        e.preventDefault();

        const $form = $(this);
        const departmentId = $('#departmentId').val();
        const isEdit = departmentId != 0;

        clearValidationErrors();
        console.log('Enviando al bindDepartment');
        $.ajax({
            url: isEdit ? `/departments/${departmentId}` : $form.data('storeUrl'),
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
                resetDepartmentForm();

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
export function closeDepartmentModal() {
    $(document).on('click', '#btn-cancelar-department, #btn-close-modal-department', function (e) {
        e.preventDefault();

        const hasData = $('#department_name').val().trim() !== '' ||
            $('#department_description').val().trim() !== '';

        if (hasData) {
            showConfirmationAlert(
                '¿Estás seguro?',
                'Perderás los datos ingresados.',
                'Sí, cancelar',
                'No, volver',
                (confirmed) => {
                    if (confirmed) {
                        $('#departmentModal').modal('hide');
                        resetDepartmentForm();
                    }
                }
            );
        } else {
            $('#departmentModal').modal('hide');
            resetDepartmentForm();
        }
    });
}


// =========================================
// FUNCIÓN: Abre el modal de departamento
// =========================================

/**
 * Muestra el modal de creación o edición de departamento.
 *
 * @param {Object|null} data - Datos de la departamento o null si es nuevo.
 */
export function showDepartmentModal(data = null) {
    resetDepartmentForm();

    if (data) {
        $('#departmentModalLabel').text('Editar departamento');
        $('#department_name').val(data.department_name);
        $('#department_description').val(data.department_description);
        $('#departmentId').val(data.id);
    } else {
        $('#departmentModalLabel').text('Agregar departamento');
    }

    $('#departmentModal').modal('show');
}

// =========================================
// FUNCIÓN: Restablece el formulario del modal
// =========================================

/**
 * Resetea el formulario de departamento a su estado inicial.
 */
export function resetDepartmentForm() {
    $('#departmentForm')[0].reset();
    $('#departmentId').val(0);
    clearValidationErrors();
    $('#departmentModalLabel').text('Agregar Departamento');
}

/**
 * Agrega y selecciona una departamento en el select.
 * @param {Object} department - Objeto de departamento (debe incluir 'id', 'name')
 * @param {string} departmentSelectSelector - Selector del select de departamentos (ej: '.products_departments')
 */
export function selectDepartmet(department, departmentSelectSelector) {
    const deptId = department.id;
    const deptName = department.department_name;

    // Si el departamento no existe en el select, lo agrega
    if ($(departmentSelectSelector + ' option[value="' + deptId + '"]').length === 0) {
        const newDeptOption = new Option(deptName, deptId, true, true);
        $(departmentSelectSelector).append(newDeptOption).trigger('change');
    } else {
        $(departmentSelectSelector).val(deptId).trigger('change');
    }
}