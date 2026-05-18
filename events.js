/**
 * ========================================
 * EVENTS - Event Listeners
 * ========================================
 * Configura todos los event listeners de la aplicación
 */

import { saveSettings } from './storage.js';
import { addProduct, updateProduct, deleteProduct, getProductById } from './products.js';
import { registerMovement, clearHistory } from './movements.js';
import { 
    openProductModal, 
    closeProductModal, 
    openMovementModal, 
    closeMovementModal, 
    switchView,
    showToast,
    renderProducts,
    renderMovements,
    updateSettingsInputs
} from './ui.js';

// ========================================
// INICIALIZAR EVENT LISTENERS
// ========================================

/**
 * Inicializa todos los event listeners
 * @param {Object} state - Estado de la aplicación
 */
function initEventListeners(state) {
    // Navegación entre vistas
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
            state.currentView = view;
        });
    });
    
    // Botón agregar producto
    const btnAddProduct = document.getElementById('btn-add-product');
    if (btnAddProduct) {
        btnAddProduct.addEventListener('click', () => {
            openProductModal();
        });
    }
    
    // Primer producto desde estado vacío
    const btnAddFirst = document.getElementById('btn-add-first');
    if (btnAddFirst) {
        btnAddFirst.addEventListener('click', () => {
            openProductModal();
        });
    }
    
    // Cerrar modales
    const btnCloseModal = document.getElementById('btn-close-modal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', closeProductModal);
    }
    
    const btnCancel = document.getElementById('btn-cancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', closeProductModal);
    }
    
    const btnCloseMovement = document.getElementById('btn-close-movement');
    if (btnCloseMovement) {
        btnCloseMovement.addEventListener('click', closeMovementModal);
    }
    
    const btnCancelMovement = document.getElementById('btn-cancel-movement');
    if (btnCancelMovement) {
        btnCancelMovement.addEventListener('click', closeMovementModal);
    }
    
    // Cerrar modal al hacer click fuera
    const modalProduct = document.getElementById('modal-product');
    if (modalProduct) {
        modalProduct.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                closeProductModal();
            }
        });
    }
    
    const modalMovement = document.getElementById('modal-movement');
    if (modalMovement) {
        modalMovement.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                closeMovementModal();
            }
        });
    }
    
    // Formulario de ingrediente
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
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
                updateProduct(productId, productData, state.products, () => {
                    renderProducts(state.products, state.searchQuery, state.filterCategory);
                });
            } else {
                addProduct(productData, state.products, () => {
                    renderProducts(state.products, state.searchQuery, state.filterCategory);
                });
            }
            
            closeProductModal();
        });
    }
    
    // Formulario de movimiento
    const movementForm = document.getElementById('movement-form');
    if (movementForm) {
        movementForm.addEventListener('submit', (e) => {
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
            
            registerMovement(
                productId, 
                type, 
                quantity, 
                reason, 
                state.products, 
                state.movements,
                () => renderProducts(state.products, state.searchQuery, state.filterCategory),
                () => renderMovements(state.movements, state.filterMovementType)
            );
            closeMovementModal();
        });
    }
    
    // Buscador
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            renderProducts(state.products, state.searchQuery, state.filterCategory);
        });
    }
    
    // Filtro de categoría
    const filterCategory = document.getElementById('filter-category');
    if (filterCategory) {
        filterCategory.addEventListener('change', (e) => {
            state.filterCategory = e.target.value;
            renderProducts(state.products, state.searchQuery, state.filterCategory);
        });
    }
    
    // Filtro de movimientos
    const filterMovementType = document.getElementById('filter-movement-type');
    if (filterMovementType) {
        filterMovementType.addEventListener('change', (e) => {
            state.filterMovementType = e.target.value;
            renderMovements(state.movements, state.filterMovementType);
        });
    }
    
    // Limpiar historial
    const btnClearHistory = document.getElementById('btn-clear-history');
    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            clearHistory(state.movements, () => {
                renderMovements(state.movements, state.filterMovementType);
            });
        });
    }
    
    // Ajustes - Umbrales
    const thresholdLow = document.getElementById('threshold-low');
    if (thresholdLow) {
        thresholdLow.addEventListener('change', (e) => {
            state.settings.thresholdLow = parseInt(e.target.value) || 10;
            saveSettings(state.settings);
            renderProducts(state.products, state.searchQuery, state.filterCategory);
        });
    }
    
    const thresholdCritical = document.getElementById('threshold-critical');
    if (thresholdCritical) {
        thresholdCritical.addEventListener('change', (e) => {
            state.settings.thresholdCritical = parseInt(e.target.value) || 5;
            saveSettings(state.settings);
            renderProducts(state.products, state.searchQuery, state.filterCategory);
        });
    }
    
    // Exportar datos
    const btnExportData = document.getElementById('btn-export-data');
    if (btnExportData) {
        btnExportData.addEventListener('click', () => {
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
    }
    
    // Importar datos
    const btnImportData = document.getElementById('btn-import-data');
    const fileImport = document.getElementById('file-import');
    
    if (btnImportData) {
        btnImportData.addEventListener('click', () => {
            fileImport.click();
        });
    }
    
    if (fileImport) {
        fileImport.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (data.products) state.products = data.products;
                    if (data.movements) state.movements = data.movements;
                    if (data.settings) state.settings = { ...state.settings, ...data.settings };
                    
                    saveSettings(state.settings);
                    
                    // Actualizar inputs
                    updateSettingsInputs(state.settings);
                    
                    // Renderizar
                    renderProducts(state.products, state.searchQuery, state.filterCategory);
                    renderMovements(state.movements, state.filterMovementType);
                    
                    showToast('Datos importados correctamente');
                } catch (error) {
                    showToast('Error al importar: archivo inválido', 'error');
                }
            };
            reader.readAsText(file);
            e.target.value = ''; // Resetear input
        });
    }
}

// ========================================
// EXPORTAR
// ========================================

export { initEventListeners };