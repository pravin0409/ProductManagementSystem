const mongoose = require('mongoose');
const Product = require('../models/Product');

/**
 * Health Check
 * @route   GET /api/health
 * @desc    Verify server status and timestamp
 */
const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Create Product
 * @route   POST /api/products
 * @desc    Add a new product to MongoDB with validation
 */
const createProduct = async (req, res) => {
  try {
    const { productName, category, price, quantity, description } = req.body;

    const product = await Product.create({
      productName,
      category,
      price,
      quantity,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating product',
    });
  }
};

/**
 * Get All Products
 * @route   GET /api/products
 * @desc    Fetch all products, sorted by newest first
 */
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products',
    });
  }
};

/**
 * Get Product by ID
 * @route   GET /api/products/:id
 * @desc    Fetch a single product by its MongoDB ObjectID
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving product',
    });
  }
};

/**
 * Update Product
 * @route   PUT /api/products/:id
 * @desc    Update product details and re-run schema validators
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const { productName, category, price, quantity, description } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { productName, category, price, quantity, description },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating product',
    });
  }
};

/**
 * Delete Product
 * @route   DELETE /api/products/:id
 * @desc    Remove a product from the database by ID
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: deletedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product',
    });
  }
};

module.exports = {
  getHealthStatus,
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};

