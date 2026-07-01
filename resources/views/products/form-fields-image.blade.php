<div class="row mt-2 justify-content-center">
    <div class="col-lg-6">
        <div class="justify-content-between d-flex align-items-center mb-3">
            <h5 class="mb-0 pb-1">Imagen del Producto</h5>
        </div>

        <div class="mt-3">
            <div class="card-body" style="min-height: 400px;">
                <!-- Input hidden para controlar eliminación de imagen -->
                <input type="hidden" name="remove_image" id="remove_image" value="0">
                
                <input type="file" 
                       id="product-images-input" 
                       data-pending-image=""
                       class="filepond" 
                       name="image"
                       data-max-file-size="3MB"
                       accept="image/*">
            </div>
        </div>
    </div>
</div>