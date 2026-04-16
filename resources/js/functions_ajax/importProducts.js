import { showAlert, showConfirmationAlert } from './utils/alerts';
$(document).ready(function() {
    
    // Abrir modal de importación
    $('#btn-import-products').on('click', function() {
        $('#importExcelModal').modal('show');
        resetImportForm();
    });

    // Cerrar modal y resetear formulario
    $('#importExcelModal').on('hidden.bs.modal', function() {
        resetImportForm();
    });

    // Manejar el envío del formulario
    $('#importProductsForm').on('submit', function(e) {
        e.preventDefault();

        const fileInput = $('#excel_file')[0];
        const file = fileInput.files[0];

        if (!file) {
            showAlert('error', 'Por favor selecciona un archivo Excel.');
            return;
        }

        // Validar extensión
        const allowedExtensions = ['xlsx', 'xls'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
            showAlert('error', 'El archivo debe ser formato Excel (.xlsx o .xls)');
            return;
        }

        // Preparar FormData
        const formData = new FormData(this);

        // Mostrar progreso
        $('#upload-progress').show();
        $('#btn-submit-import').prop('disabled', true);
        updateProgress(0);

        // Enviar archivo
        $.ajax({
            url: '/products/import',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                const xhr = new window.XMLHttpRequest();
                
                // Progress para upload
                xhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        updateProgress(percentComplete);
                    }
                }, false);

                return xhr;
            },
            success: function(response) {
                updateProgress(100);
                
                if (response.success) {
                    displayImportResults(response);
                    
                    // Recargar la tabla de productos
                    if (typeof window.productTable !== 'undefined') {
                        window.productTable.ajax.reload();
                    }
                    
                    // Limpiar formulario después de 5 segundos
                    /*setTimeout(function() {
                        $('#importProductsModal').modal('hide');
                        resetImportForm();
                    }, 5000);*/
                }
            },
            error: function(xhr) {
                updateProgress(0);
                $('#upload-progress').hide();
                
                let errorMessage = 'Error al importar el archivo.';
                
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    const errors = xhr.responseJSON.errors;
                    errorMessage += '<ul class="mb-0 ps-3">';
                    
                    if (errors.excel_file) {
                        errors.excel_file.forEach(err => {
                            errorMessage += `<li>${err}</li>`;
                        });
                    }
                    
                    errorMessage += '</ul>';
                }
                
                showAlert('error', errorMessage);
                $('#btn-submit-import').prop('disabled', false);
            }
        });
    });

    // Función para actualizar barra de progreso
    function updateProgress(percent) {
        const progressBar = $('#upload-progress .progress-bar');
        progressBar.css('width', percent + '%');
        progressBar.find('.progress-text').text(Math.round(percent) + '%');
    }

    // Función para mostrar resultados de importación
    function displayImportResults(response) {
        let html = '<div class="alert alert-success" role="alert">';
        html += '<h6 class="alert-heading"><i class="ri-checkbox-circle-line me-2"></i>Importación Completada</h6>';
        html += '<ul class="mb-0">';
        html += `<li><strong>${response.imported}</strong> productos importados correctamente</li>`;
        
        if (response.skipped > 0) {
            html += `<li><strong>${response.skipped}</strong> productos omitidos por errores</li>`;
        }
        
        html += `<li><strong>Total procesado:</strong> ${response.total} registros</li>`;
        html += '</ul>';
        html += '</div>';

        // Mostrar errores si existen
        if (response.errors && response.errors.length > 0) {
            html += '<div class="alert alert-warning mt-3" role="alert">';
            html += '<h6 class="alert-heading"><i class="ri-error-warning-line me-2"></i>Errores Encontrados:</h6>';
            html += '<div style="max-height: 200px; overflow-y: auto;">';
            html += '<ul class="mb-0 small">';
            
            response.errors.forEach(function(error) {
                html += `<li><strong>Fila ${error.row}:</strong> ${error.errors.join(', ')}</li>`;
            });
            
            html += '</ul>';
            html += '</div>';
            html += '</div>';
        }

        $('#import-result').html(html).show();
        $('#upload-progress').hide();
        $('#btn-submit-import').prop('disabled', false);
    }

    // Función para mostrar alertas
    function showAlert(type, message) {
        const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
        const icon = type === 'error' ? 'ri-error-warning-line' : 'ri-checkbox-circle-line';
        
        const html = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="${icon} me-2"></i>${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        $('#import-result').html(html).show();
    }

    // Función para resetear el formulario
    function resetImportForm() {
        $('#importProductsForm')[0].reset();
        $('#import-result').hide().html('');
        $('#upload-progress').hide();
        updateProgress(0);
        $('#btn-submit-import').prop('disabled', false);
        $('#excel_file').removeClass('is-invalid');
    }

    // Validar archivo al seleccionar
    $('#excel_file').on('change', function() {
        const file = this.files[0];
        
        if (file) {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const allowedExtensions = ['xlsx', 'xls'];
            
            if (!allowedExtensions.includes(fileExtension)) {
                $(this).addClass('is-invalid');
                $(this).next('.invalid-feedback').text('El archivo debe ser formato Excel (.xlsx o .xls)');
            } else {
                $(this).removeClass('is-invalid');
            }
        }
    });
});