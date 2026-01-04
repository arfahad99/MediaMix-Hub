const mongoose = require('mongoose');
const User = require('../models/User');
const Media = require('../models/Media');
const SharedLink = require('../models/SharedLink');
require('dotenv').config();

/**
 * Database Schema Initialization Script for MediaMix Hub
 * This script sets up the database schema according to the design specification
 */

async function initializeDatabase() {
    try {
        console.log('🚀 Starting MediaMix Hub Database Initialization...');
        console.log('================================================');

        // Connect to database
        const connectionString = process.env.AZURE_COSMOS_CONNECTION_STRING || process.env.MONGODB_URI;
        if (!connectionString) {
            throw new Error('Database connection string not found. Please set AZURE_COSMOS_CONNECTION_STRING or MONGODB_URI');
        }

        console.log('🔄 Connecting to database...');
        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Database connected successfully');

        // Create collections and indexes
        console.log('\n📋 Creating collections and indexes...');
        
        // Users collection
        console.log('👥 Setting up Users collection...');
        await User.createIndexes();
        console.log('   ✅ Users indexes created');

        // Media collection
        console.log('📁 Setting up Media collection...');
        await Media.createIndexes();
        console.log('   ✅ Media indexes created');

        // SharedLinks collection
        console.log('🔗 Setting up SharedLinks collection...');
        await SharedLink.createIndexes();
        console.log('   ✅ SharedLinks indexes created');

        // Create sample data (optional)
        await createSampleData();

        // Verify schema
        await verifySchema();

        console.log('\n🎉 Database initialization completed successfully!');
        console.log('================================================');
        console.log('📊 Schema Summary:');
        console.log('   👥 Users: Core user management with authentication');
        console.log('   📁 Media: File storage with metadata and analytics');
        console.log('   🔗 SharedLinks: Secure file sharing with access control');
        console.log('');
        console.log('🔧 Features Enabled:');
        console.log('   ✅ User authentication and profiles');
        console.log('   ✅ Media upload and management');
        console.log('   ✅ File sharing with expiration');
        console.log('   ✅ Analytics and tracking');
        console.log('   ✅ Azure Cosmos DB optimization');
        console.log('   ✅ Full-text search capabilities');
        console.log('');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

async function createSampleData() {
    console.log('\n🌱 Creating sample data...');
    
    try {
        // Check if admin user already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('   ⚠️  Sample admin user already exists, skipping...');
            return;
        }

        // Create sample admin user
        const adminUser = new User({
            username: 'admin',
            email: 'admin@mediamixhub.com',
            displayName: 'System Administrator',
            passwordHash: 'admin123', // Will be hashed by pre-save middleware
            role: 'admin',
            status: 'active',
            isEmailVerified: true,
            preferences: {
                theme: 'dark',
                language: 'en'
            },
            metadata: {
                source: 'system',
                createdIP: '127.0.0.1'
            }
        });

        await adminUser.save();
        console.log('   ✅ Sample admin user created (username: admin, password: admin123)');

        // Create sample regular user
        const sampleUser = new User({
            username: 'demo_user',
            email: 'demo@mediamixhub.com',
            displayName: 'Demo User',
            passwordHash: 'demo123',
            role: 'user',
            status: 'active',
            isEmailVerified: true,
            metadata: {
                source: 'system',
                createdIP: '127.0.0.1'
            }
        });

        await sampleUser.save();
        console.log('   ✅ Sample demo user created (username: demo_user, password: demo123)');

    } catch (error) {
        console.log('   ⚠️  Sample data creation failed:', error.message);
    }
}

async function verifySchema() {
    console.log('\n🔍 Verifying schema setup...');
    
    try {
        // Check collections exist
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        const expectedCollections = ['users', 'media_items', 'shared_links'];
        const missingCollections = expectedCollections.filter(name => !collectionNames.includes(name));
        
        if (missingCollections.length === 0) {
            console.log('   ✅ All required collections exist');
        } else {
            console.log('   ⚠️  Missing collections:', missingCollections.join(', '));
        }

        // Check indexes
        const userIndexes = await User.collection.getIndexes();
        const mediaIndexes = await Media.collection.getIndexes();
        const sharedLinkIndexes = await SharedLink.collection.getIndexes();

        console.log(`   📊 Users collection: ${Object.keys(userIndexes).length} indexes`);
        console.log(`   📊 Media collection: ${Object.keys(mediaIndexes).length} indexes`);
        console.log(`   📊 SharedLinks collection: ${Object.keys(sharedLinkIndexes).length} indexes`);

        // Test basic operations
        const userCount = await User.countDocuments();
        const mediaCount = await Media.countDocuments();
        const sharedLinkCount = await SharedLink.countDocuments();

        console.log(`   📈 Current data: ${userCount} users, ${mediaCount} media items, ${sharedLinkCount} shared links`);

    } catch (error) {
        console.log('   ⚠️  Schema verification failed:', error.message);
    }
}

// Database schema documentation
function printSchemaDocumentation() {
    console.log('\n📚 Database Schema Documentation');
    console.log('================================');
    
    console.log('\n👥 USERS Collection:');
    console.log('   • userId (String, Unique): Primary identifier');
    console.log('   • username (String, Unique): User login name');
    console.log('   • email (String, Unique): User email address');
    console.log('   • displayName (String): User display name');
    console.log('   • passwordHash (String): Encrypted password');
    console.log('   • registrationDate (Date): Account creation date');
    console.log('   • role (Enum): user, admin, moderator');
    console.log('   • status (Enum): active, inactive, suspended, pending');
    console.log('   • storageUsed/storageLimit (Number): Storage tracking');
    console.log('   • preferences (Object): User settings and preferences');
    console.log('   • metadata (Object): Analytics and tracking data');

    console.log('\n📁 MEDIA_ITEMS Collection:');
    console.log('   • mediaId (String, Unique): Primary identifier');
    console.log('   • userId (ObjectId, FK): Reference to Users');
    console.log('   • fileName (String): Original file name');
    console.log('   • filePath (String): Storage path');
    console.log('   • fileSize (Number): File size in bytes');
    console.log('   • fileType (Enum): image, video, audio, document, other');
    console.log('   • uploadDate (Date): Upload timestamp');
    console.log('   • description (String): User-provided description');
    console.log('   • tags (Array): Searchable tags');
    console.log('   • viewCount/downloadCount (Number): Analytics');
    console.log('   • azureInfo (Object): Azure Blob Storage metadata');

    console.log('\n🔗 SHARED_LINKS Collection:');
    console.log('   • linkId (String, Unique): Primary identifier');
    console.log('   • shareToken (String, Unique): Access token');
    console.log('   • mediaId (ObjectId, FK): Reference to Media');
    console.log('   • userId (ObjectId, FK): Reference to Users');
    console.log('   • shareDate/expiryDate (Date): Validity period');
    console.log('   • permission (Enum): view, download, both');
    console.log('   • accessCount (Number): Usage tracking');
    console.log('   • isActive (Boolean): Link status');
    console.log('   • accessLog (Array): Detailed access history');

    console.log('\n🔍 Key Features:');
    console.log('   ✅ Optimized for Azure Cosmos DB');
    console.log('   ✅ Full-text search capabilities');
    console.log('   ✅ Comprehensive indexing strategy');
    console.log('   ✅ Soft delete support');
    console.log('   ✅ Analytics and tracking');
    console.log('   ✅ Secure password hashing');
    console.log('   ✅ File sharing with access control');
    console.log('   ✅ Storage quota management');
}

// Run initialization if called directly
if (require.main === module) {
    printSchemaDocumentation();
    initializeDatabase();
}

module.exports = {
    initializeDatabase,
    createSampleData,
    verifySchema,
    printSchemaDocumentation
};