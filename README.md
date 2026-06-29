# App Panadería Ingredientes — Los Abuelos

Aplicación web (PWA) para controlar el stock de ingredientes de una panadería: permite registrar ingredientes, llevar un historial de ingresos y egresos, y recibir alertas visuales según el nivel de stock disponible.

## Descripción general

La app está pensada para que el dueño o encargado de una panadería pueda:

- Cargar y editar los ingredientes que se usan en la producción (harinas, azúcares, levaduras, grasas, etc.).
- Registrar movimientos de stock (ingresos por compra, egresos por uso/venta).
- Ver de un vistazo qué ingredientes están bajos o críticos, gracias a un sistema de colores configurable.
- Consultar el historial completo de movimientos, con filtros por tipo.
- Exportar e importar todos los datos en formato JSON, como respaldo.
- Usarse como aplicación instalable (PWA) tanto en navegador como empaquetada en APK (vía AppsGeyser) para Android.

## Estructura del proyecto

```
APP_PANADERIA/
├── icons/
│   └── icon-4500.png
├── js/
│   ├── app.js
│   ├── firebaseConfig.js
│   ├── products.js
│   ├── storage.js
│   └── ui.js
├── index.html
├── manifest.json
├── styles.css
├── LICENSE
└── README.md
```

## Tecnologías utilizadas

- **HTML5 / CSS3** — estructura y estilos, con diseño responsive (mobile-first, adaptado a tablet/desktop).
- **JavaScript (ES Modules)** — lógica de la aplicación, sin frameworks.
- **Bootstrap 5** — usado puntualmente para la barra de navegación responsive.
- **Firebase** — utilizado para la persistencia de datos (productos, movimientos y configuración).
- **PWA (Progressive Web App)** — instalable desde el navegador gracias al `manifest.json`.
- **AppsGeyser** — empaquetado del sitio en un APK (Trusted Web Activity) para distribución en Android.

## Descripción de cada archivo

### `index.html`
Estructura principal de la app. Define las tres vistas (Stock, Historial, Ajustes), los modales de "Agregar/Editar Ingrediente" y "Registrar Movimiento", y el contenedor de notificaciones (toasts). Incluye la barra de navegación (Bootstrap) y los enlaces a estilos y scripts.

### `styles.css`
Hoja de estilos de toda la aplicación. Define variables CSS (colores, espaciados, bordes, sombras), estilos para las cards de productos e historial, modales, formularios, badges de estado de stock, y reglas responsive para tablet/desktop.

### `manifest.json`
Manifiesto de la PWA: nombre de la app, colores de tema, orientación, idioma y los íconos (192px y 512px) que se usan tanto en la instalación web como en el ícono del APK.

### `js/firebaseConfig.js`
Inicializa la conexión con Firebase, que es la base donde se guardan los datos de la aplicación (productos, movimientos, configuración).

### `js/storage.js`
Capa de persistencia de datos. Se encarga de:
- Cargar los datos guardados (`loadData`).
- Guardar productos (`saveProducts`), movimientos (`saveMovements`) y configuración (`saveSettings`).
- Definir los valores por defecto de configuración (`DEFAULT_SETTINGS`), como los umbrales de stock bajo y crítico.

### `js/products.js`
Lógica de negocio relacionada a los ingredientes:
- `generateId` — genera identificadores únicos para cada producto.
- `addProduct` / `updateProduct` / `deleteProduct` — alta, edición y baja de ingredientes.
- `getProductById` — búsqueda de un producto por su ID.
- `convertToGrams` — convierte cualquier cantidad (en `kg` o `gr`) a gramos, para poder comparar contra los umbrales de forma uniforme.
- `getStockStatus` — calcula el estado de stock de un producto (`Sin stock`, `Stock crítico`, `Bajo stock`, `Stock OK`) en base a su cantidad y a los umbrales configurados por el usuario en Ajustes.
- `CATEGORIES` — diccionario de categorías disponibles para clasificar ingredientes (Harinas, Azúcares, Levaduras, Grasas, Otros).

### `js/ui.js`
Funciones encargadas del renderizado visual y utilidades de interfaz:
- `escapeHtml` — sanitiza texto para evitar inyección de HTML/XSS al mostrar nombres ingresados por el usuario.
- `formatDate` — formatea fechas para mostrarlas en los movimientos del historial.
- `showToast` — muestra notificaciones emergentes de éxito, error o advertencia.
- `renderProducts` — dibuja la lista de ingredientes en pantalla, aplicando filtros de búsqueda y categoría, y mostrando el badge de estado de stock correspondiente.
- `renderMovements` — dibuja el historial de movimientos, aplicando filtro por tipo (ingreso/egreso).
- `openProductModal` / `closeProductModal` — abren y cierran el modal de alta/edición de ingredientes.
- `openMovementModal` / `closeMovementModal` — abren y cierran el modal de registro de movimientos, mostrando el stock actual del producto seleccionado.
- `switchView` — controla el cambio entre las vistas de Stock, Historial y Ajustes.
- `updateSettingsInputs` — sincroniza los inputs de la pantalla de Ajustes con los valores guardados.

### `js/app.js`
Punto de entrada de la aplicación. Se encarga de:
- Inicializar Firebase y cargar los datos guardados al arrancar (`initApp`).
- Mantener el **estado global** de la app (`state`): productos, movimientos, configuración, vista actual y filtros activos.
- Registrar todos los eventos de la interfaz (`initEventListeners`): navegación entre vistas, alta/edición/borrado de productos, registro de movimientos, búsqueda y filtros, cambios en los umbrales de stock, exportación e importación de datos en JSON.
- `registerMovement` — función central que aplica un ingreso o egreso de stock a un producto, validando que haya suficiente cantidad disponible en los egresos, dejando registro en el historial, y guardando los cambios.
- `clearHistory` — limpia todo el historial de movimientos (con confirmación previa).
- Exponer funciones globales (`window.editProduct`, `window.deleteProduct`, `window.openMovementModal`) para que puedan ser invocadas desde los botones generados dinámicamente en `ui.js`.

## Sistema de estado de stock

Cada ingrediente se clasifica automáticamente según su cantidad actual (convertida a gramos) y los umbrales configurados en la pantalla de Ajustes:

| Estado | Condición | Color |
|---|---|---|
| Sin stock | Cantidad = 0 | Rojo |
| Stock crítico | Cantidad ≤ umbral crítico | Rojo/Naranja |
| Bajo stock | Cantidad ≤ umbral bajo | Amarillo |
| Stock OK | Cantidad > umbral bajo | Verde |

Los umbrales (**Stock bajo** y **Stock crítico**) se configuran en kilogramos desde la vista de Ajustes, y se aplican a todos los productos sin importar si están guardados en `kg` o `gr`.

## Flujo de un movimiento de stock

1. El usuario presiona el botón de movimiento (📝) sobre un ingrediente.
2. Se abre el modal mostrando el producto y su stock actual.
3. El usuario elige tipo de movimiento (ingreso/egreso), cantidad, unidad (kg/gr) y un motivo opcional.
4. La app valida que haya stock suficiente en caso de egreso.
5. La cantidad se convierte a la unidad del producto si es necesario.
6. Se actualiza el stock, se guarda el movimiento en el historial (respetando la unidad que el usuario eligió al cargarlo) y se refrescan ambas vistas (Stock e Historial).

## Respaldo de datos

Desde la vista de Ajustes es posible:
- **Exportar datos**: descarga un archivo `.json` con todos los productos, movimientos y configuración actuales.
- **Importar datos**: permite restaurar un respaldo previamente exportado, sobrescribiendo los datos actuales.

## Instalación / distribución

- **Como PWA**: al visitar el sitio desde un navegador compatible, puede instalarse directamente gracias al `manifest.json` y sus íconos.
- **Como APK (Android)**: el sitio se empaqueta mediante AppsGeyser como una Trusted Web Activity (TWA), que carga el sitio publicado en vivo. Esto significa que cualquier actualización del código publicado en el hosting (GitHub Pages / Firebase Hosting) se refleja automáticamente en la app instalada, sin necesidad de regenerar el APK.

## Licencia

Ver archivo [LICENSE](./LICENSE).
