const express = require('express');
const router = express.Router();

const {
  getHealthStatus,
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// Health Check Route: GET /api/health
router.get('/health', getHealthStatus);

// Product CRUD Routes
// Route: /api/products
router.route('/products')
  .get(getAllProducts)
  .post(createProduct);

// Route: /api/products/:id
router.route('/products/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;

