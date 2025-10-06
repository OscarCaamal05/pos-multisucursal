# PurchasesHelper.js - Documentación

Este archivo contiene todas las funciones helper y configuraciones centralizadas para el módulo de compras. Está diseñado para ser importado y usado en `functionAjaxPurchases.js` y otros archivos relacionados con compras.

## 📋 Configuración (PURCHASES_CONFIG)

### Endpoints
```javascript
CONFIG.endpoints.tempPurchaseDetails  // '/temp_purchases_detail'
CONFIG.endpoints.suppliers           // 'temp_purchases_detail/autoCompleteSuppliers'
CONFIG.endpoints.products            // 'temp_purchases_detail/autoCompleteProducts'
CONFIG.endpoints.totals              // '/temp_purchases_detail/totals'
CONFIG.endpoints.updateDiscount      // '/temp_purchases_detail/updateDiscount'
CONFIG.endpoints.setToWaiting        // '/temp_purchases_detail/set-to-waiting'
```

### Configuraciones Numéricas
```javascript
CONFIG.numbers.decimals              // 2
CONFIG.numbers.minQuantity           // 1
CONFIG.numbers.maxDiscountPercent    // 100
CONFIG.numbers.defaultTax            // 16 (IVA)
CONFIG.numbers.scrollHeight          // 500
```

### Mensajes
```javascript
CONFIG.messages.noSupplier           // 'Seleccione un proveedor para continuar.'
CONFIG.messages.noProducts           // 'Agregue productos a la compra para continuar.'
CONFIG.messages.productExists        // 'El producto ya fue agregado a la lista.'
CONFIG.messages.selectRow            // 'Seleccione una fila para continuar'
CONFIG.messages.quantityRequired     // 'La cantidad del producto debe ser mayor a 0'
```

### Modales
```javascript
CONFIG.modals.products               // '#modal-products'
CONFIG.modals.suppliers              // '#modal-suppliers'
CONFIG.modals.productDetails         // '#modal-product-details'
CONFIG.modals.payment                // '#modal-payment-detail'
CONFIG.modals.purchaseWaiting        // '#modal-purchase-waiting'
```

## 🪟 Funciones de Modales

### `openModalWithData(modalId, loadFunction)`
Abre un modal y opcionalmente ejecuta una función para cargar datos.

```javascript
// Ejemplo
openModalWithData(CONFIG.modals.products, loadListProducts);
```

### `closeModal(modalId)`
Cierra un modal específico.

```javascript
// Ejemplo
closeModal(CONFIG.modals.products);
```

### `bindTableRowSelection(tableId, onDoubleClick)`
Vincula eventos de doble click en filas de tabla.

```javascript
// Ejemplo
bindTableRowSelection('#tableProducts', (data) => {
    console.log('Producto seleccionado:', data);
});
```

## 🌐 Funciones AJAX

### `makeAjaxRequest(options)`
Realiza peticiones AJAX estandarizadas con manejo automático de tokens CSRF.

```javascript
// Ejemplo
makeAjaxRequest({
    url: CONFIG.endpoints.suppliers + '/search',
    method: 'POST',
    data: { query: 'empresa' },
    onSuccess: (response) => {
        console.log('Éxito:', response);
    },
    onError: (xhr) => {
        console.log('Error:', xhr);
    }
});
```

### `handleAjaxError(xhr)`
Manejo centralizado de errores AJAX.

```javascript
// Se usa automáticamente en makeAjaxRequest, pero también puede usarse manualmente
handleAjaxError(xhr);
```

## 🧮 Módulo de Cálculos (CalculationHelper)

### `calculateDiscountAmount(percentage, baseAmount)`
Calcula el monto del descuento basado en porcentaje.

```javascript
const discount = CalculationHelper.calculateDiscountAmount(10, 100); // "10.00"
```

### `calculateDiscountPercentage(discountAmount, baseAmount)`
Calcula el porcentaje de descuento basado en el monto.

```javascript
const percentage = CalculationHelper.calculateDiscountPercentage(10, 100); // "10.00"
```

### `formatCurrency(amount)`
Formatea un valor monetario.

```javascript
const formatted = CalculationHelper.formatCurrency(123.456); // "123.46"
```

### `isValidQuantity(quantity)`
Valida que una cantidad sea mayor a cero.

```javascript
const isValid = CalculationHelper.isValidQuantity(5); // true
```

### `applyDiscount(subtotal, discountAmount)`
Aplica un descuento al subtotal.

```javascript
const total = CalculationHelper.applyDiscount(100, 10); // 90
```

### `calculateTax(amount, taxRate)`
Calcula el impuesto sobre un monto.

```javascript
const tax = CalculationHelper.calculateTax(100, 16); // 16
```

## 🎨 Funciones de Renderizado para DataTables

### `renderProductDescription(row)`
Renderiza la descripción del producto con nombre y código de barras.

```javascript
// Uso en columnas de DataTable
{
    data: null,
    render: (data, type, row) => renderProductDescription(row)
}
```

### `renderCenteredValue(value)`
Renderiza un valor centrado.

```javascript
{
    data: 'quantity',
    render: (data, type, row) => renderCenteredValue(row.quantity)
}
```

### `renderPriceWithUnit(price, unit)`
Renderiza precio con unidad.

```javascript
{
    data: null,
    render: (data, type, row) => renderPriceWithUnit(row.price, row.unit)
}
```

### `renderCurrency(amount)`
Renderiza valor monetario.

```javascript
{
    data: 'total',
    render: (data, type, row) => renderCurrency(row.total)
}
```

### `renderActionsColumn(data)`
Renderiza botones de acciones.

```javascript
{
    data: 'id',
    render: renderActionsColumn
}
```

## 🔍 Autocompletado

### `createAutoComplete(options)`
Crea un autocompletado genérico.

```javascript
// Ejemplo para proveedores
createAutoComplete({
    selector: "#auto_complete_supplier",
    dataSource: autoCompleteSupplier,
    targetInput: "#supplier_id",
    entityType: "supplier"
});
```

## ✅ Funciones de Validación

### `validateSupplierSelected(supplierId)`
Valida que haya un proveedor seleccionado.

```javascript
if (!validateSupplierSelected(supplierId)) {
    showAlert('warning', 'Error', 'Seleccione un proveedor');
    return;
}
```

### `validateProductsInTable(table)`
Valida que haya productos en la tabla.

```javascript
if (!validateProductsInTable(tableDetails)) {
    showAlert('warning', 'Error', 'Agregue productos');
    return;
}
```

### `formatPhoneNumber(phone)`
Formatea un número de teléfono.

```javascript
const formatted = formatPhoneNumber('1234567890'); // "(123)-456-7890"
```

## 📝 Ejemplo de Uso Completo

```javascript
// Importar las funciones helper
import { 
    PURCHASES_CONFIG as CONFIG,
    makeAjaxRequest,
    CalculationHelper,
    validateSupplierSelected
} from './helpers/PurchasesHelper';

// Usar en una función
function processOrder() {
    const supplierId = $('#supplier_id').val();
    
    // Validar usando helper
    if (!validateSupplierSelected(supplierId)) {
        showAlert('warning', 'Error', CONFIG.messages.noSupplier);
        return;
    }
    
    // Calcular descuento usando helper
    const discount = CalculationHelper.calculateDiscountAmount(10, 100);
    
    // Hacer petición AJAX usando helper
    makeAjaxRequest({
        url: CONFIG.endpoints.tempPurchaseDetails + '/process',
        method: 'POST',
        data: {
            supplier_id: supplierId,
            discount: discount
        },
        onSuccess: (response) => {
            console.log('Orden procesada:', response);
        }
    });
}
```

## 🔄 Migración desde el archivo original

Para migrar código existente:

1. **Reemplazar URLs hardcodeadas:**
   ```javascript
   // Antes
   url: '/temp_purchases_detail/totals/' + id
   
   // Después
   url: CONFIG.endpoints.totals + '/' + id
   ```

2. **Usar makeAjaxRequest en lugar de $.ajax:**
   ```javascript
   // Antes
   $.ajax({
       url: '/endpoint',
       method: 'POST',
       data: { _token: $('meta[name="csrf-token"]').attr('content'), ... }
   })
   
   // Después
   makeAjaxRequest({
       url: '/endpoint',
       method: 'POST',
       data: { ... } // El token se agrega automáticamente
   })
   ```

3. **Usar helpers de validación:**
   ```javascript
   // Antes
   if (!supplierId || supplierId == 0) {
   
   // Después
   if (!validateSupplierSelected(supplierId)) {
   ```

4. **Usar helpers de cálculo:**
   ```javascript
   // Antes
   const discount = (price * (percentage / 100)).toFixed(2);
   
   // Después
   const discount = CalculationHelper.calculateDiscountAmount(percentage, price);
   ```