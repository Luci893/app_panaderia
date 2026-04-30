/**
 * ========================================
 * APP - Inicialización de la Aplicación
 * ========================================
 * Punto de entrada principal de la aplicación modularizada
 */

import { initializeFirebase } from './firebaseConfig.js';
import { loadData, DEFAULT_SETTINGS } from './storage.js';
import { initEventListeners } from './events.js';
import { renderProducts, renderMovements, updateSettingsInputs } from './ui.js';
import { getProductById } from './products.js';

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
        // Intentar inicializar Firebase
        await initializeFirebase();
        
        // Cargar datos (desde Firebase o localStorage)
        const data = await loadData();
        
        state.products = data.products || [];
        state.movements = data.movements || [];
        state.settings = data.settings || { ...DEFAULT_SETTINGS };
        
        // Actualizar inputs de configuración
        updateSettingsInputs(state.settings);
        
        // Inicializar event listeners
        initEventListeners(state);
        
        // Configurar funciones globales para onclick en HTML
        setupGlobalFunctions();
        
        // Renderizar vistas iniciales
        renderProducts(state.products, state.searchQuery, state.filterCategory);
        renderMovements(state.movements, state.filterMovementType);
        
        console.log('✅ Aplicación lista');
        
    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
    }
}

// ========================================
// FUNCIONES GLOBALES (para onclick en HTML)
// ========================================

/**
 * Configura las funciones globales necesarias para los onclick en HTML
 * Estas funciones se definen aquí para evitar problemas con require() en navegador
 */
function setupGlobalFunctions() {
    // Importar funciones de ui de forma dinámica
    import('./ui.js').then(ui => {
        // Función para editar producto
        window.editProduct = function(id) {
            const product = getProductById(id, state.products);
            if (product) {
                ui.openProductModal(product);
            }
        };
    });
    
    // Función para eliminar producto - se define directamente aquí
    // para evitar problemas de importación dinámica
    window.deleteProduct = function(id) {
        const product = getProductById(id, state.products);
        if (!product) return;
        
        if (confirm(`¿Eliminar "${product.name}" del inventario?`)) {
            state.products = state.products.filter(p => p.id !== id);
            
            // Importar storage dinámicamente
            import('./storage.js').then(storage => {
                storage.saveProducts(state.products);
            });
            
            renderProducts(state.products, state.searchQuery, state.filterCategory);
            
            // Importar ui para showToast
            import('./ui.js').then(ui => {
                ui.showToast('Ingrediente eliminado');
            });
        }
    };
    
    // Función para abrir modal de movimiento
    window.openMovementModal = function(productId) {
        import('./ui.js').then(ui => {
            ui.openMovementModal(productId, state.products);
        });
    };
}

// ========================================
// INICIAR APLICACIÓN
// ========================================

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