const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Determine if we're using Azure Cosmos DB or local MongoDB
        const isAzureCosmosDB = !!process.env.AZURE_COSMOS_CONNECTION_STRING;
        const connectionString = process.env.AZURE_COSMOS_CONNECTION_STRING || process.env.MONGODB_URI;
        
        // Connection options - different for Azure Cosmos DB vs local MongoDB
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };
        
        if (isAzureCosmosDB) {
            // Azure Cosmos DB specific options
            Object.assign(options, {
                ssl: true,
                sslValidate: true,
                maxPoolSize: 10,
                minPoolSize: 5,
                maxIdleTimeMS: 30000,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                retryWrites: true,
                retryReads: true,
                bufferMaxEntries: 0,
                bufferCommands: false,
            });
        } else {
            // Local MongoDB options
            Object.assign(options, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
        }
        
        if (!connectionString) {
            throw new Error('Database connection string not provided. Please set MONGODB_URI or AZURE_COSMOS_CONNECTION_STRING environment variable.');
        }

        const dbType = isAzureCosmosDB ? 'Azure Cosmos DB' : 'Local MongoDB';
        console.log(`🔄 Connecting to ${dbType}...`);
        const conn = await mongoose.connect(connectionString, options);

        console.log(`🌟 ${dbType} Connected Successfully!`);
        console.log(`📊 Database: ${conn.connection.db.databaseName}`);
        console.log(`🔗 Host: ${conn.connection.host}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error(`❌ ${dbType} connection error:`, err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log(`⚠️  ${dbType} disconnected`);
        });

        mongoose.connection.on('reconnected', () => {
            console.log(`✅ ${dbType} reconnected`);
        });

        mongoose.connection.on('connecting', () => {
            console.log(`🔄 Connecting to ${dbType}...`);
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('🔄 Closing database connection...');
            await mongoose.connection.close();
            console.log('✅ Database connection closed through app termination');
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('🔄 Closing database connection...');
            await mongoose.connection.close();
            console.log('✅ Database connection closed through app termination');
            process.exit(0);
        });

        // Test the connection
        await testConnection();

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        
        // In development, we can continue without DB for testing
        if (process.env.NODE_ENV === 'development') {
            console.log('⚠️  Continuing in development mode without database...');
            return;
        }
        
        process.exit(1);
    }
};

/**
 * Test the database connection
 */
const testConnection = async () => {
    try {
        // Test basic connectivity
        await mongoose.connection.db.admin().ping();
        console.log('✅ Database ping successful');
        
        // List collections to verify access
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📋 Available collections: ${collections.length}`);
        
    } catch (error) {
        console.error('⚠️  Database connection test failed:', error.message);
    }
};

/**
 * Get connection status
 */
const getConnectionStatus = () => {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    
    return {
        state: states[mongoose.connection.readyState],
        host: mongoose.connection.host,
        name: mongoose.connection.name
    };
};

/**
 * Close database connection
 */
const closeConnection = async () => {
    try {
        await mongoose.connection.close();
        console.log('✅ Database connection closed successfully');
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
    }
};

module.exports = {
    connectDB,
    getConnectionStatus,
    closeConnection,
    testConnection
};