const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for products
cartSchema.virtual('products', {
  ref: 'Product',
  localField: 'items.productId',
  foreignField: '_id',
  justOne: false
});

// Pre-save middleware to update updatedAt
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get cart with populated products
cartSchema.statics.getCartWithProducts = async function(userId) {
  return await this.findOne({ userId })
    .populate({
      path: 'items.productId',
      model: 'Product',
      select: '_id name slug description price compareAtPrice images category stock isActive isFeatured isBestSeller tags'
    });
};

// Method to add item to cart
cartSchema.methods.addItem = async function(productId, quantity = 1) {
  const existingItem = this.items.find(item => 
    item.productId.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ productId, quantity });
  }

  return await this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  const item = this.items.find(item => 
    item.productId.toString() === productId.toString()
  );

  if (item) {
    item.quantity = quantity;
    return await this.save();
  }

  return false;
};

// Method to remove item from cart
cartSchema.methods.removeItem = async function(productId) {
  const index = this.items.findIndex(item => 
    item.productId.toString() === productId.toString()
  );

  if (index !== -1) {
    this.items.splice(index, 1);
    return await this.save();
  }

  return false;
};

// Method to clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  return await this.save();
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;