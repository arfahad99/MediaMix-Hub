const mongoose = require('mongoose');
const Media = require('./models/Media');
const User = require('./models/User');

// Load environment variables
require('dotenv').config({ path: './.env' });

async function checkDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mediahub');
        console.log('✅ Connected to MongoDB');

        // Check users
        const users = await User.find({});
        console.log(`\n📊 Found ${users.length} users:`);
        users.forEach(user => {
            console.log(`  - ${user.username} (${user.email}) - ID: ${user._id}`);
        });

        // Check media files
        const mediaFiles = await Media.find({});
        console.log(`\n📁 Found ${mediaFiles.length} media files:`);
        mediaFiles.forEach(media => {
            console.log(`  - ${media.originalName} (${media.fileType}) - User: ${media.userId}`);
            console.log(`    Path: ${media.path}`);
            console.log(`    Created: ${media.createdAt}`);
            console.log(`    Description: ${media.description}`);
            console.log('');
        });

        // Check if files exist on disk
        const fs = require('fs');
        console.log('\n💾 Checking files on disk:');
        for (const media of mediaFiles) {
            const exists = fs.existsSync(media.path);
            console.log(`  - ${media.originalName}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
        }

    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

checkDatabase();