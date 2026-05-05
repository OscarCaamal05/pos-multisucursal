// =========================================
// CONSTANTES: Configuración base de idioma DataTable
// =========================================
const idiomaEspanolBase = {
    loadingRecords: "Cargando...",
    paginate: {
        first: "Primero",
        last: "Último",
        next: "Siguiente",
        previous: "Anterior"
    },
    processing: "Procesando...",
    search: "Buscar:",
    lengthMenu: "Mostrar _MENU_ registros",
    info: "Mostrando registros del _START_ al _END_ de _TOTAL_ registros",
    zeroRecords: "No se encontraron registros coincidentes",
    emptyTable: "Sin datos disponibles"
};

// =========================================
// FUNCIÓN HELPER: Crear configuración de idioma personalizada
// =========================================
/**
 * Genera una configuración de idioma para DataTable con mensajes personalizados
 * 
 * @param {Object} customMessages - Mensajes a sobrescribir
 * @param {string} customMessages.emptyTable - Mensaje cuando no hay datos
 * @param {string} customMessages.zeroRecords - Mensaje cuando no hay resultados de búsqueda
 * @returns {Object} Configuración completa de idioma
 */
export function getDataTableLanguage(customMessages = {}) {
    return Object.assign({}, idiomaEspanolBase, customMessages);
}