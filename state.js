/**
 * ========================================
 * STATE - Estado Global de la Aplicación
 * ========================================
 * Comparte el estado entre todos los módulos
 */

import { DEFAULT_SETTINGS } from './storage.js';

// Estado global de la aplicación
const state = {
    products: [],
    movements: [],
    settings: { ...DEFAULT_SETTINGS },
    currentView: 'stock',
    searchQuery: '',
    filterCategory: 'all',
    filterMovementType: 'all'
};

export default state;