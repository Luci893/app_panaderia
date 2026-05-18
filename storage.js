/**
 * ========================================
 * STORAGE - Persistencia de Datos
 * ========================================
 * Maneja persistencia con Firebase Firestore y localStorage como fallback
 */

import { isFirebaseReady, getFirestore } from './firebaseConfig.js';

// ========================================
// CONSTANTES
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

// ========================================
// COLECCIONES DE FIRESTORE
// ========================================

const COLLECTIONS = {
    PRODUCTS: 'productos',
    MOVEMENTS: 'movimientos',
    SETTINGS: 'configuracion'
};

// ========================================
// CARGAR DATOS DESDE FIREBASE O LOCALSTORAGE
// ========================================

/**
 * Carga datos desde Firebase (primero) o localStorage (fallback)
 */
async function loadData() {
    try {
        // Intentar cargar desde Firebase primero
        if (isFirebaseReady()) {
            const firebaseData = await loadFromFirebase();
            if (firebaseData) {
                console.log('📥 Datos cargados desde Firebase');
                return firebaseData;
            }
        }

        // Fallback a localStorage
        console.log('📥 Datos cargados desde localStorage');
        return loadFromLocalStorage();

    } catch (error) {
        console.error('Error al cargar datos:', error);
        return loadFromLocalStorage();
    }
}

/**
 * Carga datos desde Firestore
 * @returns {Promise<Object|null>}
 */
async function loadFromFirebase() {
    const db = getFirestore();
    if (!db) return null;

    try {
        // Cargar productos
        const productsSnapshot = await db.collection(COLLECTIONS.PRODUCTS).get();
        const products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Cargar movimientos
        const movementsSnapshot = await db.collection(COLLECTIONS.MOVEMENTS)
            .orderBy('date', 'desc')
            .get();
        const movements = movementsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Cargar configuración
        const settingsDoc = await db.collection(COLLECTIONS.SETTINGS).doc('userSettings').get();
        const settings = settingsDoc.exists ? settingsDoc.data() : DEFAULT_SETTINGS;

        return { products, movements, settings };

    } catch (error) {
        console.error('Error cargando desde Firebase:', error);
        return null;
    }
}

/**
 * Carga datos desde localStorage
 * @returns {Object}
 */
function loadFromLocalStorage() {
    try {
        const products = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        const movements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
        const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

        return {
            products: products ? JSON.parse(products) : [],
            movements: movements ? JSON.parse(movements) : [],
            settings: settings ? { ...DEFAULT_SETTINGS, ...JSON.parse(settings) } : { ...DEFAULT_SETTINGS }
        };
    } catch (error) {
        console.error('Error al cargar desde localStorage:', error);
        return {
            products: [],
            movements: [],
            settings: { ...DEFAULT_SETTINGS }
        };
    }
}

// ========================================
// GUARDAR PRODUCTOS
// ========================================

/**
 * Guarda productos en Firebase y localStorage
 * @param {Array} products - Array de productos
 */
async function saveProducts(products) {
    // Guardar en localStorage (siempre)
    saveProductsToLocalStorage(products);

    // Guardar en Firebase si está disponible
    if (isFirebaseReady()) {
        await saveProductsToFirebase(products);
    }
}

/**
 * Guarda productos en localStorage
 */
function saveProductsToLocalStorage(products) {
    try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (error) {
        console.error('Error al guardar productos en localStorage:', error);
    }
}

/**
 * Guarda productos en Firestore
 */
async function saveProductsToFirebase(products) {
    const db = getFirestore();
    if (!db) return;

    try {
        const batch = db.batch();

        // Eliminar todos los productos existentes
        const existingDocs = await db.collection(COLLECTIONS.PRODUCTS).get();
        existingDocs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Agregar todos los productos
        products.forEach(product => {
            const docRef = db.collection(COLLECTIONS.PRODUCTS).doc(product.id);
            batch.set(docRef, {
                name: product.name,
                category: product.category,
                quantity: product.quantity,
                unit: product.unit,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            });
        });

        await batch.commit();
        console.log('✅ Productos guardados en Firebase');
    } catch (error) {
        console.error('Error al guardar productos en Firebase:', error);
    }
}

// ========================================
// GUARDAR MOVIMIENTOS
// ========================================

/**
 * Guarda movimientos en Firebase y localStorage
 * @param {Array} movements - Array de movimientos
 */
async function saveMovements(movements) {
    // Guardar en localStorage (siempre)
    saveMovementsToLocalStorage(movements);

    // Guardar en Firebase si está disponible
    if (isFirebaseReady()) {
        await saveMovementsToFirebase(movements);
    }
}

/**
 * Guarda movimientos en localStorage
 */
function saveMovementsToLocalStorage(movements) {
    try {
        localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    } catch (error) {
        console.error('Error al guardar movimientos en localStorage:', error);
    }
}

/**
 * Guarda movimientos en Firestore
 */
async function saveMovementsToFirebase(movements) {
    const db = getFirestore();
    if (!db) return;

    try {
        const batch = db.batch();

        // Eliminar todos los movimientos existentes
        const existingDocs = await db.collection(COLLECTIONS.MOVEMENTS).get();
        existingDocs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Agregar todos los movimientos
        movements.forEach(movement => {
            const docRef = db.collection(COLLECTIONS.MOVEMENTS).doc(movement.id);
            batch.set(docRef, {
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
        console.log('✅ Movimientos guardados en Firebase');
    } catch (error) {
        console.error('Error al guardar movimientos en Firebase:', error);
    }
}

// ========================================
// GUARDAR CONFIGURACIÓN
// ========================================

/**
 * Guarda configuración en Firebase y localStorage
 * @param {Object} settings - Objeto de configuración
 */
async function saveSettings(settings) {
    // Guardar en localStorage (siempre)
    saveSettingsToLocalStorage(settings);

    // Guardar en Firebase si está disponible
    if (isFirebaseReady()) {
        await saveSettingsToFirebase(settings);
    }
}

/**
 * Guarda configuración en localStorage
 */
function saveSettingsToLocalStorage(settings) {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
        console.error('Error al guardar configuración en localStorage:', error);
    }
}

/**
 * Guarda configuración en Firestore
 */
async function saveSettingsToFirebase(settings) {
    const db = getFirestore();
    if (!db) return;

    try {
        await db.collection(COLLECTIONS.SETTINGS).doc('userSettings').set(settings);
        console.log('✅ Configuración guardada en Firebase');
    } catch (error) {
        console.error('Error al guardar configuración en Firebase:', error);
    }
}

// ========================================
// EXPORTAR
// ========================================

export {
    loadData,
    saveProducts,
    saveMovements,
    saveSettings,
    STORAGE_KEYS,
    DEFAULT_SETTINGS
};