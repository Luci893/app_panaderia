/**
 * ========================================
 * FIREBASE CONFIG - Configuración de Firebase
 * ========================================
 * Inicializa Firebase Firestore para persistencia remota
 */

// ========================================
// CONFIGURACIÓN DE FIREBASE
// ========================================

import { initializeApp as firebaseInitializeApp } from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js';
import { getFirestore as firebaseGetFirestore } from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js';

export const firebaseConfig = {
    apiKey: "AIzaSyBlQcIUH-eya-e93HSoFqd0yPYg8M2Y3gw",
    authDomain: "bd-panaderia-f4fb0.firebaseapp.com",
    projectId: "bd-panaderia-f4fb0",
    storageBucket: "bd-panaderia-f4fb0.firebasestorage.app",
    messagingSenderId: "824110631777",
    appId: "1:824110631777:web:f1bfa03d359b2d5d599320",
    measurementId: "G-X0TEKD2Y7D"
};

// Estado de Firebase
export let db = null;

/**
 * Inicializa Firebase y Firestore
 * @returns {Promise<Firestore|null>} - true si se inicializó correctamente
 */
export async function initializeApp() {
    if (db) {
        return db;
    }

    try {
        const app = firebaseInitializeApp(firebaseConfig);
        db = firebaseGetFirestore(app);
        return db;
    } catch (error) {
        console.error('❌ Error al inicializar Firebase:', error);
        return null;
    }
}

/**
 * Obtiene la instancia de Firestore
 * @returns {Firestore|null}
 */
export function getFirestore() {
    return db;
}
