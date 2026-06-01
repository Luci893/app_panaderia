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
 * @returns {Object}
 */
function getStockStatus(quantity) {
    if (quantity <= 0) {
        return { status: 'out', label: 'Sin stock' };
    } else if (quantity <= 5) {
        return { status: 'low', label: 'Bajo stock' };
    } else if (quantity <= 20) {
        return { status: 'medium', label: 'Stock medio' };
    } else {
        return { status: 'ok', label: 'Stock OK' };
    }
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
    getProductById
};
