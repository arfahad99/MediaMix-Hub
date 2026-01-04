// Test script to check route loading
console.log('Testing route loading...');

try {
    console.log('Loading auth routes...');
    const authRoutes = require('./routes/auth');
    console.log('Auth routes loaded:', typeof authRoutes);
    
    console.log('Loading media routes...');
    const mediaRoutes = require('./routes/media');
    console.log('Media routes loaded:', typeof mediaRoutes);
    
    console.log('Loading user routes...');
    const userRoutes = require('./routes/user');
    console.log('User routes loaded:', typeof userRoutes);
    
    console.log('Loading health routes...');
    const healthRoutes = require('./routes/health');
    console.log('Health routes loaded:', typeof healthRoutes);
    
    console.log('Loading share routes...');
    const shareRoutes = require('./routes/share');
    console.log('Share routes loaded:', typeof shareRoutes);
    
    console.log('All routes loaded successfully!');
    
} catch (error) {
    console.error('Error loading routes:', error.message);
    console.error('Stack:', error.stack);
}