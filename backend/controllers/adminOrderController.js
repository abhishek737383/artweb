const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// Get all orders (admin)
exports.getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      userId,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    // Apply filters
    if (userId) {
      query.userId = userId;
    }

    if (status && status !== 'all') {
      query.orderStatus = status; // Changed from 'status' to 'orderStatus'
    }

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

    // Search by order number or customer name/email
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      
      // Get users matching the search
      const users = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id').lean();
      
      query.$or = [
        { orderNumber: searchRegex },
        { userId: { $in: users.map(u => u._id) } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Fetch orders with user details
    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          _id: order._id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          user: order.userId ? {
            _id: order.userId._id,
            name: order.userId.name,
            email: order.userId.email,
            phone: order.userId.phone
          } : null,
          items: order.items,
          shippingAddress: order.shippingAddress,
          paymentMethod: order.payment.method, // Changed from payment.method
          paymentStatus: order.payment.status, // Changed from payment.status
          orderStatus: order.orderStatus, // Changed from status
          subtotal: order.subtotal,
          shippingFee: order.shippingFee,
          tax: order.tax,
          total: order.total,
          orderNotes: order.orderNotes,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          deliveredAt: order.deliveredAt,
          cancelledAt: order.cancelledAt
        })),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get order by ID (admin)
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          user: order.userId ? {
            _id: order.userId._id,
            name: order.userId.name,
            email: order.userId.email,
            phone: order.userId.phone
          } : null,
          items: order.items,
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
          cancelledReason: order.cancelledReason
        }
      }
    });
  } catch (error) {
    console.error('Admin get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    // Total orders and revenue
    const totalStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' }
        }
      }
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          percentage: {
            $multiply: [
              { $divide: ['$count', totalStats[0]?.totalOrders || 1] },
              100
            ]
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Pending orders count
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .lean();

    // Daily revenue for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Convert to object for easy lookup
    const dailyMap = {};
    dailyAgg.forEach(item => {
      dailyMap[item._id] = {
        revenue: item.revenue,
        orders: item.orders
      };
    });

    // Fill in missing dates with 0
    const dailyRevenue = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      dailyRevenue.push({
        date: dateStr,
        revenue: dailyMap[dateStr]?.revenue || 0,
        orders: dailyMap[dateStr]?.orders || 0
      });
    }

    // Top products (by revenue)
    const topProductsAgg = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Get product images for top products
    const topProducts = await Promise.all(
      topProductsAgg.map(async (item) => {
        const product = await Product.findById(item._id).select('images').lean();
        return {
          productId: item._id,
          productName: item.productName,
          quantity: item.quantity,
          revenue: item.revenue,
          image: product?.images?.[0]?.url || product?.images?.[0] || ''
        };
      })
    );

    const stats = {
      totalOrders: totalStats[0]?.totalOrders || 0,
      totalRevenue: totalStats[0]?.totalRevenue || 0,
      avgOrderValue: totalStats[0]?.avgOrderValue || 0,
      pendingOrders,
      ordersByStatus,
      topProducts,
      recentOrders: recentOrders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        user: order.userId ? {
          name: order.userId.name,
          email: order.userId.email
        } : null,
        items: order.items,
        orderStatus: order.orderStatus,
        paymentStatus: order.payment.status,
        total: order.total,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress
      })),
      dailyRevenue
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes, trackingNumber, shippingProvider } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    order.orderStatus = status;
    order.updatedAt = new Date();

    // Set tracking info if provided
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    if (shippingProvider) {
      order.shippingProvider = shippingProvider;
    }

    // Set delivered/cancelled dates
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    } else if (status === 'cancelled') {
      order.cancelledAt = new Date();
      if (notes) {
        order.cancelledReason = notes;
      }
    }

    // Add admin notes if provided
    if (notes && status !== 'cancelled') {
      order.adminNotes = notes;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, transactionId } = req.body;

    // Validate payment status
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.payment.status = status;
    order.updatedAt = new Date();
    
    if (transactionId) {
      order.payment.transactionId = transactionId;
    }

    // If payment is paid and order is pending, update to confirmed
    if (status === 'paid' && order.orderStatus === 'pending') {
      order.orderStatus = 'confirmed';
    }

    await order.save();

    res.json({
      success: true,
      message: 'Payment status updated',
      data: order
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Bulk update orders
exports.bulkUpdateOrders = async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No orders selected'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const updateData = { orderStatus: status, updatedAt: new Date() };
    
    // Set delivered/cancelled dates
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
    }

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} orders updated`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Bulk update orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Restore product stock before deleting
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    await Order.findByIdAndDelete(orderId);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Export orders data
exports.exportOrders = async (req, res) => {
  try {
    const { format = 'csv', status, startDate, endDate } = req.query;

    // Build query
    const query = {};

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

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

    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'csv') {
      // Generate CSV
      let csv = 'Order Number,Date,Customer Name,Customer Email,Items Count,Subtotal,Shipping,Tax,Total,Payment Method,Payment Status,Order Status,Shipping City,Shipping State,Tracking Number,Notes\n';
      
      orders.forEach(order => {
        const row = [
          order.orderNumber,
          new Date(order.createdAt).toLocaleDateString(),
          order.userId?.name || '',
          order.userId?.email || '',
          order.items.length,
          order.subtotal,
          order.shippingFee,
          order.tax,
          order.total,
          order.payment.method,
          order.payment.status,
          order.orderStatus,
          order.shippingAddress.city,
          order.shippingAddress.state,
          order.trackingNumber || '',
          order.orderNotes || ''
        ].map(field => `"${field}"`).join(',');
        
        csv += row + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`);
      res.send(csv);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.json`);
      res.send(JSON.stringify(orders, null, 2));
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid export format'
      });
    }
  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};