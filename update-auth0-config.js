#!/usr/bin/env node

/**
 * Auth0 Configuration Update Script for MediaMix Hub
 * This script helps you update your Auth0 configuration files
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function updateAuth0Config() {
    console.log('🚀 Auth0 Configuration Update Script for MediaMix Hub\n');
    
    try {
        // Get Auth0 credentials from user
        console.log('Please enter your Auth0 application credentials:\n');
        
        const domain = await question('Auth0 Domain (e.g., dev-xyz.us.auth0.com): ');
        const clientId = await question('Client ID: ');
        const clientSecret = await question('Client Secret: ');
        
        if (!domain || !clientId || !clientSecret) {
            console.log('❌ All fields are required. Please run the script again.');
            process.exit(1);
        }
        
        console.log('\n📝 Updating configuration files...\n');
        
        // Update backend .env file
        const envPath = path.join(__dirname, 'backend', '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Replace Auth0 configuration
        envContent = envContent.replace(
            /AUTH0_DOMAIN=.*/,
            `AUTH0_DOMAIN=${domain}`
        );
        envContent = envContent.replace(
            /AUTH0_CLIENT_ID=.*/,
            `AUTH0_CLIENT_ID=${clientId}`
        );
        envContent = envContent.replace(
            /AUTH0_CLIENT_SECRET=.*/,
            `AUTH0_CLIENT_SECRET=${clientSecret}`
        );
        envContent = envContent.replace(
            /AUTH0_AUDIENCE=.*/,
            `AUTH0_AUDIENCE=https://${domain}/api/v2/`
        );
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Updated backend/.env');
        
        // Update frontend auth0-config.js
        const configPath = path.join(__dirname, 'Front-End', 'auth0-config.js');
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        configContent = configContent.replace(
            /domain: '[^']*'/,
            `domain: '${domain}'`
        );
        configContent = configContent.replace(
            /clientId: '[^']*'/,
            `clientId: '${clientId}'`
        );
        configContent = configContent.replace(
            /audience: '[^']*'/,
            `audience: 'https://${domain}/api/v2/'`
        );
        
        fs.writeFileSync(configPath, configContent);
        console.log('✅ Updated Front-End/auth0-config.js');
        
        // Create backup of original files
        const backupDir = path.join(__dirname, 'auth0-backup');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }
        
        console.log('\n🎉 Configuration updated successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Configure your Auth0 application URLs:');
        console.log('   - Callback URLs: http://localhost:3000/auth/success, http://localhost:5000/api/auth0/callback');
        console.log('   - Logout URLs: http://localhost:3000/login-backend.html');
        console.log('   - Web Origins: http://localhost:3000');
        console.log('2. Set up social connections (Google, GitHub) in Auth0 dashboard');
        console.log('3. Test the integration at: http://localhost:3000/test-auth0.html');
        console.log('4. Try social login at: http://localhost:3000/login-backend.html');
        
    } catch (error) {
        console.error('❌ Error updating configuration:', error.message);
    } finally {
        rl.close();
    }
}

// Run the script
updateAuth0Config();