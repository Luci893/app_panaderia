/**
 * ========================================
 * MOVEMENTS - Gestión de Movimientos
 * ========================================
 * Lógica para registrar ingresos y egresos de ingredientes
 */

import { saveProducts, saveMovements } from './storage.js';
import { showToast } from './ui.js';
import { generateId } from './products.js';

// ========================================
// REGISTRAR MOVIMIENTO
// ========================================

/**
 * Registra un movimiento (ingreso o egreso)
 * @param {string} productId - ID del producto
 * @param {string} type - Tipo de movimiento ('ingreso' o 'egreso')
 * @param {number} quantity - Cantidad del movimiento
 * @param {string} reason - Motivo (opcional)
 * @param {Array} products - Array de productos del state
 * @param {Array} movements - Array de movimientos del state
 * @param {Function} renderProductsFn - Función para renderizar productos
 * @param {Function} renderMovementsFn - Función para renderizar movimientos
 * @returns {boolean}
 */
function registerMovement(productId, type, quantity, reason, products, movements, renderProductsFn, renderMovementsFn) {
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    
    // Validar stock disponible para egresos
    if (type === 'egreso' && product.quantity < quantity) {
        showToast(`Stock insuficiente. Disponible: ${product.quantity} ${product.unit}`, 'error');
        return false;
    }
    
    // Actualizar stock del producto
    if (type === 'ingreso') {
        product.quantity += quantity;
    } else {
        product.quantity -= quantity;
    }
    product.updatedAt = Date.now();
    
    // Registrar el movimiento
    const movement = {
        id: generateId(),
        productId: productId,
        productName: product.name,
        type: type,
        quantity: quantity,
        unit: product.unit,
        reason: reason.trim(),
        date: Date.now()
    };
    
    movements.unshift(movement); // Agregar al inicio
    
    // Guardar en Firebase/localStorage
    saveProducts(products);
    saveMovements(movements);
    
    // Renderizar
    renderProductsFn();
    renderMovementsFn();
    
    const typeLabel = type === 'ingreso' ? 'ingreso' : 'egreso';
    showToast(`${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} registrado: ${quantity} ${product.unit}`);
    
    return true;
}

// ========================================
// LIMPIAR HISTORIAL
// ========================================

/**
 * Limpia el historial de movimientos
 * @param {Array} movements - Array de movimientos del state
 * @param {Function} renderFn - Función para renderizar
 */
function clearHistory(movements, renderFn) {
    if (confirm('¿Limpiar todo el historial de movimientos?')) {
        movements = [];
        saveMovements(movements);
        renderFn();
        showToast('Historial limpiado');
    }
}

// ========================================
// EXPORTAR
// ========================================

export {
    registerMovement,
    clearHistory
};