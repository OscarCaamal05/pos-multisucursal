// =========================================
// IMPORTACION DE FUNCIONES GENERICAS PARA LAS ALERTAS
// =========================================
import { showAlert, showConfirmationAlert, clearValidationErrors, handleValidationError } from './utils/alerts';
import { bindCategoryFormSubmit, closeCategoryModal, selectCategoryAndDept } from './helpers/categoryHelper';
import { bindDepartmentFormSubmit, closeDepartmentModal } from './helpers/departmentHelper';

// =========================================
// VARIABLES GLOBALES
// =========================================

let categoriesTable = null;

// =========================================
// INICIALIZACIÓN PRINCIPAL
// =========================================
$(document).ready(function () {

    initializeSelect2();
    closeDepartmentModal();
    closeCategoryModal();

    // =========================================
    // Inicializando la funcion para crear o actualizar la categoria
    // =========================================
    /**
     * Recibe parametros del modulo, el form, modal, tabla, y una funcion callback para realizar funciones adicionales
     */
    bindCategoryFormSubmit({
        onSuccess: (response) => {
            // Se crea una nueva categoria y agrega al <select> y se autoselecciona
            if (response.status === 'create' && response.category) {
                selectCategoryAndDept(response.category, '.products_categories', '.products_departments')
            }
        }
    });

    // =========================================
    // Inicializando la funcion para crear o actualizar la el departamento
    // =========================================
    /**
     * Recibe parametros del modulo, el form, modal, tabla, y una funcion callback para realizar funciones adicionales
     */
    bindDepartmentFormSubmit({
        onSuccess: (response) => {
            //Auto completa el select del modal de categorias cuando el registro se crea desde la vista de categoria
            if (response.status === 'create' && response.department) {
                selectDepartmet(response.department, '#department_id');
            }
        }
    });

    // =========================================
    // EVENTO: Abrir el modal de categorias
    // =========================================
    /**
     * Muestra el modal de categorias para crear una nueva categoria desde el modal de producto
     */
    $('#btn-modal-category').on('click', function (e) {
        e.preventDefault();
        $('#categoryModal').modal('show');
        $('.departments').select2({
            dropdownParent: $('#categoryModal'),
        });
    })

    // =========================================
    // EVENTO: Click en el boton dentro del modal de categoria
    // =========================================
    /**
     * Abre el modal de departamento desde el modal de categoria para agregar un nuevo departamento 
     */
    $('#btn-modal-department').on('click', function (e) {
        e.preventDefault();
        $('#departmentModal').modal('show');
    });

})
function initializeSelect2() {
    $('.products_departments').select2({
        dropdownParent: $('#productsModal'),
    });
    $('.products_categories').select2({
        dropdownParent: $('#productsModal'),
    });
}