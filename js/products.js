/**
 * ========================================
 * PRODUCTS - Gestión de Ingredientes
 * ========================================
 * Lógica para agregar, editar, eliminar y gestionar ingredientes
 */

import { saveProducts } from './storage.js';

// ========================================
// CATEGORÍAS
// ========================================

const CATEGORIES = {
    harinas: 'Harinas',
    azucares: 'Azúcares',
    levaduras: 'Levaduras',
    grasas: 'Grasas',
    otros: 'Otros'
};

// ========================================
// GENERAR ID ÚNICO
// ========================================

/**
 * Genera un ID único para ingredientes
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ========================================
// CONVERSIONES
// ========================================

// Función de Conversión
function convertToGrams(quantity, unit) {
    quantity = Number(quantity);

    if (unit === "kg") {
        return quantity * 1000;
    }

    if (unit === "gr") {
        return quantity;
    }

    return quantity;
}

// Convierte una cantidad desde una unidad de origen a una unidad destino (solo gr/kg)
function convertUnit(quantity, fromUnit, toUnit) {
    quantity = Number(quantity);

    if (fromUnit === toUnit) return quantity;

    if (fromUnit === 'kg' && toUnit === 'gr') {
        return quantity * 1000;
    }

    if (fromUnit === 'gr' && toUnit === 'kg') {
        return quantity / 1000;
    }

    return quantity;
}

// Normaliza la cantidad/unidad de un producto para que siempre quede
// expresado en el rango más legible (evita 0.05 kg o 1500 gr)
function normalizeUnit(quantity, unit) {
    quantity = Number(quantity);

    if (unit === 'gr' && quantity >= 1000) {
        return { quantity: quantity / 1000, unit: 'kg' };
    }

    if (unit === 'kg' && quantity > 0 && quantity < 1) {
        return { quantity: quantity * 1000, unit: 'gr' };
    }

    return { quantity, unit };
}

// ========================================
// AGREGAR PRODUCTO
// ========================================

/**
 * Agrega un nuevo ingrediente
 * @param {Object} productData - Datos del producto
 * @param {Array} products - Array de productos del state
 */
function addProduct(productData, products) {
    const product = {
        id: generateId(),
        name: productData.name.trim(),
        category: productData.category,
        quantity: parseFloat(productData.quantity) || 0,
        unit: productData.unit,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    products.push(product);
    saveProducts(products);
    return product;
}

// ========================================
// ACTUALIZAR PRODUCTO
// ========================================

/**
 * Actualiza un ingrediente existente
 * @param {string} id - ID del producto
 * @param {Object} productData - Nuevos datos del producto
 * @param {Array} products - Array de productos del state
 * @returns {boolean}
 */
function updateProduct(id, productData, products) {
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;

    products[index] = {
        ...products[index],
        name: productData.name.trim(),
        category: productData.category,
        quantity: parseFloat(productData.quantity) || 0,
        unit: productData.unit,
        updatedAt: Date.now()
    };

    saveProducts(products);
    return true;
}

// ========================================
// ELIMINAR PRODUCTO
// ========================================

/**
 * Elimina un ingrediente
 * @param {string} id - ID del producto
 * @param {Array} products - Array de productos del state
 * @returns {boolean}
 */
function deleteProduct(id, products) {
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;

    products.splice(index, 1);
    saveProducts(products);
    return true;
}

// ========================================
// ESTADO DEL STOCK
// ========================================

/**
 * Obtiene el estado del stock de un ingrediente
 * @param {number} quantity - Cantidad actual
 * @returns {Object} */

function getStockStatus(quantity, unit, settings) {

    const grams = convertToGrams(quantity, unit);

    // Umbrales configurables (vienen en kg, los pasamos a gramos)
    const criticalGrams = (settings?.thresholdCritical ?? 5) * 1000;
    const lowGrams = (settings?.thresholdLow ?? 10) * 1000;

    if (grams <= 0) {
        return { status: 'out', label: 'Sin stock' };
    }

    if (grams <= criticalGrams) {
        return { status: 'low', label: 'Stock crítico' };
    }

    if (grams <= lowGrams) {
        return { status: 'medium', label: 'Bajo Stock' };
    }

    return { status: 'ok', label: 'Stock OK' };
}

// ========================================
// BUSCAR PRODUCTO
// ========================================

/**
 * Busca un producto por ID
 * @param {string} id - ID del producto
 * @param {Array} products - Array de productos
 * @returns {Object|undefined}
 */
function getProductById(id, products) {
    return products.find(p => p.id === id);
}

// ========================================
// EXPORTAR
// ========================================

export {
    CATEGORIES,
    generateId,
    addProduct,
    updateProduct,
    deleteProduct,
    getStockStatus,
    getProductById,
    convertUnit,
    normalizeUnit
};
