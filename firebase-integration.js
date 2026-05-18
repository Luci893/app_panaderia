/**
 * ========================================
 * FIREBASE INTEGRATION - Integración con Firebase
 * ========================================
 * Agrega persistencia en la nube sin cambiar la lógica existente
 * 
 * USO: Agregar al final de app_panaderia.js o importar después de él
 */

// ========================================
// CONFIGURACIÓN - Reemplaza con tus datos de Firebase Console
// ========================================

const FIREBASE_CONFIG = {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// ========================================
// VARIABLES DE FIREBASE
// ========================================

let firebaseDb = null;
let firebaseReady = false;

// ========================================
// INICIALIZAR FIREBASE
// ========================================

/**
 * Inicializa Firebase y Firestore
 * @returns {Promise<boolean>}
 */
async function initFirebase() {
    try {
        // Verificar si Firebase SDK está disponible
        if (typeof firebase === 'undefined') {
            console.log('⚠️ Firebase SDK no cargado');
            return false;
        }

        // Inicializar Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }

        // Obtener Firestore
        firebaseDb = firebase.firestore();
        
        // Habilitar persistencia offline
        try {
            await firebaseDb.enablePersistence({ synchronizeTabs: true });
            console.log('✅ Firestore offline habilitado');
        } catch (e) {
            console.log('⚠️ Persistencia offline no disponible:', e.message);
        }

        firebaseReady = true;
        console.log('✅ Firebase Firestore conectado');
        return true;

    } catch (error) {
        console.error('❌ Error inicializando Firebase:', error);
        return false;
    }
}

// ========================================
// SINCRONIZACIÓN CON FIRESTORE
// ========================================

const COLLECTIONS = {
    PRODUCTS: 'productos',
    MOVEMENTS: 'movimientos',
    SETTINGS: 'configuracion'
};

/**
 * Sincroniza productos desde Firestore
 */
async function syncProductsFromCloud() {
    if (!firebaseReady || !firebaseDb) return null;
    
    try {
        const snapshot = await firebaseDb.collection(COLLECTIONS.PRODUCTS).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error sincronizando productos:', error);
        return null;
    }
}

/**
 * Sincroniza productos hacia Firestore
 */
async function syncProductsToCloud(products) {
    if (!firebaseReady || !firebaseDb) return;
    
    try {
        const batch = firebaseDb.batch();
        
        // Eliminar todos los documentos existentes
        const existing = await firebaseDb.collection(COLLECTIONS.PRODUCTS).get();
        existing.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Agregar productos actuales
        products.forEach(product => {
            const ref = firebaseDb.collection(COLLECTIONS.PRODUCTS).doc(product.id);
            batch.set(ref, {
                name: product.name,
                category: product.category,
                quantity: product.quantity,
                unit: product.unit,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            });
        });
        
        await batch.commit();
        console.log('✅ Productos sincronizados con la nube');
    } catch (error) {
        console.error('Error sincronizando a la nube:', error);
    }
}

/**
 * Sincroniza movimientos desde Firestore
 */
async function syncMovementsFromCloud() {
    if (!firebaseReady || !firebaseDb) return null;
    
    try {
        const snapshot = await firebaseDb.collection(COLLECTIONS.MOVEMENTS)
            .orderBy('date', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error sincronizando movimientos:', error);
        return null;
    }
}

/**
 * Sincroniza movimientos hacia Firestore
 */
async function syncMovementsToCloud(movements) {
    if (!firebaseReady || !firebaseDb) return;
    
    try {
        const batch = firebaseDb.batch();
        
        const existing = await firebaseDb.collection(COLLECTIONS.MOVEMENTS).get();
        existing.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        movements.forEach(movement => {
            const ref = firebaseDb.collection(COLLECTIONS.MOVEMENTS).doc(movement.id);
            batch.set(ref, {
                productId: movement.productId,
                productName: movement.productName,
                type: movement.type,
                quantity: movement.quantity,
                unit: movement.unit,
                reason: movement.reason,
                date: movement.date
            });
        });
        
        await batch.commit();
        console.log('✅ Movimientos sincronizados con la nube');
    } catch (error) {
        console.error('Error sincronizando movimientos a la nube:', error);
    }
}

/**
 * Sincroniza configuración desde Firestore
 */
async function syncSettingsFromCloud() {
    if (!firebaseReady || !firebaseDb) return null;
    
    try {
        const doc = await firebaseDb.collection(COLLECTIONS.SETTINGS).doc('userSettings').get();
        return doc.exists ? doc.data() : null;
    } catch (error) {
        console.error('Error sincronizando configuración:', error);
        return null;
    }
}

/**
 * Sincroniza configuración hacia Firestore
 */
async function syncSettingsToCloud(settings) {
    if (!firebaseReady || !firebaseDb) return;
    
    try {
        await firebaseDb.collection(COLLECTIONS.SETTINGS).doc('userSettings').set(settings);
        console.log('✅ Configuración sincronizada con la nube');
    } catch (error) {
        console.error('Error sincronizando configuración a la nube:', error);
    }
}

// ========================================
// MEJORAR FUNCIONES EXISTENTES
// ========================================

/**
 * Mejora loadData para intentar cargar desde Firebase primero
 */
const originalLoadData = window.loadData;

window.loadData = async function() {
    // Ejecutar carga original de localStorage
    if (originalLoadData) {
        originalLoadData();
    }
    
    // Intentar sincronizar con Firebase
    if (firebaseReady) {
        const cloudProducts = await syncProductsFromCloud();
        const cloudMovements = await syncMovementsFromCloud();
        const cloudSettings = await syncSettingsFromCloud();
        
        // Si hay datos en la nube, usarlos (sobrescribir localStorage)
        if (cloudProducts && cloudProducts.length > 0) {
            state.products = cloudProducts;
            localStorage.setItem('panaderia_productos', JSON.stringify(cloudProducts));
            console.log('📥 Productos cargados desde Firebase');
        }
        
        if (cloudMovements && cloudMovements.length > 0) {
            state.movements = cloudMovements;
            localStorage.setItem('panaderia_movimientos', JSON.stringify(cloudMovements));
        }
        
        if (cloudSettings) {
            state.settings = { ...DEFAULT_SETTINGS, ...cloudSettings };
            localStorage.setItem('panaderia_ajustes', JSON.stringify(state.settings));
        }
    }
};

/**
 * Mejora saveProducts para sincronizar con Firebase
 */
const originalSaveProducts = window.saveProducts;

window.saveProducts = function() {
    if (originalSaveProducts) {
        originalSaveProducts();
    }
    
    if (firebaseReady) {
        syncProductsToCloud(state.products);
    }
};

/**
 * Mejora saveMovements para sincronizar con Firebase
 */
const originalSaveMovements = window.saveMovements;

window.saveMovements = function() {
    if (originalSaveMovements) {
        originalSaveMovements();
    }
    
    if (firebaseReady) {
        syncMovementsToCloud(state.movements);
    }
};

/**
 * Mejora saveSettings para sincronizar con Firebase
 */
const originalSaveSettings = window.saveSettings;

window.saveSettings = function() {
    if (originalSaveSettings) {
        originalSaveSettings();
    }
    
    if (firebaseReady) {
        syncSettingsToCloud(state.settings);
    }
};

// ========================================
// AUTO-INICIALIZAR
// ========================================

// Auto-inicializar Firebase cuando se cargue el script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initFirebase();
    });
} else {
    initFirebase();
}

// Exportar funciones
window.firebaseIntegration = {
    initFirebase,
    syncProductsFromCloud,
    syncProductsToCloud,
    syncMovementsFromCloud,
    syncMovementsToCloud,
    syncSettingsFromCloud,
    syncSettingsToCloud,
    isReady: () => firebaseReady
};