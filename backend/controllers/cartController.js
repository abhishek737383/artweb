const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log('Getting cart for user:', userId);

    let cart = await Cart.findOne({ userId })
      .populate({
        path: 'items.productId',
        select: '_id name slug description price compareAtPrice images category stock isActive isFeatured isBestSeller tags'
      });

    if (!cart) {
      console.log('No cart found, creating new cart');
      cart = await Cart.create({ userId, items: [] });
    }

    console.log('Cart found with', cart.items.length, 'items');

    // Format response
    const items = cart.items.map(item => {
      const product = item.productId;
      
      return {
        _id: item._id,
        product: product ? {
          _id: product._id,
          id: product._id,
          name: product.name || 'Unknown Product',
          slug: product.slug || '',
          sku: product.sku || '',
          description: product.description || '',
          price: product.price || 0,
          compareAtPrice: product.compareAtPrice || undefined,
          images: Array.isArray(product.images) ? product.images.map(img => {
            if (typeof img === 'string') {
              return { 
                url: img, 
                altText: product.name || '',
                isPrimary: false 
              };
            }
            return {
              url: img.url || '',
              altText: img.altText || product.name || '',
              isPrimary: img.isPrimary || false,
              publicId: img.publicId
            };
          }) : [],
          category: product.category || null,
          stock: product.stock || 0,
          isActive: product.isActive !== false,
          isFeatured: product.isFeatured || false,
          isBestSeller: product.isBestSeller || false,
          tags: product.tags || [],
          createdAt: product.createdAt || '',
          updatedAt: product.updatedAt || ''
        } : null,
        quantity: item.quantity || 1,
        addedAt: item.addedAt || cart.createdAt
      };
    }).filter(item => item.product); // Remove items with null products

    console.log('Formatted', items.length, 'items for response');

    res.status(200).json({
      success: true,
      data: {
        items,
        count: items.length,
        userId: cart.userId,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    console.log('Adding to cart - User:', userId, 'Product:', productId, 'Quantity:', quantity);

    // Validate input
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID is required'
      });
    }

    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('Product found:', product.name, 'Stock:', product.stock, 'Active:', product.isActive);

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      console.log('Creating new cart for user');
      cart = await Cart.create({ userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId.toString()
    );

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({ 
        productId, 
        quantity,
        addedAt: new Date()
      });
    }

    await cart.save();
    console.log('Cart saved successfully');

    // Get updated cart with populated products
    const updatedCart = await Cart.findOne({ userId })
      .populate({
        path: 'items.productId',
        select: '_id name slug description price compareAtPrice images category stock isActive isFeatured isBestSeller tags'
      });

    // Format response
    const items = updatedCart.items.map(item => {
      const product = item.productId;
      return {
        _id: item._id,
        product: product ? {
          _id: product._id,
          name: product.name || 'Unknown Product',
          slug: product.slug || '',
          price: product.price || 0,
          images: Array.isArray(product.images) ? product.images : [],
          stock: product.stock || 0
        } : null,
        quantity: item.quantity || 1
      };
    }).filter(item => item.product);

    console.log('Sending response with', items.length, 'items');

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      data: {
        items,
        count: items.length
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding product to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    console.log('Updating cart item - User:', userId, 'Product:', productId, 'New quantity:', quantity);

    // Validate input
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID is required'
      });
    }

    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    // Find cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find and update item quantity
    const itemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    console.log('Cart item updated successfully');

    res.status(200).json({
      success: true,
      message: 'Cart updated successfully'
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    console.log('Removing from cart - User:', userId, 'Product:', productId);

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID is required'
      });
    }

    // Find cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Remove item from cart
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => 
      item.productId.toString() !== productId.toString()
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    await cart.save();
    console.log('Item removed from cart');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log('Clearing cart for user:', userId);

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    console.log('Cart cleared successfully');

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};