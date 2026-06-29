/**
 * ========================================
 * APP - Inicialización de la Aplicación
 * ========================================
 * Punto de entrada principal de la aplicación modularizada
 */

import { initializeApp } from './firebaseConfig.js';
import { loadData, saveProducts, saveMovements, saveSettings, DEFAULT_SETTINGS } from './storage.js';
import { addProduct, updateProduct, deleteProduct as deleteProductLogic, getProductById, convertUnit, normalizeUnit } from './products.js';
import {
    renderProducts,
    renderMovements,
    updateSettingsInputs,
    openProductModal,
    closeProductModal,
    openMovementModal,
    closeMovementModal,
    switchView,
    showToast
} from './ui.js';

// ========================================
// ESTADO DE LA APLICACIÓN
// ========================================

const state = {
    products: [],
    movements: [],
    settings: { ...DEFAULT_SETTINGS },
    currentView: 'stock',
    searchQuery: '',
    filterCategory: 'all',
    filterMovementType: 'all'
};

// ========================================
// INICIALIZAR APLICACIÓN
// ========================================

/**
 * Inicializa la aplicación
 */
async function initApp() {
    console.log('🧂 Panadería Ingredientes - Iniciando...');

    try {
        await initializeApp();

        const data = await loadData();

        state.products = data.products || [];
        state.movements = data.movements || [];
        state.settings = data.settings || { ...DEFAULT_SETTINGS };

        updateSettingsInputs(state.settings);

        initEventListeners(state);
        setupGlobalFunctions();

        // En initApp()
        renderProducts(state.products, state.searchQuery, state.filterCategory, state.settings);
        renderMovements(state.movements, state.filterMovementType);

        console.log('✅ Aplicación lista');
    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
    }
}

const btnMenu = document.getElementById('btn-menu');
const bottomNav = document.querySelector('.bottom-nav');

if (btnMenu && bottomNav) {
    btnMenu.addEventListener('click', () => {
        bottomNav.classList.toggle('show');
    });
}

// ========================================
// FUNCIONES GLOBALES (para onclick en HTML)
// ========================================

function setupGlobalFunctions() {
    window.editProduct = function(id) {
        const product = getProductById(id, state.products);
        if (product) {
            openProductModal(product);
        }
    };

    window.deleteProduct = function(id) {
        const product = getProductById(id, state.products);
        if (!product) return;

        if (confirm(`¿Eliminar "${product.name}" del inventario?`)) {
            const deleted = deleteProductLogic(id, state.products);
            if (deleted) {
                renderProducts(state.products, state.searchQuery, state.filterCategory, state.settings);
                showToast('Ingrediente eliminado');
            }
        }
    };

    window.openMovementModal = function(productId) {
        openMovementModal(productId, state.products);
    };
}

// ========================================
// FUNCIONES GLOBALES DE APLICACIÓN
// ========================================

function registerMovement(productId, type, quantity, inputUnit, reason = '') {
    const product = state.products.find(p => p.id === productId);
    if (!product) return false;

    // Convertimos la cantidad ingresada a la unidad del producto
    const convertedQuantity = convertUnit(quantity, inputUnit, product.unit);

    if (type === 'egreso' && product.quantity < convertedQuantity) {
        showToast(`Stock insuficiente. Disponible: ${product.quantity} ${product.unit}`, 'error');
        return false;
    }

    if (type === 'ingreso') {
        product.quantity += convertedQuantity;
    } else {
        product.quantity -= convertedQuantity;
    }

    // Normalizar unidad (gr→kg si pasa de 1000, kg→gr si baja de 1)
    const normalized = normalizeUnit(product.quantity, product.unit);
    product.quantity = normalized.quantity;
    product.unit = normalized.unit;

    product.updatedAt = Date.now();

    const movement = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).substr(2)}`,
        productId,
        productName: product.name,
        type,
        quantity,
        unit: inputUnit,
        reason: reason.trim(),
        date: Date.now()
    };

    state.movements.unshift(movement);
    saveProducts(state.products);
    saveMovements(state.movements);

    renderProducts(state.products, state.searchQuery, state.filterCategory, state.settings);
    renderMovements(state.movements, state.filterMovementType);

    const typeLabel = type === 'ingreso' ? 'Ingreso' : 'Egreso';
    showToast(`${typeLabel} registrado: ${quantity} ${inputUnit}`);

    return true;
}

function clearHistory() {
    if (confirm('¿Limpiar todo el historial de movimientos?')) {
        state.movements = [];
        saveMovements(state.movements);
        renderMovements(state.movements, state.filterMovementType);
        showToast('Historial limpiado');
    }
}

// ========================================
// MANEJO DE EVENTOS
// ========================================

function initEventListeners(state) {
    console.log("Función initEventListeners ejecutado");

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
            state.currentView = view;
        });
    });

    const btnAddProduct = document.getElementById('btn-add-product');
    if (btnAddProduct) {
        btnAddProduct.addEventListener('click', () => {
            console.log("CLICK AGREGAR");
            openProductModal();
        });
    }

    const btnAddFirst = document.getElementById('btn-add-first');
    if (btnAddFirst) {
        btnAddFirst.addEventListener('click', () => {
            console.log("CLICK AGREGAR");
            openProductModal();
        });
    }

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
                const updated = updateProduct(productId, productData, state.products);
                if (updated) {
                    renderProducts(state.products, state.searchQuery, state.filterCategory, state.settings);
                    showToast('Ingrediente actualizado correctamente');
                }
            } else {
                const product = addProduct(productData, state.products);
                if (product) {
                    renderProducts(state.products, state.searchQuery, state.filterCategory, state.settings);
                    showToast(`Ingrediente "${product.name}" agregado correctamente`);
                }
            }

            closeProductModal();
        });
    }

    const movementForm = document.getElementById('movement-form');
    if (movementForm) {
        movementForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const productId = document.getElementById('movement-product-id').value;
            const type = document.getElementById('movement-type').value;
            const quantity = parseFloat(document.getElementById('movement-quantity').value);
            const unit = document.getElementById('movement-unit').value;
            const reason = document.getElementById('movement-reason').value;

            if (!type) {
                showToast('Selecciona el tipo de movimiento', 'error');
                return;
            }

            if (!quantity || quantity <= 0) {
                showToast('Ingresa una cantidad válida', 'error');
                return;
            }

            const registered = registerMovement(productId, type, quantity, unit, reason);
            if (registered) {
                closeMovementModal();
            }
        });
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            renderProducts(state.products, state.searchQuery, state.filterCategory, state.settings);
        });
    }

    const filterCategory = document.getElementById('filter-category');
    if (filterCategory) {
        filterCategory.addEventListener('change', (e) => {
            state.filterCategory = e.target.value;
            renderProducts(state.products, state.searchQuery, state.filterCategory, state.settings);
        });
    }

    const filterMovementType = document.getElementById('filter-movement-type');
    if (filterMovementType) {
        filterMovementType.addEventListener('change', (e) => {
            state.filterMovementType = e.target.value;
            renderMovements(state.movements, state.filterMovementType);
        });
    }

    const btnClearHistory = document.getElementById('btn-clear-history');
    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', clearHistory);
    }

    const thresholdLow = document.getElementById('threshold-low');
    if (thresholdLow) {
        thresholdLow.addEventListener('change', (e) => {
            state.settings.thresholdLow = parseInt(e.target.value) || 10;
            saveSettings(state.settings);
            renderProducts(state.products, state.searchQuery, state.filterCategory, state.settings);
        });
    }

    const thresholdCritical = document.getElementById('threshold-critical');
    if (thresholdCritical) {
        thresholdCritical.addEventListener('change', (e) => {
            state.settings.thresholdCritical = parseInt(e.target.value) || 5;
            saveSettings(state.settings);
            renderProducts(state.products, state.searchQuery, state.filterCategory, state.settings);
        });
    }

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

    const btnImportData = document.getElementById('btn-import-data');
    const fileImport = document.getElementById('file-import');

    if (btnImportData && fileImport) {
        btnImportData.addEventListener('click', () => fileImport.click());

        fileImport.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);

                    if (data.products) state.products = data.products;
                    if (data.movements) state.movements = data.movements;
                    if (data.settings) state.settings = { ...DEFAULT_SETTINGS, ...data.settings };

                    saveProducts(state.products);
                    saveMovements(state.movements);
                    saveSettings(state.settings);

                    updateSettingsInputs(state.settings);
                    renderProducts(state.products, state.searchQuery, state.filterCategory, state.settings);
                    renderMovements(state.movements, state.filterMovementType);

                    showToast('Datos importados correctamente');
                } catch (error) {
                    showToast('Error al importar: archivo inválido', 'error');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }
}

// ========================================
// INICIAR APLICACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', initApp);
