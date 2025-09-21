<div class="row">
    <div class="card border shadow-none border-0">
        <div class="card-body p-0">
            <div class="pb-2 mb-3 text text-end-muted border-bottom border-light text-center h6">
                Informacion del Articulo
            </div>
            <div class="row p-0">
                <div class="col-sm-6 mb-3">
                    <span class="fw-semibold fs-6">
                        Descripción:
                    </span>
                    <span class="product-name text-muted fs-6 fw-semibold">Yoplait Licuado ManyPera 470g</span>
                </div>
                <div class="col-sm-6 mb-3">
                    <span class="fw-semibold fs-6">
                        Clave:
                    </span>
                    <span class="barcode text-muted fs-6 fw-semibold">Yoplait Licuado</span>
                </div>
                <div class="col-sm-6 mb-3">
                    <span class="fw-semibold fs-6">
                        Existencia:
                    </span>
                    <span class="stock text-muted fs-6 fw-semibold">123</span>
                </div>
                <div class="col-sm-6 mb-3">
                    <span class="fw-semibold fs-6">
                        Factor:
                    </span>
                    <span class="factor text-muted fs-6 fw-semibold">1.00</span>
                </div>
            </div>
        </div>
    </div>
    <div class="card border shadow-none border-0">
        <div class="card-body p-0">
            <div class="pb-2 mb-3 text-muted border-bottom border-light text-center h6">
                Precios
            </div>
            <div class="row p-0">
                <div class="col-sm-4 mb-3">
                    <span class="fw-semibold fs-6">
                        Precio de compra:
                    </span>
                    <span class="price-purchase text-muted fs-6 fw-semibold">123.45</span>
                </div>
                <!--
                <div class="col-sm-4 mb-3">
                    <span class="fw-semibold fs-6">
                        Precio sin impuesto:
                    </span>
                    <span class="price-purchase_iva text-muted fs-6 fw-semibold">112.12</span>
                </div>-->

                <div class="col-sm-4 mb-3">
                    <span class="fw-semibold fs-6">
                        Precio unitario:
                    </span>
                    <span class="price-unit text-muted fs-6 fw-semibold"></span>
                    <input type="hidden" class="" id="new-price-unit" name="new_price_unit">
                </div>
                <div class="row align-items-center">
                    <div class="col-3">
                        <label for="amount" class="fw-semibold fs-6">Precios de venta: </label>
                    </div>
                    <div class="col-2">
                        <span class="price-sale-1 text-muted fs-6 fw-semibold">123.32</span>
                    </div>
                    <div class="col-2">
                        <span class="price-sale-2 text-muted fs-6 fw-semibold">123.32</span>
                    </div>
                    <div class="col-2">
                        <span class="price-sale-3 text-muted fs-6 fw-semibold">123.32</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="card border shadow-none border-0">
        <div class="card-body p-0">
            <div class="pb-2 mb-3 text-muted border-bottom border-light text-center h6">
                Detalle de la Compra
            </div>
            <div class="row g-2 justify-content-center">
                <div class="col-3">
                    <div class="">
                        <label for="colFormLabel" class="col-form-label">Cantidad: </label>
                        <input type="text" class="form-control text-end auto-select" id="quantity" name="quantity" value="1">
                    </div>
                    <div class="">
                        <label for="colFormLabel" class="col-form-label">Costo: </label>
                        <input type="text" class="form-control text-end auto-select" id="cost" name="cost">
                    </div>
                    <span class="unit-purchase text-muted text-end fs-6 fw-semibold"></span>
                </div>
                <div class="col-3">
                    <div class="">
                        <label for="colFormLabel" class="col-form-label">Descuento ($)</label>
                        <input type="text" class="form-control text-end auto-select" id="discount-number" name="discount_number" value="0">
                    </div>
                    <div class="">
                        <label for="colFormLabel" class="col-form-label">Descuento (%)</label>
                        <input type="text" class="form-control text-end auto-select" id="discount-percentage">
                    </div>
                    <div class="">
                        <label for="colFormLabel" class="col-form-label">Factor: </label>
                        <input type="text" class="form-control text-end factor auto-select" id="new-factor" name="new_factor" value="0">
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="card border shadow-none border-0">
        <div class="card-body p-0">
            <div class="pb-2 mb-3 text-muted border-bottom border-light text-center h6">
                Precios de ventas
            </div>


            <div class="row align-items-center mb-3">
                <div class="col-3">
                    <label for="amount" class="fw-semibold fs-6">Precios de venta: </label>
                </div>
                <div class="col-2">
                    <input type="text"
                        class="form-control text-end price-sale price-sale-1 auto-select"
                        name="new_price_sale_1"
                        id="new_price_sale_1"
                        data-index="1"
                        value="">
                </div>
                <div class="col-2">
                    <input type="text"
                        class="form-control text-end price-sale price-sale-2 auto-select"
                        name="new_price_sale_2"
                        id="new_price_sale_2"
                        data-index="2"
                        value="">
                </div>
                <div class="col-2">
                    <input type="text"
                        class="form-control text-end price-sale price-sale-3 auto-select"
                        name="new_price_sale_3"
                        id="new_price_sale_3"
                        data-index="3"
                        value="">
                </div>
            </div>
            <div class="row align-items-center">
                <div class="col-3">
                    <label for="amount" class="fw-semibold fs-6">Margen: </label>
                </div>
                <div class="col-2 d-flex align-items-center justify-content-center">
                    <span class="margin-1 text-muted fs-6 fw-semibold"></span>
                </div>
                <div class="col-2 d-flex align-items-center justify-content-center">
                    <span class="margin-2 text-muted fs-6 fw-semibold"></span>
                </div>
                <div class="col-2 d-flex align-items-center justify-content-center">
                    <span class="margin-3 text-muted fs-6 fw-semibold"></span>
                </div>
            </div>
        </div>
    </div>
</div>