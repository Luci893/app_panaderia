/**
 * ========================================
 * APP PANADERÍA INGREDIENTES - Lógica Principal
 * ========================================
 * Sistema de gestión de stock de ingredientes para panadería
 * Sin frameworks - JavaScript puro
 */

// ========================================
// CONSTANTES Y CONFIGURACIÓN
// ========================================

const STORAGE_KEYS = {
    PRODUCTS: 'panaderia_productos',
    MOVEMENTS: 'panaderia_movimientos',
    SETTINGS: 'panaderia_ajustes'
};

const DEFAULT_SETTINGS = {
    thresholdLow: 10,
    thresholdCritical: 5
};

const CATEGORIES = {
    harinas: 'Harinas',
    azucares: 'Azúcares',
    levaduras: 'Levaduras',
    grasas: 'Grasas',
    otros: 'Otros'
};

// ========================================
// ESTADO DE LA APLICACIÓN
// ========================================

let state = {
    products: [],
    movements: [],
    settings: { ...DEFAULT_SETTINGS },
    currentView: 'stock',
    searchQuery: '',
    filterCategory: 'all',
    filterMovementType: 'all'
};

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

/**
 * Genera un ID único para ingredientes
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Formatea una fecha para mostrar
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('es-AR', options);
}

/**
 * Muestra un mensaje toast
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);
    
    // Auto eliminar después de 4 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 4000);
}

/**
 * Solicita confirmación al usuario
 */
function confirmAction(message) {
    return confirm(message);
}

// ========================================
// FUNCIONES DE PERSISTENCIA (localStorage)
// ========================================

/**
 * Carga datos desde localStorage
 */
function loadData() {
    try {
        const products = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        const movements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
        const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        
        state.products = products ? JSON.parse(products) : [];
        state.movements = movements ? JSON.parse(movements) : [];
        state.settings = settings ? { ...DEFAULT_SETTINGS, ...JSON.parse(settings) } : { ...DEFAULT_SETTINGS };
        
        // Cargar umbrales en inputs
        document.getElementById('threshold-low').value = state.settings.thresholdLow;
        document.getElementById('threshold-critical').value = state.settings.thresholdCritical;
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        state.products = [];
        state.movements = [];
        state.settings = { ...DEFAULT_SETTINGS };
    }
}

/**
 * Guarda ingredientes en localStorage
 */
function saveProducts() {
    try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(state.products));
    } catch (error) {
        console.error('Error al guardar ingredientes:', error);
        showToast('Error al guardar los datos', 'error');
    }
}

/**
 * Guarda movimientos en localStorage
 */
function saveMovements() {
    try {
        localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(state.movements));
    } catch (error) {
        console.error('Error al guardar movimientos:', error);
    }
}

/**
 * Guarda ajustes en localStorage
 */
function saveSettings() {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    } catch (error) {
        console.error('Error al guardar ajustes:', error);
    }
}

// ========================================
// GESTIÓN DE INGREDIENTES
// ========================================

/**
 * Agrega un nuevo ingrediente
 */
function addProduct(productData) {
    const product = {
        id: generateId(),
        name: productData.name.trim(),
        category: productData.category,
        quantity: parseFloat(productData.quantity) || 0,
        unit: productData.unit,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    state.products.push(product);
    saveProducts();
    renderProducts();
    renderMovements();
    showToast(`Ingrediente "${product.name}" agregado correctamente`);
}

/**
 * Actualiza un ingrediente existente
 */
function updateProduct(id, productData) {
    const index = state.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    state.products[index] = {
        ...state.products[index],
        name: productData.name.trim(),
        category: productData.category,
        quantity: parseFloat(productData.quantity) || 0,
        unit: productData.unit,
        updatedAt: Date.now()
    };
    
    saveProducts();
    renderProducts();
    showToast('Ingrediente actualizado correctamente');
    return true;
}

/**
 * Elimina un ingrediente
 */
function deleteProduct(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    
    if (confirmAction(`¿Eliminar "${product.name}" del inventario?`)) {
        state.products = state.products.filter(p => p.id !== id);
        saveProducts();
        renderProducts();
        showToast('Ingrediente eliminado');
    }
}

/**
 * Obtiene el estado del stock de un ingrediente basado en su stock mínimo
 * OK: stock > minimumStock
 * Bajo: stock está cerca del mínimo (entre 80% y 100% del mínimo)
 * Crítico: stock < 80% del mínimo o stock = 0
 */
function getStockStatus(quantity) {
    if (quantity <= 0) {
        return { status: 'out', label: 'Sin stock' };
    } else if (quantity <= 5) {
        return { status: 'low', label: 'Bajo stock' };
    } else if (quantity <= 20) {
        return { status: 'medium', label: 'Stock medio' };
    } else {
        return { status: 'ok', label: 'Stock OK' };
    }
}

// ========================================
// GESTIÓN DE MOVIMIENTOS
// ========================================

/**
 * Registra un movimiento (ingreso o egreso)
 */
function registerMovement(productId, type, quantity, reason = '') {
    const product = state.products.find(p => p.id === productId);
    if (!product) return false;
    
    // Validar stock disponible para egresos
    if (type === 'egreso' && product.quantity < quantity) {
        showToast(`Stock insuficiente. Disponible: ${product.quantity} ${product.unit}`, 'error');
        return false;
    }
    
    // Actualizar stock del producto
    if (type === 'ingreso') {
        product.quantity += quantity;
    } else {
        product.quantity -= quantity;
    }
    product.updatedAt = Date.now();
    
    // Registrar el movimiento
    const movement = {
        id: generateId(),
        productId: productId,
        productName: product.name,
        type: type,
        quantity: quantity,
        unit: product.unit,
        reason: reason.trim(),
        date: Date.now()
    };
    
    state.movements.unshift(movement); // Agregar al inicio
    saveProducts();
    saveMovements();
    
    renderProducts();
    renderMovements();
    
    const typeLabel = type === 'ingreso' ? 'ingreso' : 'egreso';
    showToast(`${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} registrado: ${quantity} ${product.unit}`);
    
    return true;
}

/**
 * Limpia el historial de movimientos
 */
function clearHistory() {
    if (confirmAction('¿Limpiar todo el historial de movimientos?')) {
        state.movements = [];
        saveMovements();
        renderMovements();
        showToast('Historial limpiado');
    }
}

// ========================================
// RENDERIZADO DE LA INTERFAZ
// ========================================

/**
 * Renderiza la lista de ingredientes
 */
function renderProducts() {
    const container = document.getElementById('products-list');
    const emptyState = document.getElementById('empty-state');
    
    // Filtrar ingredientes
    let filteredProducts = state.products;
    
    // Aplicar filtro de búsqueda
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(query)
        );
    }
    
    // Aplicar filtro de categoría
    if (state.filterCategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => 
            p.category === state.filterCategory
        );
    }
    
    // Mostrar estado vacío si no hay ingredientes
    if (state.products.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    // Renderizar cada ingrediente
    if (filteredProducts.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--color-text-light);padding:20px;">No se encontraron ingredientes</p>';
        return;
    }
    
    container.innerHTML = filteredProducts.map(product => {
        const stockStatus = getStockStatus(product.quantity);
        const categoryLabel = CATEGORIES[product.category] || product.category;
        
        return `
            <div class="product-card">
                <div class="product-info">
                    <div class="product-name">${escapeHtml(product.name)}</div>
                    <div class="product-category">${categoryLabel}</div>
                </div>
                <div class="product-stock">
                    <div class="stock-quantity">${product.quantity.toFixed(2)}</div>
                    <div class="stock-unit">${product.unit}</div>
                    <span class="stock-status status-${stockStatus.status}">${stockStatus.label}</span>
                </div>
                <div class="product-actions">
                    <button class="btn-action" onclick="openMovementModal('${product.id}')" title="Registrar movimiento">📝</button>
                    <button class="btn-action" onclick="editProduct('${product.id}')" title="Editar">✏️</button>
                    <button class="btn-action" onclick="deleteProduct('${product.id}')" title="Eliminar">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Renderiza la lista de movimientos
 */
function renderMovements() {
    const container = document.getElementById('movements-list');
    const emptyState = document.getElementById('empty-movements');
    
    // Filtrar movimientos
    let filteredMovements = state.movements;
    
    if (state.filterMovementType !== 'all') {
        filteredMovements = filteredMovements.filter(m => 
            m.type === state.filterMovementType
        );
    }
    
    // Mostrar estado vacío
    if (state.movements.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    if (filteredMovements.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--color-text-light);padding:20px;">No hay movimientos</p>';
        return;
    }
    
    container.innerHTML = filteredMovements.map(movement => {
        const typeLabel = movement.type === 'ingreso' ? 'Ingreso' : 'Egreso';
        const sign = movement.type === 'ingreso' ? '+' : '-';
        
        return `
            <div class="movement-item">
                <div class="movement-info">
                    <div class="movement-product">${escapeHtml(movement.productName)}</div>
                    <div class="movement-reason">${escapeHtml(movement.reason) || 'Sin motivo'}</div>
                </div>
                <div class="movement-meta">
                    <div class="movement-quantity">${sign}${movement.quantity.toFixed(2)} ${movement.unit}</div>
                    <div class="movement-type type-${movement.type}">${typeLabel}</div>
                    <div class="movement-date">${formatDate(movement.date)}</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// MODALES
// ========================================

/**
 * Abre el modal para agregar/editar ingrediente
 */
function openProductModal(product = null) {
    const modal = document.getElementById('modal-product');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('product-form');
    
    // Resetear formulario
    form.reset();
    document.getElementById('product-id').value = '';
    
    if (product) {
        // Modo edición
        title.textContent = 'Editar Ingrediente';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-quantity').value = product.quantity;
        document.getElementById('product-unit').value = product.unit;
    } else {
        // Modo agregar
        title.textContent = 'Agregar Ingrediente';
    }
    
    modal.classList.remove('hidden');
}

/**
 * Cierra el modal de producto
 */
function closeProductModal() {
    document.getElementById('modal-product').classList.add('hidden');
}

/**
 * Abre el modal para registrar movimiento
 */
function openMovementModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('modal-movement');
    const productNameDisplay = document.getElementById('movement-product-name');
    const form = document.getElementById('movement-form');
    
    // Resetear formulario
    form.reset();
    document.getElementById('movement-product-id').value = productId;
    productNameDisplay.textContent = `${product.name} (Stock: ${product.quantity} ${product.unit})`;
    
    modal.classList.remove('hidden');
}

/**
 * Cierra el modal de movimiento
 */
function closeMovementModal() {
    document.getElementById('modal-movement').classList.add('hidden');
}

// ========================================
// MANEJO DE EVENTOS
// ========================================

/**
 * Inicializa los event listeners
 */
function initEventListeners() {
    // Navegación entre vistas
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
    
    // Botón agregar producto
    document.getElementById('btn-add-product').addEventListener('click', () => {
        openProductModal();
    });
    
    // Primer producto desde estado vacío
    document.getElementById('btn-add-first').addEventListener('click', () => {
        openProductModal();
    });
    
    // Cerrar modales
    document.getElementById('btn-close-modal').addEventListener('click', closeProductModal);
    document.getElementById('btn-cancel').addEventListener('click', closeProductModal);
    document.getElementById('btn-close-movement').addEventListener('click', closeMovementModal);
    document.getElementById('btn-cancel-movement').addEventListener('click', closeMovementModal);
    
    // Cerrar modal al hacer click fuera
    document.getElementById('modal-product').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeProductModal();
        }
    });
    
    document.getElementById('modal-movement').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeMovementModal();
        }
    });
    
    // Formulario de ingrediente
    document.getElementById('product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const productData = {
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        quantity: document.getElementById('product-quantity').value,
        unit: document.getElementById('product-unit').value
        };
        
        // Validaciones
        if (!productData.name.trim()) {
            showToast('El nombre es obligatorio', 'error');
            return;
        }
        
        if (!productData.category) {
            showToast('Selecciona una categoría', 'error');
            return;
        }

        const productId = document.getElementById('product-id').value;
        
        if (productId) {
            updateProduct(productId, productData);
        } else {
            addProduct(productData);
        }
        
        closeProductModal();
    });
    
    // Formulario de movimiento
    document.getElementById('movement-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const productId = document.getElementById('movement-product-id').value;
        const type = document.getElementById('movement-type').value;
        const quantity = parseFloat(document.getElementById('movement-quantity').value);
        const reason = document.getElementById('movement-reason').value;
        
        // Validaciones
        if (!type) {
            showToast('Selecciona el tipo de movimiento', 'error');
            return;
        }
        
        if (!quantity || quantity <= 0) {
            showToast('Ingresa una cantidad válida', 'error');
            return;
        }
        
        registerMovement(productId, type, quantity, reason);
        closeMovementModal();
    });
    
    // Buscador
    document.getElementById('search-input').addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderProducts();
    });
    
    // Filtro de categoría
    document.getElementById('filter-category').addEventListener('change', (e) => {
        state.filterCategory = e.target.value;
        renderProducts();
    });
    
    // Filtro de movimientos
    document.getElementById('filter-movement-type').addEventListener('change', (e) => {
        state.filterMovementType = e.target.value;
        renderMovements();
    });
    
    // Limpiar historial
    document.getElementById('btn-clear-history').addEventListener('click', clearHistory);
    
    // Ajustes - Umbrales
    document.getElementById('threshold-low').addEventListener('change', (e) => {
        state.settings.thresholdLow = parseInt(e.target.value) || 10;
        saveSettings();
        renderProducts();
    });
    
    document.getElementById('threshold-critical').addEventListener('change', (e) => {
        state.settings.thresholdCritical = parseInt(e.target.value) || 5;
        saveSettings();
        renderProducts();
    });
    
    // Exportar datos
    document.getElementById('btn-export-data').addEventListener('click', () => {
        const data = {
            products: state.products,
            movements: state.movements,
            settings: state.settings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `panaderia_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Datos exportados correctamente');
    });
    
    // Importar datos
    document.getElementById('btn-import-data').addEventListener('click', () => {
        document.getElementById('file-import').click();
    });
    
    document.getElementById('file-import').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.products) state.products = data.products;
                if (data.movements) state.movements = data.movements;
                if (data.settings) state.settings = { ...DEFAULT_SETTINGS, ...data.settings };
                
                saveProducts();
                saveMovements();
                saveSettings();
                
                // Actualizar inputs
                document.getElementById('threshold-low').value = state.settings.thresholdLow;
                document.getElementById('threshold-critical').value = state.settings.thresholdCritical;
                
                renderProducts();
                renderMovements();
                
                showToast('Datos importados correctamente');
            } catch (error) {
                showToast('Error al importar: archivo inválido', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Resetear input
    });
    
}

/**
 * Cambia entre vistas
 */
function switchView(viewName) {
    // Actualizar navegación
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    
    // Actualizar vistas
    document.querySelectorAll('.view').forEach(view => {
        view.classList.toggle('active', view.id === `view-${viewName}`);
    });
    
    state.currentView = viewName;
}

// ========================================
// FUNCIONES GLOBALES (para onclick en HTML)
// ========================================

// Funciones necesarias para los onclick en el HTML
window.editProduct = function(id) {
    const product = state.products.find(p => p.id === id);
    if (product) {
        openProductModal(product);
    }
};

window.deleteProduct = deleteProduct;
window.openMovementModal = openMovementModal;

// ========================================
// INICIALIZACIÓN
// ========================================

/**
 * Inicializa la aplicación
 */
function initApp() {
    console.log('🧂 Panadería Ingredientes - Iniciando...');
    
    // Cargar datos
    loadData();
    
    // Inicializar eventos
    initEventListeners();
    
    // Renderizar vistas
    renderProducts();
    renderMovements();
    
    console.log('✅ Aplicación lista');
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);

// ========================================
// SERVICE WORKER REGISTRATION (PWA)
// ========================================

/*if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registrado:', registration.scope);
            })
            .catch(error => {
                console.log('SW no registrado:', error);
            });
    });
}*/