const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Throw instead of process.exit so serverless runtimes can handle the error
    // gracefully and return a 500 to the client instead of crashing the process.
    throw error;
  }
};

module.exports = connectDB;

