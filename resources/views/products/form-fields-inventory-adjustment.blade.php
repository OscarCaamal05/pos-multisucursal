<div class="row">
    <div class="col-12">
        <div class="mb-3 d-flex justify-content-center align-items-center">
            <h5 class="title" id="name_product_adjustment"></h5>
        </div>
    </div>
    <div class="col-6">
        <div class="mb-3">
            <label for="adjustment_type" class="form-label">Tipo de Ajuste</label>
            <select select class="form-control" data-plugin="choices" data-choices data-choices-search-false name="adjustment_type" id="adjustment_type">
                <option value="entrada">ENTRADA</option>
                <option value="salida">SALIDA</option>
                <option value="ajuste">AJUSTE</option>
            </select>
        </div>
    </div>

    <div class="col-6">
        <div class="mb-3">
            <label for="adjustment_quantity" class="form-label">Cantidad</label>
            <input type="number" step="0.01" class="form-control" id="adjustment_quantity" name="adjustment_quantity">
        </div>
    </div>

    <div class="col-12">
        <!-- Comentario -->
        <div class="mb-3">
            <label for="adjustment_comment" class="form-label">Comentario</label>
            <textarea class="form-control" id="adjustment_comment" name="adjustment_comment" rows="3"></textarea>
        </div>

        <div class="mb-3">
            <span class="text-muted">* El campo "Comentario" es opcional, pero se recomienda proporcionar una explicación para el ajuste realizado.</span>
        </div>

        <div class="mb-3">
            <label for="current_stock" class="form-label">Stock Actual: <span id="current_stock_value">0</span></label>
        </div>
    </div>

</div>