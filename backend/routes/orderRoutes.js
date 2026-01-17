const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth } = require('../middleware/auth');

// All order routes require authentication
router.use(auth);

// POST /api/orders - Create new order
router.post('/', orderController.createOrder);

// GET /api/orders/user - Get user's orders
router.get('/user', orderController.getUserOrders);

// GET /api/orders/:id - Get order by ID
router.get('/:id', orderController.getOrderById);

// PUT /api/orders/:id/cancel - Cancel order
router.put('/:id/cancel', orderController.cancelOrder);

module.exports = router;