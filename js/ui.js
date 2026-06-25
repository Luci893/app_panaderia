/**
 * ========================================
 * UI - Renderizado de Interfaz y Utilidades
 * ========================================
 * Funciones de renderizado, modales y utilidades de UI
 */

import { CATEGORIES, getStockStatus } from './products.js';

// ========================================
// UTILIDADES
// ========================================

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    if (!container) return;
    
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

// ========================================
// RENDERIZADO DE PRODUCTOS
// ========================================

/**
 * Renderiza la lista de ingredientes
 */
function renderProducts(products, searchQuery, filterCategory, settings) {
    const container = document.getElementById('products-list');
    const emptyState = document.getElementById('empty-state');
    
    if (!container || !emptyState) return;
    
    let filteredProducts = [...products];
    
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(query)
        );
    }
    
    if (filterCategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => 
            p.category === filterCategory
        );
    }
    
    if (products.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    if (filteredProducts.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--color-text-light);padding:20px;">No se encontraron ingredientes</p>';
        return;
    }
    
    container.innerHTML = filteredProducts.map(product => {
        const stockStatus = getStockStatus(product.quantity, product.unit, settings);
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
                    <button class="btn-action" onclick="window.openMovementModal('${product.id}')" title="Registrar movimiento">📝</button>
                    <button class="btn-action" onclick="window.editProduct('${product.id}')" title="Editar">✏️</button>
                    <button class="btn-action" onclick="window.deleteProduct('${product.id}')" title="Eliminar">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// RENDERIZADO DE MOVIMIENTOS
// ========================================

/**
 * Renderiza la lista de movimientos
 */
function renderMovements(movements, filterMovementType) {
    const container = document.getElementById('movements-list');
    const emptyState = document.getElementById('empty-movements');
    
    if (!container || !emptyState) return;
    
    // Filtrar movimientos
    let filteredMovements = [...movements];
    
    if (filterMovementType !== 'all') {
        filteredMovements = filteredMovements.filter(m => 
            m.type === filterMovementType
        );
    }
    
    // Mostrar estado vacío
    if (movements.length === 0) {
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

// ========================================
// MODALES
// ========================================

/**
 * Abre el modal para agregar/editar ingrediente
 */
function openProductModal(product = null) {
    const modal = document.getElementById('modal-product');
    if (!modal) return;
    
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
    const modal = document.getElementById('modal-product');
    if (modal) modal.classList.add('hidden');
}

/**
 * Abre el modal para registrar movimiento
 */
function openMovementModal(productId, products) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('modal-movement');
    if (!modal) return;
    
    const productNameDisplay = document.getElementById('movement-product-name');
    const form = document.getElementById('movement-form');
    
    // Resetear formulario
    form.reset();
    document.getElementById('movement-product-id').value = productId;
    productNameDisplay.textContent = `${product.name} (Stock: ${product.quantity} ${product.unit})`;
    
    // Preseleccionar la unidad del producto
    const movementUnit = document.getElementById('movement-unit');
    if (movementUnit) {
        movementUnit.value = (product.unit === 'gr') ? 'gr' : 'kg';
    }

    modal.classList.remove('hidden');
}

/**
 * Cierra el modal de movimiento
 */
function closeMovementModal() {
    const modal = document.getElementById('modal-movement');
    if (modal) modal.classList.add('hidden');
}

// ========================================
// CAMBIO DE VISTAS
// ========================================

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
}

// ========================================
// ACTUALIZAR INPUTS DE CONFIGURACIÓN
// ========================================

/**
 * Actualiza los inputs de configuración con los valores del state
 */
function updateSettingsInputs(settings) {
    const thresholdLow = document.getElementById('threshold-low');
    const thresholdCritical = document.getElementById('threshold-critical');
    
    if (thresholdLow) thresholdLow.value = settings.thresholdLow;
    if (thresholdCritical) thresholdCritical.value = settings.thresholdCritical;
}

// ========================================
// EXPORTAR
// ========================================

export {
    escapeHtml,
    formatDate,
    showToast,
    renderProducts,
    renderMovements,
    openProductModal,
    closeProductModal,
    openMovementModal,
    closeMovementModal,
    switchView,
    updateSettingsInputs
};