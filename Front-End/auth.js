/**
 * Authentication System for MediaMix Hub
 * Handles login, registration, session management, and user authentication
 */

// Authentication Configuration
const AUTH_CONFIG = {
    SESSION_KEY: 'mediamix_auth_session',
    USER_KEY: 'mediamix_user_data',
    USERS_KEY: 'mediamix_registered_users',
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    MIN_PASSWORD_LENGTH: 6
};

// Mock user database (in real app, this would be server-side)
const DEFAULT_USERS = [
    {
        id: '1',
        name: 'Demo User',
        email: 'demo@mediamix.com',
        password: 'demo123', // In real app, this would be hashed
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        createdAt: new Date().toISOString()
    }
];

// Authentication Manager Class
class AuthManager {
    constructor() {
        this.initializeUsers();
        this.currentUser = null;
        this.sessionTimer = null;
    }

    /**
     * Initialize user database
     */
    initializeUsers() {
        const existingUsers = this.getStoredUsers();
        if (existingUsers.length === 0) {
            localStorage.setItem(AUTH_CONFIG.USERS_KEY, JSON.stringify(DEFAULT_USERS));
        }
    }

    /**
     * Get stored users from localStorage
     */
    getStoredUsers() {
        try {
            const users = localStorage.getItem(AUTH_CONFIG.USERS_KEY);
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    /**
     * Save users to localStorage
     */
    saveUsers(users) {
        try {
            localStorage.setItem(AUTH_CONFIG.USERS_KEY, JSON.stringify(users));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    /**
     * Check if user is currently authenticated
     */
    isAuthenticated() {
        const session = this.getSession();
        if (!session) return false;

        // Check if session is expired
        if (Date.now() > session.expiresAt) {
            this.logout();
            return false;
        }

        return true;
    }

    /**
     * Get current session
     */
    getSession() {
        try {
            const session = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error loading session:', error);
            return null;
        }
    }

    /**
     * Get current user data
     */
    getCurrentUser() {
        if (!this.isAuthenticated()) return null;

        try {
            const userData = localStorage.getItem(AUTH_CONFIG.USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    }

    /**
     * Create session for user
     */
    createSession(user) {
        const session = {
            userId: user.id,
            createdAt: Date.now(),
            expiresAt: Date.now() + AUTH_CONFIG.SESSION_DURATION
        };

        try {
            localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(session));
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }));

            this.currentUser = user;
            this.startSessionTimer();
            return true;
        } catch (error) {
            console.error('Error creating session:', error);
            return false;
        }
    }

    /**
     * Start session expiration timer
     */
    startSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }

        const session = this.getSession();
        if (session) {
            const timeUntilExpiry = session.expiresAt - Date.now();
            if (timeUntilExpiry > 0) {
                this.sessionTimer = setTimeout(() => {
                    this.logout();
                    this.showSessionExpiredMessage();
                }, timeUntilExpiry);
            }
        }
    }

    /**
     * Show session expired message
     */
    showSessionExpiredMessage() {
        alert('Your session has expired. Please log in again.');
        window.location.href = 'login.html';
    }

    /**
     * Login user with email and password
     */
    async login(email, password, rememberMe = false) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const users = this.getStoredUsers();
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (!user) {
                throw new Error('User not found. Please check your email address.');
            }

            if (user.password !== password) {
                throw new Error('Invalid password. Please try again.');
            }

            // Adjust session duration if "Remember Me" is checked
            if (rememberMe) {
                AUTH_CONFIG.SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
            } else {
                AUTH_CONFIG.SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
            }

            const sessionCreated = this.createSession(user);
            if (!sessionCreated) {
                throw new Error('Failed to create session. Please try again.');
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Register new user
     */
    async register(userData) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const { name, email, password, confirmPassword } = userData;

            // Validation
            if (!name || name.trim().length < 2) {
                throw new Error('Name must be at least 2 characters long.');
            }

            if (!this.isValidEmail(email)) {
                throw new Error('Please enter a valid email address.');
            }

            if (password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
                throw new Error(`Password must be at least ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} characters long.`);
            }

            if (password !== confirmPassword) {
                throw new Error('Passwords do not match.');
            }

            const users = this.getStoredUsers();

            // Check if user already exists
            if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
                throw new Error('An account with this email already exists.');
            }

            // Create new user
            const newUser = {
                id: Date.now().toString(),
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: password, // In real app, this would be hashed
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            this.saveUsers(users);

            // Auto-login after registration
            const sessionCreated = this.createSession(newUser);
            if (!sessionCreated) {
                throw new Error('Account created but failed to log in. Please try logging in manually.');
            }

            return {
                success: true,
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Logout user
     */
    logout() {
        try {
            localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
            localStorage.removeItem(AUTH_CONFIG.USER_KEY);
            
            if (this.sessionTimer) {
                clearTimeout(this.sessionTimer);
                this.sessionTimer = null;
            }

            this.currentUser = null;
            return true;
        } catch (error) {
            console.error('Error during logout:', error);
            return false;
        }
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Check authentication and redirect if needed
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    /**
     * Redirect to main app if already authenticated
     */
    redirectIfAuthenticated() {
        if (this.isAuthenticated()) {
            window.location.href = 'index.html';
            return true;
        }
        return false;
    }
}

// Global authentication manager instance
const authManager = new AuthManager();

// Authentication UI Controller
class AuthUI {
    constructor() {
        this.currentTab = 'login';
        this.initializeElements();
        this.setupEventListeners();
        this.setupFormValidation();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // Tabs
        this.loginTab = document.getElementById('loginTab');
        this.registerTab = document.getElementById('registerTab');

        // Forms
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');

        // Login form elements
        this.loginEmail = document.getElementById('loginEmail');
        this.loginPassword = document.getElementById('loginPassword');
        this.rememberMe = document.getElementById('rememberMe');
        this.loginBtn = document.getElementById('loginBtn');
        this.loginLoader = document.getElementById('loginLoader');

        // Register form elements
        this.registerName = document.getElementById('registerName');
        this.registerEmail = document.getElementById('registerEmail');
        this.registerPassword = document.getElementById('registerPassword');
        this.confirmPassword = document.getElementById('confirmPassword');
        this.agreeTerms = document.getElementById('agreeTerms');
        this.registerBtn = document.getElementById('registerBtn');
        this.registerLoader = document.getElementById('registerLoader');

        // Messages
        this.authError = document.getElementById('authError');
        this.authSuccess = document.getElementById('authSuccess');

        // Password toggles
        this.toggleLoginPassword = document.getElementById('toggleLoginPassword');
        this.toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab switching
        this.loginTab?.addEventListener('click', () => this.switchTab('login'));
        this.registerTab?.addEventListener('click', () => this.switchTab('register'));

        // Form submissions
        this.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm?.addEventListener('submit', (e) => this.handleRegister(e));

        // Password toggles
        this.toggleLoginPassword?.addEventListener('click', () => this.togglePassword('loginPassword'));
        this.toggleRegisterPassword?.addEventListener('click', () => this.togglePassword('registerPassword'));

        // Social login buttons (mock)
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSocialLogin(e));
        });
    }

    /**
     * Setup form validation
     */
    setupFormValidation() {
        // Real-time validation for register form
        this.registerEmail?.addEventListener('blur', () => this.validateEmail());
        this.registerPassword?.addEventListener('input', () => this.validatePassword());
        this.confirmPassword?.addEventListener('input', () => this.validatePasswordMatch());
    }

    /**
     * Switch between login and register tabs
     */
    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        this.loginTab?.classList.toggle('active', tab === 'login');
        this.registerTab?.classList.toggle('active', tab === 'register');

        // Update form visibility
        this.loginForm?.classList.toggle('hidden', tab !== 'login');
        this.registerForm?.classList.toggle('hidden', tab !== 'register');

        // Clear messages
        this.clearMessages();
    }

    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const email = this.loginEmail?.value.trim();
        const password = this.loginPassword?.value;
        const rememberMe = this.rememberMe?.checked;

        if (!email || !password) {
            this.showError('Please fill in all fields.');
            return;
        }

        this.setLoading(true, 'login');
        this.clearMessages();

        try {
            const result = await authManager.login(email, password, rememberMe);

            if (result.success) {
                this.showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Login failed. Please try again.');
        } finally {
            this.setLoading(false, 'login');
        }
    }

    /**
     * Handle register form submission
     */
    async handleRegister(e) {
        e.preventDefault();

        const userData = {
            name: this.registerName?.value.trim(),
            email: this.registerEmail?.value.trim(),
            password: this.registerPassword?.value,
            confirmPassword: this.confirmPassword?.value
        };

        if (!userData.name || !userData.email || !userData.password || !userData.confirmPassword) {
            this.showError('Please fill in all fields.');
            return;
        }

        if (!this.agreeTerms?.checked) {
            this.showError('Please agree to the Terms & Conditions.');
            return;
        }

        this.setLoading(true, 'register');
        this.clearMessages();

        try {
            const result = await authManager.register(userData);

            if (result.success) {
                this.showSuccess('Account created successfully! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Registration failed. Please try again.');
        } finally {
            this.setLoading(false, 'register');
        }
    }

    /**
     * Handle social login (mock)
     */
    handleSocialLogin(e) {
        e.preventDefault();
        const provider = e.currentTarget.classList.contains('google-btn') ? 'Google' : 'GitHub';
        this.showError(`${provider} login is not available in demo mode. Please use the regular login form.`);
    }

    /**
     * Toggle password visibility
     */
    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const toggle = inputId === 'loginPassword' ? this.toggleLoginPassword : this.toggleRegisterPassword;
        
        if (input && toggle) {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            toggle.innerHTML = `<i class="fas fa-${isPassword ? 'eye-slash' : 'eye'}"></i>`;
        }
    }

    /**
     * Validate email format
     */
    validateEmail() {
        const email = this.registerEmail?.value.trim();
        if (email && !authManager.isValidEmail(email)) {
            this.registerEmail.classList.add('invalid');
            return false;
        } else {
            this.registerEmail?.classList.remove('invalid');
            return true;
        }
    }

    /**
     * Validate password strength
     */
    validatePassword() {
        const password = this.registerPassword?.value;
        if (password && password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
            this.registerPassword.classList.add('invalid');
            return false;
        } else {
            this.registerPassword?.classList.remove('invalid');
            return true;
        }
    }

    /**
     * Validate password match
     */
    validatePasswordMatch() {
        const password = this.registerPassword?.value;
        const confirmPassword = this.confirmPassword?.value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.confirmPassword.classList.add('invalid');
            return false;
        } else {
            this.confirmPassword?.classList.remove('invalid');
            return true;
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading, form) {
        if (form === 'login') {
            this.loginBtn.disabled = loading;
            this.loginBtn.classList.toggle('loading', loading);
        } else {
            this.registerBtn.disabled = loading;
            this.registerBtn.classList.toggle('loading', loading);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (this.authError) {
            this.authError.textContent = message;
            this.authError.style.display = 'block';
        }
        if (this.authSuccess) {
            this.authSuccess.style.display = 'none';
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        if (this.authSuccess) {
            this.authSuccess.textContent = message;
            this.authSuccess.style.display = 'block';
        }
        if (this.authError) {
            this.authError.style.display = 'none';
        }
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        if (this.authError) this.authError.style.display = 'none';
        if (this.authSuccess) this.authSuccess.style.display = 'none';
    }
}

// Initialize authentication system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the login page
    if (window.location.pathname.includes('login.html')) {
        // Redirect if already authenticated
        if (authManager.redirectIfAuthenticated()) {
            return;
        }
        
        // Initialize login UI
        new AuthUI();
        console.log('Authentication UI initialized');
    } else {
        // On main app pages, check authentication
        if (!authManager.requireAuth()) {
            return;
        }
        
        // Start session timer for authenticated users
        authManager.startSessionTimer();
        console.log('Authentication verified for main app');
    }
});

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.authManager = authManager;
    window.AuthUI = AuthUI;
}