/**
 * ========================================
 * FIREBASE CONFIG - Configuración de Firebase
 * ========================================
 * Inicializa Firebase Firestore para persistencia remota
 */

// ========================================
// CONFIGURACIÓN DE FIREBASE
// ========================================

// IMPORTANTE: Reemplaza estos valores con los de tu proyecto en Firebase Console
// Para obtenerlos: Firebase Console → Configuración del proyecto → Tus apps → Configuración
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// Estado de Firebase
let db = null;
let firebaseInitialized = false;

/**
 * Inicializa Firebase y Firestore
 * @returns {Promise<boolean>} - true si se inicializó correctamente
 */
async function initializeFirebase() {
    try {
        // Verificar si Firebase ya está disponible
        if (typeof firebase === 'undefined') {
            console.log('⚠️ Firebase SDK no cargado - usando solo localStorage');
            return false;
        }

        // Inicializar Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Obtener instancia de Firestore
        db = firebase.firestore();
        
        // Configurar Firestore para offline
        db.enablePersistence({ synchronizeTabs: true })
            .then(() => {
                console.log('✅ Firestore offline habilitado');
            })
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.log('⚠️ Persistencia offline no disponible en esta sesión');
                } else if (err.code === 'unimplemented') {
                    console.log('⚠️ Persistencia offline no soportada en este navegador');
                }
            });

        firebaseInitialized = true;
        console.log('✅ Firebase Firestore inicializado');
        return true;

    } catch (error) {
        console.error('❌ Error al inicializar Firebase:', error);
        return false;
    }
}

/**
 * Verifica si Firebase está inicializado
 * @returns {boolean}
 */
function isFirebaseReady() {
    return firebaseInitialized && db !== null;
}

/**
 * Obtiene la instancia de Firestore
 * @returns {Firestore|null}
 */
function getFirestore() {
    return db;
}

// Exportar funciones
export { initializeFirebase, isFirebaseReady, getFirestore, firebaseConfig };