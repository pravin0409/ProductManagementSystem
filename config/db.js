const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas using the connection URI from environment variables.
 * Keeps credentials secure by logging only the host name on successful connection.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('Connected Database:', conn.connection.name);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

