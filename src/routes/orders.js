const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
} = require('../api/orders');

// GET /api/orders - Get all orders
router.get('/', getOrders);

// GET /api/orders/:id - Get single order
router.get('/:id', getOrderById);

// POST /api/orders - Create new order
router.post('/', createOrder);

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', updateOrderStatus);

// DELETE /api/orders/:id - Delete order
router.delete('/:id', deleteOrder);

module.exports = router;
