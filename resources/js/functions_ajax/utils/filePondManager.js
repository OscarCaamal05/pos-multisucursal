// =========================================
// GESTOR DE INSTANCIAS DE FILEPOND
// Sistema centralizado para manejar múltiples instancias
// =========================================

// Almacén de instancias por ID
const filePondInstances = new Map();

/**
 * Registra los plugins de FilePond (solo una vez)
 */
function registerFilePondPlugins() {
    if (typeof FilePond === 'undefined') {
        console.error('❌ FilePond no está cargado');
        return false;
    }

    // Registrar plugins solo si no están registrados
    if (!window._filePondPluginsRegistered) {
        try {
            FilePond.registerPlugin(
                FilePondPluginFileEncode,
                FilePondPluginFileValidateSize,
                FilePondPluginImageExifOrientation,
                FilePondPluginImagePreview
            );
            window._filePondPluginsRegistered = true;
        } catch (error) {
            console.error('❌ Error al registrar plugins:', error);
            return false;
        }
    }
    return true;
}

/**
 * Crea o reinicializa una instancia de FilePond
 * 
 * @param {string} instanceId - ID único para esta instancia (ej: 'product-purchase', 'product-main')
 * @param {string} inputSelector - Selector del input file
 * @param {Object} options - Opciones personalizadas
 * @returns {Object|null} Instancia de FilePond o null si falla
 */
export function initFilePond(instanceId, inputSelector, options = {}) {
    // Registrar plugins
    if (!registerFilePondPlugins()) {
        return null;
    }

    // Obtener el elemento del DOM
    const inputElement = document.querySelector(inputSelector);
    if (!inputElement) {
        return null;
    }

    // Verificar que esté visible
    if (inputElement.offsetParent === null) {
        return null;
    }

    // Destruir instancia previa si existe
    destroyFilePond(instanceId);

    // Extraer callbacks personalizados si existen
    const customOnAddFile = options.onaddfile;
    const customOnRemoveFile = options.onremovefile;

    // Configuración por defecto
    const defaultConfig = {
        allowMultiple: false,
        maxFiles: 1,
        maxFileSize: '3MB',
        acceptedFileTypes: ['image/*'],
        instantUpload: false,

        // Etiquetas en español
        labelIdle: 'Arrastra y suelta tu imagen o <span class="filepond--label-action">Examinar</span>',
        labelFileLoading: 'Cargando',
        labelFileLoadError: 'Error al cargar',
        labelFileProcessing: 'Procesando',
        labelFileProcessingComplete: 'Procesado',
        labelFileProcessingAborted: 'Procesamiento cancelado',
        labelFileProcessingError: 'Error al procesar',
        labelTapToCancel: 'toca para cancelar',
        labelTapToRetry: 'toca para reintentar',
        labelTapToUndo: 'toca para deshacer',
        labelButtonRemoveItem: 'Eliminar',
        labelButtonAbortItemLoad: 'Abortar',
        labelButtonRetryItemLoad: 'Reintentar',
        labelButtonAbortItemProcessing: 'Cancelar',
        labelButtonUndoItemProcessing: 'Deshacer',
        labelButtonRetryItemProcessing: 'Reintentar',
        labelButtonProcessItem: 'Procesar',
        labelFileTypeNotAllowed: 'Tipo de archivo no válido',
        fileValidateTypeLabelExpectedTypes: 'Espera {allButLastType} o {lastType}',
        labelMaxFileSizeExceeded: 'Archivo demasiado grande',
        labelMaxFileSize: 'El tamaño máximo es {filesize}',

        // Configuración visual
        imagePreviewHeight: 450,
        stylePanelLayout: 'integrated',
        stylePanelAspectRatio: '1:1',
        styleLoadIndicatorPosition: 'center bottom',
        styleProgressIndicatorPosition: 'right bottom',
        styleButtonRemoveItemPosition: 'left bottom',
        styleButtonProcessItemPosition: 'right bottom',

        // Eventos combinados: ejecutar callback por defecto + callback personalizado
        onremovefile: (error, file) => {
            const removeInput = document.querySelector(options.removeInputSelector || '#remove_image');
            if (removeInput) removeInput.value = '1';

            // Ejecutar callback personalizado si existe
            if (customOnRemoveFile) {
                customOnRemoveFile(error, file);
            }
        },

        onaddfile: (error, file) => {
            if (!error) {
                const removeInput = document.querySelector(options.removeInputSelector || '#remove_image');
                if (removeInput) removeInput.value = '0';
            }

            // Ejecutar callback personalizado si existe
            if (customOnAddFile) {
                customOnAddFile(error, file);
            }
        },
    };

    // Combinar configuración (sin incluir los callbacks ya manejados)
    const { onaddfile, onremovefile, ...restOptions } = options;
    const finalConfig = { ...defaultConfig, ...restOptions };

    try {
        // Crear instancia
        const pond = FilePond.create(inputElement, finalConfig);

        // Guardar en el mapa
        filePondInstances.set(instanceId, pond);

        return pond;
    } catch (error) {
        console.error(`❌ Error al crear FilePond ${instanceId}:`, error);
        return null;
    }
}

/**
 * Destruye una instancia de FilePond
 * 
 * @param {string} instanceId - ID de la instancia a destruir
 */
export function destroyFilePond(instanceId) {
    if (filePondInstances.has(instanceId)) {
        const pond = filePondInstances.get(instanceId);
        
        try {
            // Verificar que pond existe y tiene el método destroy
            if (pond && typeof pond.destroy === 'function') {
                pond.destroy();
            }
        } catch (error) {
            // Error silencioso al destruir instancia
        } finally {
            // Siempre eliminar del mapa, incluso si la destrucción falló
            filePondInstances.delete(instanceId);
        }
    }
}

/**
 * Obtiene una instancia de FilePond
 * 
 * @param {string} instanceId - ID de la instancia
 * @returns {Object|null} Instancia de FilePond
 */
export function getFilePond(instanceId) {
    return filePondInstances.get(instanceId) || null;
}

/**
 * Obtiene el archivo de una instancia de FilePond
 * 
 * @param {string} instanceId - ID de la instancia
 * @returns {File|null} Archivo seleccionado o null
 */
export function getFilePondFile(instanceId) {
    const pond = getFilePond(instanceId);
    if (pond) {
        const files = pond.getFiles();
        if (files.length > 0) {
            return files[0].file;
        }
    }
    return null;
}

/**
 * Limpia los archivos de una instancia
 * 
 * @param {string} instanceId - ID de la instancia
 */
export function clearFilePondFiles(instanceId) {
    const pond = getFilePond(instanceId);
    if (pond) {
        pond.removeFiles();
    }
}

/**
 * Carga una imagen existente en FilePond
 * 
 * @param {string} instanceId - ID de la instancia
 * @param {string} imagePathOrUrl - Ruta relativa o URL completa de la imagen
 */
export function loadFilePondImage(instanceId, imagePathOrUrl) {
    const pond = getFilePond(instanceId);
    if (!pond) {
        return;
    }

    if (!imagePathOrUrl) {
        return;
    }

    // Validar que el elemento DOM de FilePond aún existe y está visible
    try {
        const pondElement = pond.element;
        if (!pondElement || !pondElement.parentNode || pondElement.offsetParent === null) {
            return; // El elemento fue removido o está oculto
        }
    } catch (error) {
        return; // Error al acceder al elemento
    }

    // Construir URL completa si es una ruta relativa
    let imageUrl = imagePathOrUrl;

    if (!imagePathOrUrl.startsWith('http://') &&
        !imagePathOrUrl.startsWith('https://') &&
        !imagePathOrUrl.startsWith('/')) {
        const baseUrl = window.location.origin;
        imageUrl = `${baseUrl}/storage/${imagePathOrUrl}`;
    } else if (imagePathOrUrl.startsWith('/storage/')) {
        const baseUrl = window.location.origin;
        imageUrl = `${baseUrl}${imagePathOrUrl}`;
    }

    // Limpiar archivos existentes
    try {
        pond.removeFiles();
    } catch (error) {
        return; // Si no se pueden remover archivos, abortar
    }

    // Obtener el nombre del archivo desde la URL
    const fileName = imageUrl.split('/').pop();

    // Cargar imagen como archivo local usando fetch
    fetch(imageUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
        })
        .then(blob => {
            // Verificar nuevamente que la instancia existe antes de agregar
            if (!filePondInstances.has(instanceId)) {
                return Promise.reject('Instance destroyed');
            }
            
            // Crear un archivo desde el blob
            const file = new File([blob], fileName, { type: blob.type });

            // Agregar el archivo a FilePond
            return pond.addFile(file);
        })
        .then(file => {
            $('#remove_image').val('0');
        })
        .catch(error => {
            // Solo intentar fallback si la instancia aún existe
            if (!filePondInstances.has(instanceId)) {
                return;
            }
            
            // Fallback: intentar cargar directamente como URL
            try {
                pond.addFile(imageUrl, {
                    type: 'local',
                    file: {
                        name: fileName,
                        size: 0
                    },
                    metadata: {
                        poster: imageUrl
                    }
                }).then(() => {
                    $('#remove_image').val('0');
                }).catch(err => {
                    // Método alternativo falló
                });
            } catch (fallbackError) {
                // Error al intentar el método alternativo
            }
        });
}

/**
 * Destruye todas las instancias activas
 */
export function destroyAllFilePonds() {
    filePondInstances.forEach((pond, instanceId) => {
        destroyFilePond(instanceId);
    });
}

// Exportar para debugging
export function listActiveInstances() {
    return Array.from(filePondInstances.keys());
}