const express = require('express');
const router = express.Router();
const wishlistController = require('../../controllers/admin/wishlistController');
// const { auth } = require('../../middleware/auth');

// All routes require authentication
// IMPORTANT: Specific route must come BEFORE parameterized route
router.delete('/bulk-delete',  wishlistController.bulkDeleteWishlists);
router.delete('/:id',  wishlistController.deleteWishlist);

router.get('/', wishlistController.getWishlists);
router.get('/stats', wishlistController.getWishlistStats);

module.exports = router;