# Cómo Obtener Datos de Fila en DataTables

## Problema Original

```javascript
// ❌ INCORRECTO - No funciona con DataTables
const rowData = $(this).closest('tr').data();
```

El método `.data()` de jQuery no funciona con DataTables porque los datos se manejan internamente por la librería.

## Métodos Correctos

### Método 1: Usando la instancia del DataTable (RECOMENDADO)

```javascript
// ✅ CORRECTO
export function bindEditProduct(tableInstance) {
    $('#tableProducts tbody').on('click', '.btn-edit-product', function () {
        const $button = $(this);
        const rowData = tableInstance.row($button.closest('tr')).data();
        
        console.log('Datos completos:', rowData);
        console.log('ID del producto:', rowData.id);
        console.log('Nombre:', rowData.product_name);
    });
}

// Uso:
const myTable = $('#tableProducts').DataTable({...});
bindEditProduct(myTable);
```

### Método 2: Obteniendo la instancia desde el selector

```javascript
// ✅ CORRECTO (si no tienes la instancia)
$('#tableProducts tbody').on('click', '.btn-edit-product', function () {
    const $button = $(this);
    const rowData = $('#tableProducts').DataTable().row($button.closest('tr')).data();
    
    console.log('Datos:', rowData);
});
```

### Método 3: Usando el atributo data-id del botón

```javascript
// ✅ CORRECTO (para obtener solo el ID)
$('#tableProducts tbody').on('click', '.btn-edit-product', function () {
    const productId = $(this).data('id');
    
    console.log('ID del producto:', productId);
    
    // Luego puedes hacer una petición AJAX para obtener más datos
    // o usar este ID para buscar en los datos del DataTable
});
```

### Método 4: Obteniendo datos específicos de celdas

```javascript
// ✅ CORRECTO (para campos específicos)
$('#tableProducts tbody').on('click', '.btn-edit-product', function () {
    const $row = $(this).closest('tr');
    const table = $('#tableProducts').DataTable();
    
    const cellData = {
        id: table.cell($row, 0).data(),      // Primera columna
        name: table.cell($row, 1).data(),    // Segunda columna
        price: table.cell($row, 5).data(),   // Sexta columna
    };
    
    console.log('Datos específicos:', cellData);
});
```

## Ejemplo de Uso en tu Código

```javascript
// En functionAjaxPurchases.js
import { bindEditProduct } from './helpers/PurchasesHelper';

// Después de inicializar tu DataTable
function loadListProducts() {
    const customOptions = {
        columns: [
            // ... tus columnas
            {
                data: 'id',
                name: 'actions',
                render: renderActionsColumnProduct
            }
        ]
    };

    const productsTable = initializeDataTableFlexible('#tableProducts', customOptions);
    
    // Pasar la instancia a tu función
    bindEditProduct(productsTable);
}
```

## Depuración

Para verificar qué datos tienes disponibles:

```javascript
$('#tableProducts tbody').on('click', '.btn-edit-product', function () {
    const $button = $(this);
    const $row = $button.closest('tr');
    const table = $('#tableProducts').DataTable();
    const rowData = table.row($row).data();
    
    console.log('=== DATOS DE LA FILA ===');
    console.log('Objeto completo:', rowData);
    console.log('Propiedades disponibles:');
    Object.keys(rowData).forEach(key => {
        console.log(`${key}:`, rowData[key]);
    });
    console.log('========================');
});
```

## Notas Importantes

1. **Siempre pasa la instancia del DataTable** a tus funciones para mejor rendimiento
2. **Verifica que rowData no sea null** antes de usarlo
3. **Los nombres de las propiedades** corresponden a los definidos en las columnas del DataTable
4. **El método data-id del botón** es útil cuando solo necesitas el ID y no todos los datos