// controllers/products.js
const Product = require('../models/Product');
const Category = require('../models/Category');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper to parse boolean-ish query params
function parseBool(val) {
  if (val === undefined) return undefined;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'true' || val === '1') return true;
    if (val.toLowerCase() === 'false' || val === '0') return false;
  }
  return undefined;
}

// Helper to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return process.env.CLOUDINARY_CLOUD_NAME &&
         process.env.CLOUDINARY_API_KEY &&
         process.env.CLOUDINARY_API_SECRET;
};

// Upload buffer -> Cloudinary using a stream (returns normalized info)
const uploadBufferToCloudinary = (buffer, originalname, folder = 'art-palzaa/products') => {
  return new Promise((resolve, reject) => {
    try {
      const publicId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          overwrite: false,
          resource_type: 'image',
          transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }]
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes
          });
        }
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    } catch (err) {
      reject(err);
    }
  });
};

// Fallback to base64 if Cloudinary not available or upload fails
const bufferToBase64 = (buffer, mimeType) => {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

// Delete image from Cloudinary (best-effort)
const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.error(`Cloudinary delete failed for ${publicId}:`, err.message || err);
  }
};

/* ---------------------------
   GET /api/products
   --------------------------- */
exports.getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 12);
  const skip = (page - 1) * limit;

  const {
    search,
    categoryId,
    categorySlug,
    isActive,
    isFeatured,
    isBestSeller,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    minPrice,
    maxPrice,
  } = req.query;

  let query = {};

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { name: searchRegex },
      { sku: searchRegex },
      { description: searchRegex },
      { shortDescription: searchRegex },
      { tags: searchRegex }
    ];
  }

  if (categoryId && isValidObjectId(categoryId)) {
    query.categoryId = categoryId;
  }

  if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug });
    if (category) {
      query.categoryId = category._id;
    }
  }

  const activeBool = parseBool(isActive);
  if (activeBool !== undefined) query.isActive = activeBool;

  const featuredBool = parseBool(isFeatured);
  if (featuredBool !== undefined) query.isFeatured = featuredBool;

  const bestSellerBool = parseBool(isBestSeller);
  if (bestSellerBool !== undefined) query.isBestSeller = bestSellerBool;

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  const sort = {};
  if (sortBy) sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query)
  ]);

  // Enrich with category info (small snapshot)
  const enrichedProducts = await Promise.all(
    products.map(async (product) => {
      if (product.categoryId) {
        const category = await Category.findById(product.categoryId).lean();
        if (category) {
          product.category = {
            id: category._id.toString(),
            name: category.name,
            slug: category.slug
          };
        }
      }
      // convert _id to id string
      product.id = product._id ? product._id.toString() : undefined;
      if (product.categoryId) product.categoryId = product.categoryId.toString();
      return product;
    })
  );

  res.status(200).json({
    success: true,
    data: {
      products: enrichedProducts,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit
    }
  });
});

/* ---------------------------
   GET /api/products/:id
   --------------------------- */
exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid product ID format' });
  }

  const product = await Product.findById(id).lean();

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  if (product.categoryId) {
    const category = await Category.findById(product.categoryId).lean();
    if (category) {
      product.category = {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug
      };
    }
  }

  const productWithId = {
    ...product,
    id: product._id.toString(),
    categoryId: product.categoryId ? product.categoryId.toString() : null,
    category: product.category ? { ...product.category, id: product.category.id.toString() } : null
  };

  res.status(200).json({ success: true, data: productWithId });
});

/* ---------------------------
   GET /api/products/slug/:slug
   --------------------------- */
exports.getBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).lean();

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  if (product.categoryId) {
    const category = await Category.findById(product.categoryId).lean();
    if (category) {
      product.category = {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug
      };
    }
  }

  product.id = product._id ? product._id.toString() : undefined;
  product.categoryId = product.categoryId ? product.categoryId.toString() : null;

  res.status(200).json({ success: true, data: product });
});

/* ---------------------------
   POST /api/products
   - Supports req.files[] (multer memory) to set images directly when creating
   --------------------------- */
exports.create = asyncHandler(async (req, res) => {
  const payload = req.body || {};

  // If client sent images array as JSON string, parse it
  if (typeof payload.images === 'string') {
    try {
      payload.images = JSON.parse(payload.images);
    } catch (err) {
      payload.images = [];
    }
  }

  // Validate required fields
  if (!payload.name || !payload.price || !payload.sku) {
    return res.status(400).json({ success: false, message: 'Name, price, and SKU are required fields' });
  }

  const slugify = require('slugify');
  payload.slug = slugify(payload.name, { lower: true, strict: true, trim: true });

  const existingProduct = await Product.findOne({ slug: payload.slug });
  if (existingProduct) {
    return res.status(400).json({ success: false, message: 'Product with this name already exists' });
  }

  // Validate category
  if (payload.categoryId) {
    if (!isValidObjectId(payload.categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID format' });
    }
    const category = await Category.findById(payload.categoryId);
    if (!category) return res.status(400).json({ success: false, message: 'Category not found' });
    payload.category = { id: category._id, name: category.name, slug: category.slug };
  } else {
    payload.categoryId = null;
    payload.category = null;
  }

  // Ensure images array exists
  if (!payload.images) payload.images = [];

  // If files uploaded via multipart (req.files), upload them to Cloudinary (or fallback)
  if (req.files && req.files.length > 0) {
    const useCloudinary = isCloudinaryConfigured();
    const uploadedImages = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      let imageData = null;

      if (useCloudinary) {
        try {
          const uploaded = await uploadBufferToCloudinary(file.buffer, file.originalname, 'art-palzaa/products');
          imageData = {
            url: uploaded.url,
            publicId: uploaded.publicId,
            altText: file.originalname,
            isPrimary: i === 0,
            order: i,
            format: uploaded.format,
            width: uploaded.width,
            height: uploaded.height
          };
        } catch (err) {
          console.error('Cloudinary upload failed while creating product, falling back to base64:', err.message || err);
          imageData = {
            url: bufferToBase64(file.buffer, file.mimetype),
            altText: file.originalname,
            isPrimary: i === 0,
            order: i,
            publicId: `base64_${Date.now()}_${i}`
          };
        }
      } else {
        imageData = {
          url: bufferToBase64(file.buffer, file.mimetype),
          altText: file.originalname,
          isPrimary: i === 0,
          order: i,
          publicId: `base64_${Date.now()}_${i}`
        };
      }

      uploadedImages.push(imageData);
    }

    // Merge or replace images (here we append new uploads to any provided images)
    payload.images = (payload.images && payload.images.length > 0) ? payload.images.concat(uploadedImages) : uploadedImages;
  }

  // Ensure one primary image
  if (payload.images.length > 0 && !payload.images.some(img => img.isPrimary)) {
    payload.images[0].isPrimary = true;
  }

  // Defaults
  if (!payload.stock) payload.stock = 0;
  if (!payload.tags) payload.tags = [];
  if (payload.isActive === undefined) payload.isActive = true;

  const product = await Product.create(payload);

  // Convert to safe object for response
  const result = product.toObject ? product.toObject() : product;
  result.id = result._id ? result._id.toString() : undefined;
  if (result.categoryId) result.categoryId = result.categoryId.toString();

  res.status(201).json({ success: true, message: 'Product created successfully', data: result });
});

/* ---------------------------
   PUT /api/products/:id
   - Supports replacing images via req.files (will delete old Cloudinary images if publicId exists)
   - Also supports receiving images as JSON in req.body.images
   --------------------------- */
exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid product ID format' });
  }

  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  // Duplicate name check -> slug conflict
  if (req.body.name && req.body.name !== product.name) {
    const slugify = require('slugify');
    const newSlug = slugify(req.body.name, { lower: true, strict: true, trim: true });
    const existingProduct = await Product.findOne({ slug: newSlug, _id: { $ne: id } });
    if (existingProduct) return res.status(400).json({ success: false, message: 'Product with this name already exists' });
  }

  // Handle category change
  if (req.body.categoryId !== undefined) {
    if (req.body.categoryId === '' || req.body.categoryId === null) {
      req.body.categoryId = null;
      req.body.category = null;
    } else if (!isValidObjectId(req.body.categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID format' });
    } else {
      const category = await Category.findById(req.body.categoryId);
      if (!category) return res.status(400).json({ success: false, message: 'Category not found' });
      req.body.category = { id: category._id, name: category.name, slug: category.slug };
    }
  }

  // If client sent images as JSON string, parse it
  if (req.body.images && typeof req.body.images === 'string') {
    try {
      req.body.images = JSON.parse(req.body.images);
    } catch (err) {
      // ignore parse error; keep it as-is and let validation handle it
    }
  }

  // If new files are uploaded, delete existing remote images (if any) and upload replacements
  if (req.files && req.files.length > 0) {
    const useCloudinary = isCloudinaryConfigured();

    // Delete previous remote images that have publicId
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.publicId && useCloudinary) {
          await deleteImageFromCloudinary(img.publicId);
        }
      }
    }

    const uploadedImages = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      let imageData = null;

      if (useCloudinary) {
        try {
          const uploaded = await uploadBufferToCloudinary(file.buffer, file.originalname, 'art-palzaa/products');
          imageData = {
            url: uploaded.url,
            publicId: uploaded.publicId,
            altText: file.originalname,
            isPrimary: i === 0,
            order: i,
            format: uploaded.format,
            width: uploaded.width,
            height: uploaded.height
          };
        } catch (err) {
          console.error('Cloudinary upload failed while updating product, falling back to base64:', err.message || err);
          imageData = {
            url: bufferToBase64(file.buffer, file.mimetype),
            altText: file.originalname,
            isPrimary: i === 0,
            order: i,
            publicId: `base64_${Date.now()}_${i}`
          };
        }
      } else {
        imageData = {
          url: bufferToBase64(file.buffer, file.mimetype),
          altText: file.originalname,
          isPrimary: i === 0,
          order: i,
          publicId: `base64_${Date.now()}_${i}`
        };
      }

      uploadedImages.push(imageData);
    }

    // Replace images with uploaded ones
    req.body.images = uploadedImages;
  }

  // Apply body updates to product (disallow slug and _id direct override)
  Object.keys(req.body).forEach(key => {
    if (key !== 'slug' && key !== '_id') {
      product[key] = req.body[key];
    }
  });

  // Regenerate slug if name changed
  if (req.body.name) {
    const slugify = require('slugify');
    product.slug = slugify(req.body.name, { lower: true, strict: true, trim: true });
  }

  // Ensure at least one primary image
  if (product.images && product.images.length > 0) {
    const hasPrimary = product.images.some(img => img.isPrimary);
    if (!hasPrimary) product.images[0].isPrimary = true;
  }

  await product.save();

  const result = product.toObject ? product.toObject() : product;
  result.id = result._id ? result._id.toString() : undefined;
  if (result.categoryId) result.categoryId = result.categoryId.toString();

  res.status(200).json({ success: true, message: 'Product updated successfully', data: result });
});

/* ---------------------------
   DELETE /api/products/:id
   --------------------------- */
exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid product ID format' });

  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  // Delete images from Cloudinary if configured
  if (isCloudinaryConfigured() && product.images && product.images.length > 0) {
    try {
      for (const image of product.images) {
        if (image.publicId) {
          await deleteImageFromCloudinary(image.publicId);
          console.log(`Deleted image from Cloudinary: ${image.publicId}`);
        }
      }
    } catch (error) {
      console.error('Error deleting images from Cloudinary:', error);
      // Continue with deletion even if Cloudinary fails
    }
  }

  await product.deleteOne();

  res.status(200).json({ success: true, message: 'Product deleted successfully', data: { id: product._id.toString(), name: product.name } });
});

/* ---------------------------
   POST /api/products/upload-images
   - Uploads multiple files and returns array of image objects for frontend to attach to a product
   --------------------------- */
exports.uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const uploadResults = [];
  const useCloudinary = isCloudinaryConfigured();

  try {
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      let imageData;

      if (useCloudinary) {
        try {
          const uploaded = await uploadBufferToCloudinary(file.buffer, file.originalname, 'art-palzaa/products');
          imageData = {
            url: uploaded.url,
            publicId: uploaded.publicId,
            altText: file.originalname,
            isPrimary: i === 0,
            order: i,
            format: uploaded.format,
            width: uploaded.width,
            height: uploaded.height
          };
          console.log(`Uploaded to Cloudinary: ${uploaded.url}`);
        } catch (cloudErr) {
          console.error('Cloudinary upload failed for uploadImages:', cloudErr.message || cloudErr);
          imageData = {
            url: bufferToBase64(file.buffer, file.mimetype),
            altText: file.originalname,
            isPrimary: i === 0,
            order: i,
            publicId: `base64_${Date.now()}_${i}`
          };
        }
      } else {
        imageData = {
          url: bufferToBase64(file.buffer, file.mimetype),
          altText: file.originalname,
          isPrimary: i === 0,
          order: i,
          publicId: `base64_${Date.now()}_${i}`
        };
      }

      uploadResults.push(imageData);
    }

    res.status(200).json({
      success: true,
      message: `${uploadResults.length} image(s) uploaded successfully`,
      data: uploadResults
    });
  } catch (err) {
    console.error('Error in uploadImages:', err);
    res.status(500).json({ success: false, message: 'Error uploading images. Please try again.' });
  }
});
