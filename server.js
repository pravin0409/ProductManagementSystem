const path = require('path');
const express = require('express');
const dotenv = require('dotenv');

// 1. Load environment variables from .env file
dotenv.config();

// 2. Import database connection and routes
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');

// 3. Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;

// 4. Configure core middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// 6. Mount REST API routes
app.use('/api', productRoutes);

// 7. API discovery & welcome endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Product Management System API',
    version: '1.0.0',
    endpoints: {
      healthCheck: '/api/health',
      products: '/api/products',
    },
  });
});

// 8. 404 Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// 9. Global error handling middleware
app.use((err, req, res, next) => {
  console.error(`Unhandled Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// 10. Connect to MongoDB Atlas first, then start listening for requests
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Only start the server if executed directly (supports modular testing)
if (require.main === module) {
  startServer();
}

module.exports = app;

