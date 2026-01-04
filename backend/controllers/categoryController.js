const Category = require('../models/Category');
const asyncHandler = require('../middleware/asyncHandler');
const slugify = require('slugify');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary'); // your cloudinary config (v2)
const streamifier = require('streamifier');

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Helper function to build category tree
const buildCategoryTree = (categories, parentId = null) => {
  const tree = [];

  categories
    .filter(category => {
      const categoryParentId = category.parentId ? category.parentId.toString() : null;
      return categoryParentId === parentId;
    })
    .forEach(category => {
      const children = buildCategoryTree(categories, category._id.toString());

      const categoryObj = category.toObject ? category.toObject() : category;
      categoryObj.id = categoryObj._id.toString();

      if (children.length > 0) {
        categoryObj.children = children;
      }

      tree.push(categoryObj);
    });

  return tree;
};

// Upload buffer to Cloudinary (returns { url, publicId })
const uploadBufferToCloudinary = (buffer, filename, options = {}) => {
  return new Promise((resolve, reject) => {
    const upload_stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'categories',
        public_id: options.publicId || undefined,
        overwrite: options.overwrite ?? true,
        resource_type: 'image',
        transformation: options.transformation || [{ width: 1200, crop: 'limit' }] // limit width by default
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(upload_stream);
  });
};

// Delete image from Cloudinary by publicId (if exists)
const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    // Log but don't throw; we don't want delete failure to block category ops
    console.error(`Cloudinary delete failed for ${publicId}:`, err.message || err);
  }
};

/* --------------------------------------------------------------------------
   GET /api/categories  - Get all categories
   -------------------------------------------------------------------------- */
exports.getAll = asyncHandler(async (req, res) => {
  const { isActive } = req.query;

  let query = Category.find();

  // Filter by active status if provided
  if (isActive !== undefined) {
    query = query.where('isActive', isActive === 'true');
  }

  // Optionally project fields to keep payload small (you can expand if needed)
  // default: return all fields; for large payloads, consider: .select('name slug image createdAt')
  const categories = await query.sort({ name: 1 }).lean();

  // Convert _id to id for frontend consistency
  const categoriesWithId = categories.map(category => ({
    ...category,
    id: category._id.toString(),
    parentId: category.parentId ? category.parentId.toString() : null
  }));

  res.status(200).json({
    success: true,
    data: categoriesWithId,
    count: categoriesWithId.length
  });
});

/* --------------------------------------------------------------------------
   GET /api/categories/tree  - Get category tree (active only)
   -------------------------------------------------------------------------- */
exports.getTree = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ name: 1 })
    .lean();

  const categoriesWithIds = categories.map(category => ({
    ...category,
    id: category._id.toString(),
    parentId: category.parentId ? category.parentId.toString() : null
  }));

  const tree = buildCategoryTree(categoriesWithIds);

  res.status(200).json({
    success: true,
    data: tree,
    count: tree.length
  });
});

/* --------------------------------------------------------------------------
   GET /api/categories/:id  - Get category by ID
   -------------------------------------------------------------------------- */
exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category ID format'
    });
  }

  const category = await Category.findById(id).lean();

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  const categoryWithId = {
    ...category,
    id: category._id.toString(),
    parentId: category.parentId ? category.parentId.toString() : null
  };

  res.status(200).json({
    success: true,
    data: categoryWithId
  });
});

/* --------------------------------------------------------------------------
   GET /api/categories/slug/:slug  - Get by slug
   -------------------------------------------------------------------------- */
exports.getBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug }).lean();

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  const categoryWithId = {
    ...category,
    id: category._id.toString(),
    parentId: category.parentId ? category.parentId.toString() : null
  };

  res.status(200).json({
    success: true,
    data: categoryWithId
  });
});

/* --------------------------------------------------------------------------
   POST /api/categories  - Create category (handles single image upload in req.file)
   -------------------------------------------------------------------------- */
exports.create = asyncHandler(async (req, res) => {
  const { name, description, parentId, isActive = true } = req.body;

  // Check if category with same name exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return res.status(400).json({
      success: false,
      message: 'Category with this name already exists'
    });
  }

  // Validate parent category if provided and not empty
  let parentCategory = null;
  if (parentId && parentId.trim() !== '') {
    if (!isValidObjectId(parentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent category ID format'
      });
    }

    parentCategory = await Category.findById(parentId);
    if (!parentCategory) {
      return res.status(400).json({
        success: false,
        message: 'Parent category not found'
      });
    }
  }

  // Generate slug
  const slug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
    remove: /[*+~.()'"!:@]/g
  });

  // Prepare category data
  const categoryData = {
    name,
    slug,
    description: description || '',
    parentId: (parentId && parentId.trim() !== '' && isValidObjectId(parentId)) ? parentId : null,
    isActive: isActive === 'true' || isActive === true
  };

  // Handle image upload if file exists (use Cloudinary)
  if (req.file && req.file.buffer) {
    try {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname, {
        folder: 'categories',
        transformation: [{ width: 1200, crop: 'limit' }] // keep image reasonable size
      });

      categoryData.image = {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        altText: name
      };
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      return res.status(500).json({
        success: false,
        message: 'Image upload failed'
      });
    }
  }

  const category = await Category.create(categoryData);

  const createdCategory = {
    ...category.toObject(),
    id: category._id.toString(),
    parentId: category.parentId ? category.parentId.toString() : null
  };

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: createdCategory
  });
});

/* --------------------------------------------------------------------------
   PUT /api/categories/:id  - Update category (handles image replace/remove)
   -------------------------------------------------------------------------- */
exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category ID format'
    });
  }

  const category = await Category.findById(id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Check if updating name causes duplicate
  if (req.body.name && req.body.name !== category.name) {
    const existingCategory = await Category.findOne({
      name: req.body.name,
      _id: { $ne: id }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
  }

  const updateData = {};

  // Only update fields that are provided
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.description !== undefined) updateData.description = req.body.description;
  if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

  // Handle parentId - validate if provided
  if (req.body.parentId !== undefined) {
    if (req.body.parentId && req.body.parentId.trim() !== '') {
      if (!isValidObjectId(req.body.parentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent category ID format'
        });
      }

      const parentCategory = await Category.findById(req.body.parentId);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }

      if (req.body.parentId === id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }

      updateData.parentId = req.body.parentId;
    } else {
      updateData.parentId = null;
    }
  }

  // Handle image upload if file exists (replace existing image in Cloudinary)
  if (req.file && req.file.buffer) {
    try {
      // If existing image has a publicId, delete it first (best effort)
      if (category.image && category.image.publicId) {
        await deleteImageFromCloudinary(category.image.publicId);
      }

      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname, {
        folder: 'categories',
        transformation: [{ width: 1200, crop: 'limit' }]
      });

      updateData.image = {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        altText: req.body.name || category.name
      };
    } catch (err) {
      console.error('Cloudinary upload failed during update:', err);
      return res.status(500).json({
        success: false,
        message: 'Image upload failed'
      });
    }
  } else if (req.body.image === null || req.body.image === '') {
    // If explicit remove requested, delete old image on Cloudinary
    if (category.image && category.image.publicId) {
      await deleteImageFromCloudinary(category.image.publicId);
    }
    updateData.image = undefined;
  }

  // Apply updates to category document (but don't allow direct slug updates)
  Object.keys(updateData).forEach(key => {
    if (key !== 'slug') {
      category[key] = updateData[key];
    }
  });

  // Regenerate slug if name changed
  if (req.body.name) {
    category.slug = slugify(req.body.name, {
      lower: true,
      strict: true,
      trim: true,
      remove: /[*+~.()'"!:@]/g
    });
  }

  await category.save();

  const updatedCategory = {
    ...category.toObject(),
    id: category._id.toString(),
    parentId: category.parentId ? category.parentId.toString() : null
  };

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: updatedCategory
  });
});

/* --------------------------------------------------------------------------
   DELETE /api/categories/:id  - Delete category (also remove image from Cloudinary)
   -------------------------------------------------------------------------- */
exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category ID format'
    });
  }

  const category = await Category.findById(id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Check if category has children
  const childCount = await Category.countDocuments({ parentId: category._id });
  if (childCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete category that has subcategories. Please delete subcategories first.'
    });
  }

  // Delete image from Cloudinary if present
  if (category.image && category.image.publicId) {
    await deleteImageFromCloudinary(category.image.publicId);
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
    data: {
      id: category._id.toString(),
      name: category.name
    }
  });
});
