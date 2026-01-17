const express = require('express');
const router = express.Router();
const adminOrderController = require('../controllers/adminOrderController');
const { auth } = require('../middleware/auth');

// All routes require authentication only
router.use(auth);

// Order of routes is important! More specific routes should come first
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