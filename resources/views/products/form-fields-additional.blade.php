<div class="row">
    <div class="col-12">
        <!-- Comentario -->
        <div class="mb-3">
            <label for="product_description" class="form-label">Comentario</label>
            <textarea class="form-control" id="product_description" name="product_description" rows="3"></textarea>
        </div>
    </div>

    <div class="col-4">
        <div class="form-check checkbox checkbox-secondary mb-0">

            <!--CHECK PARA EL PRECIO NETO DEL PRODUCTO-->
            <input class="form-check-input"
                id="is_fractional"
                name="is_fractional"
                value="1"
                type="checkbox">
            <label class="form-check-label" for="is_fractional">Se vende por fraccion</label>

        </div>
    </div>

    <div class="col-3">
        <div class="mb-3">
            <label for="stock_min">Stock minimo</label>
            <input type="number"
                class="form-control only-numbers @error('stock_min') is-invalid @enderror"
                name="stock_min"
                id="stock_min"
                value="{{ old('stock_min') }}">
            @error('stock_min')
            <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>

    </div>

    <div class="col-3">
        <div class="mb-3">
            <label for="stock_max">Stock maximo</label>
            <input type="number"
                class="form-control only-numbers @error('stock_max') is-invalid @enderror"
                name="stock_max"
                id="stock_max"
                value="{{ old('stock_max') }}">
            @error('stock_max')
            <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>

    </div>

</div>