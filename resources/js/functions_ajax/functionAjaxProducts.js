// =========================================
// IMPORTACION DE FUNCIONES GENERICAS PARA LAS ALERTAS
// =========================================
import { showAlert, showConfirmationAlert, clearValidationErrors, handleValidationError } from './utils/alerts';
import { bindCategoryFormSubmit } from './functionAjaxCategories';

// =========================================
// VARIABLES GLOBALES
// =========================================

let categoriesTable = null;

// =========================================
// INICIALIZACIÓN PRINCIPAL
// =========================================
$(document).ready(function () {
    bindCategoryFormSubmit({
        onSuccess: (response) => {
            // Si creaste una nueva categoría y quieres agregarla al <select>
            if (response.create && response.category) {
                // Agrega y selecciona la nueva categoría
                const newOption = new Option(response.category.name, response.category.id, true, true);
                $('.categories').append(newOption).val(response.category.id).trigger('change');

                // Si el controlador devuelve el departamento relacionado
                if (response.category.department) {
                    const deptId = response.category.department.id;
                    const deptName = response.category.department.name;

                    // Si el departamento no existe en el select, lo agrega
                    if ($('.products_departments option[value="' + deptId + '"]').length === 0) {
                        const newDeptOption = new Option(deptName, deptId, true, true);
                        $('.products_departments').append(newDeptOption);
                    }
                    // Selecciona el departamento correspondiente
                    $('.products_departments').val(deptId).trigger('change');
                }
            }
        }
    });
    initializeSelect2();

    // =========================================
    // EVENTO: Abrir el modal de categorias
    // =========================================
    /**
     * Muestra el modal de categorias para crear una nueva categoria desde el modal de producto
     */
    $('#btn-modal-category').on('click', function (e) {
        e.preventDefault();
        $('#categoryModal').modal('show');
    })
})
function initializeSelect2() {
    $('.products_departments').select2({
        dropdownParent: $('#productsModal'),
    });
    $('.categories').select2({
        dropdownParent: $('#productsModal'),
    });
}