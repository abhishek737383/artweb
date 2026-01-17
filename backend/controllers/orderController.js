const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      shippingAddress,
      paymentMethod = 'cod',
      paymentDetails = {},
      orderNotes = '',
      saveAddress = false
    } = req.body;

    console.log('Creating order for user:', userId);
    console.log('Shipping address:', shippingAddress);
    console.log('Payment method:', paymentMethod);

    // Validate required fields
    if (!shippingAddress || !shippingAddress.firstName || !shippingAddress.lastName ||
        !shippingAddress.email || !shippingAddress.phone || !shippingAddress.address ||
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required shipping address fields'
      });
    }

    // Validate payment method
    if (!['credit_card', 'upi', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // Get user's cart with populated products
    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      select: '_id name price images stock isActive'
    });

    console.log('Cart found:', cart ? cart.items.length : 0, 'items');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate cart items and prepare order items
    const invalidItems = [];
    const orderItems = [];

    for (const item of cart.items) {
      console.log('Processing cart item:', item);
      
      if (!item.productId) {
        invalidItems.push('Item with invalid product');
        continue;
      }

      const product = item.productId;

      console.log('Product details:', {
        name: product.name,
        isActive: product.isActive,
        stock: product.stock,
        price: product.price
      });

      if (!product.isActive) {
        invalidItems.push(`${product.name} is not available`);
        continue;
      }

      if (product.stock < item.quantity) {
        invalidItems.push(`Only ${product.stock} items of ${product.name} available`);
        continue;
      }

      orderItems.push({
        productId: product._id,
        productName: product.name || 'Unknown Product',
        quantity: item.quantity || 1,
        price: product.price || 0,
        image: product.images && product.images.length > 0 
          ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url)
          : ''
      });
    }

    console.log('Order items prepared:', orderItems.length);
    console.log('Invalid items:', invalidItems.length);

    if (invalidItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some items in your cart are not available',
        errors: invalidItems
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid items in cart'
      });
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = subtotal > 499 ? 0 : 50; // Free shipping over ₹499
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + shippingFee + tax;

    console.log('Calculated totals:', { subtotal, shippingFee, tax, total });

    // Prepare payment details
    const paymentInfo = {
      method: paymentMethod,
      status: paymentMethod === 'cod' ? 'pending' : 'paid'
    };

    // Add payment-specific details
    if (paymentMethod === 'upi' && paymentDetails.upiId) {
      paymentInfo.upiId = paymentDetails.upiId;
    } else if (paymentMethod === 'credit_card' && paymentDetails.cardNumber) {
      paymentInfo.cardLastFour = paymentDetails.cardNumber.slice(-4);
      paymentInfo.transactionId = `TXN${Date.now()}`;
    }

    // Create order
    const order = new Order({
      userId,
      items: orderItems,
      shippingAddress: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        apartment: shippingAddress.apartment || '',
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country || 'India'
      },
      payment: paymentInfo,
      orderStatus: 'pending',
      subtotal,
      shippingFee,
      tax,
      total,
      orderNotes: orderNotes || ''
    });

    console.log('Order object created, saving...');

    // Save order
    const savedOrder = await order.save();
    console.log('Order saved with ID:', savedOrder._id);

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
      console.log(`Updated stock for product ${item.productId}: -${item.quantity}`);
    }

    // Clear user's cart
    await Cart.findOneAndUpdate({ userId }, { items: [] });
    console.log('Cart cleared for user:', userId);

    // Save address if requested
    if (saveAddress) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: {
          addresses: {
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            email: shippingAddress.email,
            phone: shippingAddress.phone,
            address: shippingAddress.address,
            apartment: shippingAddress.apartment || '',
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode,
            country: shippingAddress.country || 'India',
            isDefault: true
          }
        }
      });
      console.log('Address saved for user:', userId);
    }

    // Populate user for response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate({
        path: 'user',
        select: 'name email'
      })
      .lean();

    console.log('Order process completed successfully');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: {
          _id: populatedOrder._id,
          orderNumber: populatedOrder.orderNumber,
          userId: populatedOrder.userId,
          items: populatedOrder.items,
          shippingAddress: populatedOrder.shippingAddress,
          payment: populatedOrder.payment,
          orderStatus: populatedOrder.orderStatus,
          subtotal: populatedOrder.subtotal,
          shippingFee: populatedOrder.shippingFee,
          tax: populatedOrder.tax,
          total: populatedOrder.total,
          orderNotes: populatedOrder.orderNotes,
          createdAt: populatedOrder.createdAt,
          updatedAt: populatedOrder.updatedAt,
          user: populatedOrder.user ? {
            _id: populatedOrder.user._id,
            name: populatedOrder.user.name,
            email: populatedOrder.user.email
          } : null
        }
      }
    });
  } catch (error) {
    console.error('Create order error details:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders/user
// @access  Private
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 10,
      status,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('Getting orders for user:', userId);

    // Build query
    const query = { userId };

    // Status filter
    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search by order number
    if (search && search.trim() !== '') {
      query.orderNumber = { $regex: search.trim(), $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count
    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Get orders
    const orders = await Order.find(query)
      .populate({
        path: 'user',
        select: 'name email'
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log('Found', orders.length, 'orders for user');

    // Format response
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      shippingAddress: order.shippingAddress,
      paymentMethod: order.payment.method,
      paymentStatus: order.payment.status,
      orderStatus: order.orderStatus,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      tax: order.tax,
      total: order.total,
      orderNotes: order.orderNotes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      user: order.user ? {
        name: order.user.name,
        email: order.user.email
      } : null
    }));

    res.status(200).json({
      success: true,
      data: {
        orders: formattedOrders,
        total,
        totalPages,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    console.log('Getting order by ID:', id, 'for user:', userId);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findOne({ _id: id, userId })
      .populate({
        path: 'user',
        select: 'name email phone'
      })
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('Order found:', order.orderNumber);

    // Format response
    const formattedOrder = {
      _id: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      shippingAddress: order.shippingAddress,
      paymentMethod: order.payment.method,
      paymentStatus: order.payment.status,
      orderStatus: order.orderStatus,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      tax: order.tax,
      total: order.total,
      orderNotes: order.orderNotes,
      adminNotes: order.adminNotes,
      trackingNumber: order.trackingNumber,
      shippingProvider: order.shippingProvider,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      cancelledReason: order.cancelledReason,
      user: order.user ? {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone
      } : null
    };

    res.status(200).json({
      success: true,
      data: {
        order: formattedOrder
      }
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { reason = '' } = req.body;

    console.log('Cancelling order:', id, 'for user:', userId);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Update order status
    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledReason = reason;
    order.updatedAt = new Date();
    
    await order.save();

    console.log('Order cancelled:', order.orderNumber);

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
      console.log(`Restored stock for product ${item.productId}: +${item.quantity}`);
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};