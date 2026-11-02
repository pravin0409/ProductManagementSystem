const mongoose = require('mongoose');

/**
 * Product Schema
 * Defines the structure, data types, and validation rules for the Product collection.
 */
const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than zero (minimum 0.01)'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative (minimum 0)'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole integer',
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    // Automatically creates and manages createdAt and updatedAt fields
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

