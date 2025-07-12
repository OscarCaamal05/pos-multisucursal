<div class="row">

    <div class="col-5">

        <div class="mb-3">
            <label for="product_name">Descripción</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('product_name') is-invalid @enderror"
                    name="product_name"
                    id="product_name"
                    value="{{ old('product_name') }}">
                <i class="ri-contacts-line"></i>
                @error('product_name')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>

    </div>

    <div class="col-5">

        <div class="mb-3">
            <label for="barcode">Código de barra</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('barcode') is-invalid @enderror"
                    name="barcode"
                    id="barcode"
                    value="{{ old('barcode') }}">
                <i class="ri-contacts-line"></i>
                @error('barcode')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>

    </div>

    <div class="col-2">

        <div class="mb-3">
            <div class="form-check form-check-outline form-check-secondary mb-3">
                <input class="form-check-input"
                    type="checkbox"
                    id="is_service"
                    value="1"
                    name="is_service">
                <label class="form-check-label" for="is_service">
                    Servicio
                </label>
            </div>
        </div>

    </div>

    <div class="col-3">

        <div class="mb-3">
            <label for="product_category_id">Categoria</label>
            <select
                name="product_category_id"
                id="product_category_id"
                class="products_categories form-select @error('product_category_id') is-invalid @enderror">
                @foreach ($categories as $category)
                <option value="{{ $category->id }}" data-department-id="{{ $category->department_id }}">
                    {{ $category->category_name }}
                </option>
                @endforeach
            </select>
            @error('product_category_id') <div class="invalid-feedback">{{ $message }}</div> @enderror
        </div>

    </div>

    <div class="col-auto d-flex align-items-center">
        <button type="button" class="btn btn-light btn-icon waves-effect" id="btn-modal-category"><i class="bx bx-plus-medical"></i></button>
    </div>

    <div class="col-3">

        <div class="mb-3">
            <label for="product_department_id">Departamento</label>
            <select name="product_department_id"
                id="product_department_id"
                class="products_departments form-select @error('product_department_id') is-invalid @enderror">
                @foreach ($departments as $department)
                <option value="{{ $department->id }}">
                    {{ $department->department_name }}
                </option>
                @endforeach
            </select>
            @error('product_department_id') <div class="invalid-feedback">{{ $message }}</div> @enderror
        </div>

    </div>
    <div class="col-2">

        <div class="mb-3">
            <label for="purchase_unit_id">Unidad de compra</label>
            <select name="purchase_unit_id"
                id="purchase_unit_id"
                class="purchase_unit form-select @error('purchase_unit_id') is-invalid @enderror">
                @foreach ($units as $unit)
                <option value="{{ $unit->id }}">
                    {{ $unit->name }}
                </option>
                @endforeach
            </select>
            @error('purchase_unit_id') <div class="invalid-feedback">{{ $message }}</div> @enderror
        </div>

    </div>
    <div class="col-2">

        <div class="mb-3">
            <label for="sale_unit_id">Unidad de venta</label>
            <select name="sale_unit_id"
                id="sale_unit_id"
                class="sale_unit form-select @error('sale_unit_id') is-invalid @enderror">
                @foreach ($units as $unit)
                <option value="{{ $unit->id }}">
                    {{ $unit->name }}
                </option>
                @endforeach
            </select>
            @error('sale_unit_id') <div class="invalid-feedback">{{ $message }}</div> @enderror
        </div>

    </div>

    <div class="col-auto col-sm-1">

        <div class="mb-3">
            <label for="conversion_factor">Factor</label>

            <input type="text"
                class="form-control only-numbers @error('conversion_factor') is-invalid @enderror text-end"
                name="conversion_factor"
                id="conversion_factor"
                value="{{ old('conversion_factor', '1') }}">
            @error('conversion_factor')
            <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>

    </div>

    <div class="pb-2 mb-3 text-muted border-bottom border-light text-center">
        Precios de venta
    </div>

    <div class="row d-flex justify-content-center align-items-center">

        <div class="d-flex justify-content-center align-items-center col-auto px-3 mb-2">

            <div class="form-check checkbox checkbox-secondary mb-0">
                <!--CHECK PARA CALCULAR EL IVA PRODUCTO-->
                <input class="form-check-input"
                    id="iva"
                    name="iva"
                    type="checkbox"
                    value="1"
                    data-iva="16">
                <label class="form-check-label" for="chk_iva">I.V.A.</label>

            </div>

        </div>

        <div class="col-sm-2 mb-2">
            <!--CAMPO PARA EL PRECIO DE COMPRA DEL PRODUCTO-->
            <label class="form-label" for="purchase_price">Precio De Compra<span class="txt-danger">*</span></label>
            <input type="number"
                class="form-control text-end only-numbers @error('purchase_price') is-invalid @enderror"
                step="0.01"
                id="purchase_price"
                name="purchase_price"
                value="0.00"
                min="0"
                inputmode="numeric" pattern="[0-9]*">
            @error('purchase_price')
            <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>

        <div class="col-sm-1 d-flex justify-content-start align-items-center ">
            <!--Div para mostrar la unidad de compra-->
            <div class="">
                <label id="" class="purchase_unit_text form-label text-muted">X PZA</label>
            </div>
        </div>

        <div class="d-flex justify-content-center align-items-center col-auto px-3 mb-2">
            <div class="form-check checkbox checkbox-secondary mb-0">

                <!--CHECK PARA EL PRECIO NETO DEL PRODUCTO-->
                <input class="form-check-input"
                    id="neto"
                    name="neto"
                    value="1"
                    type="checkbox" checked>
                <label class="form-check-label" for="neto">Neto</label>

            </div>
        </div>

        <div class="col-sm-2 mb-2">
            <!--CAMPO PARA MOSTRAR EL PRECIO UNITARIO DEL PRODUCTO-->
            <label class="form-label" for="unit_price">Precio Unitario</label>
            <input class="form-control-plaintext text-center"
                id="unit_price"
                name="unit_price"
                type="number"
                value="0.00"
                readonly>

        </div>

        <div class="col-sm-1 d-flex justify-content-start align-items-center ">
            <!-- Div para mostrar la unidad de venta-->
            <div class="">
                <label id="" class="sale_unit_text form-label text-muted">X Pza</label>
            </div>
        </div>

        <div class="col-sm-2 mb-2">

            <label class="form-label" for="price_iva">Precio Sin Iva</label>
            <input class="form-control-plaintext text-center"
                id="price_iva"
                name="price_iva"
                type="number"
                value="0.00"
                readonly>

        </div>

        <div class="col-sm-1 d-flex justify-content-start align-items-center ">
            <!--Input precio de compra-->
            <div class="">
                <label id="" class="purchase_unit_text form-label text-muted">X Pza</label>
            </div>
        </div>

    </div>

    <div class="col-sm-2">

        <div class="mb-3">
            <label for="stock">Existencia</label>

            <input type="number"
                class="form-control text-end only-numbers @error('stock') is-invalid @enderror"
                name="stock"
                id="stock"
                min=0
                value="{{ old('stock', '0') }}">
            @error('stock')
            <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>

    </div>

    <div class="row align-items-center">

        <div class="col-2">
            <label for="precios">Precio de venta</label>
        </div>

        <div class="col-3">

            <div class="mb-3">
                <label for="sale_price_1">Precio 1</label>

                <input type="text"
                    class="form-control text-end sale-price-input only-numbers @error('sale_price_1') is-invalid @enderror"
                    name="sale_price_1"
                    id="sale_price_1"
                    value="{{ old('sale_price_1', '0') }}"
                    data-index="1">
                @error('sale_price_1')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>

        </div>
        <div class="col-3">

            <div class="mb-3">
                <label for="sale_price_1">Precio 2</label>

                <input type="text"
                    class="form-control text-end sale-price-input only-numbers @error('sale_price_2') is-invalid @enderror"
                    name="sale_price_2"
                    id="sale_price_2"
                    value="{{ old('sale_price_2', '0') }}"
                    data-index="2">
                @error('sale_price_2')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>

        </div>
        <div class="col-3">

            <div class="mb-3">
                <label for="sale_price_3">Precio 3</label>

                <input type="text"
                    class="form-control text-end sale-price-input only-numbers @error('sale_price_3') is-invalid @enderror"
                    name="sale_price_3"
                    id="sale_price_3"
                    value="{{ old('sale_price_3', '0') }}"
                    data-index="3">
                @error('sale_price_1')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>

        </div>

    </div>

    <div class="row align-items-center">

        <div class="col-2">
            <label for="utilidad">% Utilidad</label>
        </div>

        <div class="col-3">

            <div class="mb-3">
                <input type="text"
                    class="form-control text-end margin-input only-numbers"
                    name="margen_1"
                    id="margen_1"
                    value="0"
                    data-index="1">
            </div>

        </div>
        <div class="col-3">

            <div class="mb-3">
                <input type="text"
                    class="form-control text-end margin-input only-numbers"
                    name="margen_2"
                    id="margen_2"
                    value="0"
                    data-index="2">
            </div>

        </div>
        <div class="col-3">

            <div class="mb-3">
                <input type="text"
                    class="form-control text-end margin-input only-numbers"
                    name="margen_3"
                    id="margen_3"
                    value="0"
                    data-index="3">
            </div>

        </div>
    </div>

    <div class="row align-items-center">

        <div class="col-2">
            <label for="amount">Cantidad</label>
        </div>

        <div class="col-3">

            <div class="mb-3">
                <input type="text"
                    class="form-control text-end only-numbers"
                    name="price_1_min_qty"
                    id="price_1_min_qty"
                    value="{{ old('price_1_min_qty', 1) }}"
                    readonly>
            </div>

        </div>
        <div class="col-3">

            <div class="mb-3">
                <input type="text"
                    class="form-control text-end only-numbers"
                    name="price_2_min_qty"
                    id="price_2_min_qty"
                    value="0">
            </div>

        </div>
        <div class="col-3">

            <div class="mb-3">
                <input type="text"
                    class="form-control text-end only-numbers"
                    name="price_3_min_qty"
                    id="price_3_min_qty"
                    value="0">
            </div>

        </div>
    </div>

</div>