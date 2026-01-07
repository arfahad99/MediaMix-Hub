const mongoose = require('mongoose');

/**
 * For CW2:
 * - Production (Azure): skip Mongoose connection (we use Cosmos SQL via @azure/cosmos elsewhere)
 * - Development (local): allow MongoDB via MONGODB_URI for auth/users
 */
const connectDB = async () => {
  // In Azure production we don't want to require MongoDB/Cosmos-Mongo API
  if (process.env.NODE_ENV === 'production') {
    console.log('ℹ️  Production mode: skipping Mongoose DB connection (Cosmos SQL is used for media).');
    return;
  }

  const connectionString = process.env.MONGODB_URI;

  if (!connectionString) {
    console.log('⚠️  No MONGODB_URI set. Skipping MongoDB connection in development.');
    return;
  }

  try {
    console.log('🔄 Connecting to Local MongoDB...');
    const conn = await mongoose.connect(connectionString, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('🌟 Local MongoDB Connected Successfully!');
    console.log(`📊 Database: ${conn.connection.db.databaseName}`);
    console.log(`🔗 Host: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    const shutdown = async () => {
      try {
        console.log('🔄 Closing MongoDB connection...');
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
      } finally {
        process.exit(0);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️  Continuing in development mode without MongoDB...');
  }
};

const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    state: states[mongoose.connection.readyState],
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
};

const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed successfully');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
};

module.exports = {
  connectDB,
  getConnectionStatus,
  closeConnection,
};
