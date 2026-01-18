const express = require('express');
const router = express.Router();
const adminOrderController = require('../controllers/adminOrderController');

// All admin order routes - NO AUTH MIDDLEWARE (for development/testing only)
// IMPORTANT: In production, you should add proper admin authentication

// Get order statistics - MUST COME BEFORE :orderId route
router.get('/stats', adminOrderController.getOrderStats);

// Export orders - MUST COME BEFORE :orderId route
router.get('/export', adminOrderController.exportOrders);

// Get all orders with filters
router.get('/', adminOrderController.getOrders);

// Get order by ID
router.get('/:orderId', adminOrderController.getOrderById);

// Update order status
router.put('/:orderId/status', adminOrderController.updateOrderStatus);

// Update payment status
router.put('/:orderId/payment', adminOrderController.updatePaymentStatus);

// Bulk update orders
router.put('/bulk-update', adminOrderController.bulkUpdateOrders);

// Delete order
router.delete('/:orderId', adminOrderController.deleteOrder);

module.exports = router;