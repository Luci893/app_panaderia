/**
 * ========================================
 * STORAGE - Persistencia de Datos
 * ========================================
 * Maneja persistencia con Firebase Firestore y localStorage como fallback
 */

import { db } from './firebaseConfig.js';
import { collection, doc, getDocs, query, orderBy, writeBatch, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js';

const STORAGE_KEYS = {
    PRODUCTS: 'panaderia_productos',
    MOVEMENTS: 'panaderia_movimientos',
    SETTINGS: 'panaderia_ajustes'
};

const DEFAULT_SETTINGS = {
    thresholdLow: 10,
    thresholdCritical: 5
};

const COLLECTIONS = {
    PRODUCTS: 'productos',
    MOVEMENTS: 'movimientos',
    SETTINGS: 'configuracion'
};

function isFirestoreReady() {
    return db !== null;
}

async function loadData() {
    try {
        if (isFirestoreReady()) {
            const firebaseData = await loadFromFirebase();
            if (firebaseData) {
                return firebaseData;
            }
        }
        return loadFromLocalStorage();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        return loadFromLocalStorage();
    }
}

async function loadFromFirebase() {
    if (!isFirestoreReady()) return null;

    try {
        const productsSnapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
        const products = productsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        const movementsSnapshot = await getDocs(
            query(
                collection(db, COLLECTIONS.MOVEMENTS),
                orderBy('date', 'desc')
            )
        );
        const movements = movementsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        const settingsDoc = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'userSettings'));
        const settings = settingsDoc.exists() ? settingsDoc.data() : DEFAULT_SETTINGS;

        return { products, movements, settings };
    } catch (error) {
        console.error('Error cargando desde Firebase:', error);
        return null;
    }
}

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

async function saveProducts(products) {
    saveProductsToLocalStorage(products);

    if (isFirestoreReady()) {
        await saveProductsToFirebase(products);
    }
}

function saveProductsToLocalStorage(products) {
    try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (error) {
        console.error('Error al guardar productos en localStorage:', error);
    }
}

async function saveProductsToFirebase(products) {
    if (!isFirestoreReady()) return;

    try {
        const batch = writeBatch(db);
        const existingDocs = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
        existingDocs.forEach(docSnap => batch.delete(docSnap.ref));

        products.forEach(product => {
            const docRef = doc(db, COLLECTIONS.PRODUCTS, product.id);
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
    } catch (error) {
        console.error('Error guardando productos en Firebase:', error);
    }
}

async function saveMovements(movements) {
    saveMovementsToLocalStorage(movements);

    if (isFirestoreReady()) {
        await saveMovementsToFirebase(movements);
    }
}

function saveMovementsToLocalStorage(movements) {
    try {
        localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    } catch (error) {
        console.error('Error al guardar movimientos en localStorage:', error);
    }
}

async function saveMovementsToFirebase(movements) {
    if (!isFirestoreReady()) return;

    try {
        const batch = writeBatch(db);
        const existingDocs = await getDocs(collection(db, COLLECTIONS.MOVEMENTS));
        existingDocs.forEach(docSnap => batch.delete(docSnap.ref));

        movements.forEach(movement => {
            const docRef = doc(db, COLLECTIONS.MOVEMENTS, movement.id);
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
    } catch (error) {
        console.error('Error guardando movimientos en Firebase:', error);
    }
}

async function saveSettings(settings) {
    saveSettingsToLocalStorage(settings);

    if (isFirestoreReady()) {
        await saveSettingsToFirebase(settings);
    }
}

function saveSettingsToLocalStorage(settings) {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
        console.error('Error al guardar configuración en localStorage:', error);
    }
}

async function saveSettingsToFirebase(settings) {
    if (!isFirestoreReady()) return;

    try {
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'userSettings'), settings);
    } catch (error) {
        console.error('Error guardando configuración en Firebase:', error);
    }
}

export {
    loadData,
    saveProducts,
    saveMovements,
    saveSettings,
    DEFAULT_SETTINGS
};
