/**
 * Authentication System for MediaMix Hub - Backend API Version
 * Handles login, registration, and session management with real backend
 */

// Configuration
const AUTH_CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    MIN_PASSWORD_LENGTH: 6
};

// API Client for Authentication
class AuthAPIClient {
    constructor() {
        this.baseURL = AUTH_CONFIG.API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
}

// Global API client instance
const authAPI = new AuthAPIClient();

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

        if (!email || !password) {
            this.showError('Please fill in all fields.');
            return;
        }

        this.setLoading(true, 'login');
        this.clearMessages();

        try {
            const result = await authAPI.login(email, password);

            if (result.success && result.token) {
                // Store token in localStorage
                localStorage.setItem('authToken', result.token);
                
                this.showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'index-backend.html';
                }, 1500);
            } else {
                this.showError(result.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Login failed. Please try again.');
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

        // Client-side validation
        if (userData.password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
            this.showError(`Password must be at least ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} characters long.`);
            return;
        }

        if (userData.password !== userData.confirmPassword) {
            this.showError('Passwords do not match.');
            return;
        }

        if (!this.isValidEmail(userData.email)) {
            this.showError('Please enter a valid email address.');
            return;
        }

        this.setLoading(true, 'register');
        this.clearMessages();

        try {
            const result = await authAPI.register(userData);

            if (result.success && result.token) {
                // Store token in localStorage
                localStorage.setItem('authToken', result.token);
                
                this.showSuccess('Account created successfully! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'index-backend.html';
                }, 1500);
            } else {
                this.showError(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError(error.message || 'Registration failed. Please try again.');
        } finally {
            this.setLoading(false, 'register');
        }
    }

    /**
     * Handle social login (Auth0)
     */
    async handleSocialLogin(e) {
        e.preventDefault();
        
        const provider = e.currentTarget.classList.contains('google-btn') ? 'google-oauth2' : 'github';
        
        try {
            this.setLoading(true, 'login');
            this.clearMessages();
            
            // Check if Auth0 is available
            if (typeof auth0Client === 'undefined') {
                throw new Error('Auth0 not initialized. Please refresh the page and try again.');
            }
            
            // Wait for Auth0 to initialize
            await auth0Client.init();
            
            // Initiate Auth0 login with specific connection
            await auth0Client.loginWithRedirect({
                connection: provider,
                state: 'social-login'
            });
            
        } catch (error) {
            console.error('Social login error:', error);
            this.setLoading(false, 'login');
            
            // Fallback to backend redirect for social login
            if (error.message.includes('Auth0 not initialized')) {
                this.showError('Social login is temporarily unavailable. Please use email/password login or try again later.');
            } else {
                // Redirect to backend Auth0 login
                window.location.href = `http://localhost:5000/api/auth0/login?connection=${provider}&state=social-login`;
            }
        }
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
        if (email && !this.isValidEmail(email)) {
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
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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
    // Check if user already has a token and redirect if authenticated
    const token = localStorage.getItem('authToken');
    if (token) {
        // Optionally verify token with backend here
        console.log('User already has token, redirecting to main app');
        window.location.href = 'index-backend.html';
        return;
    }
    
    // Initialize login UI
    new AuthUI();
    console.log('Authentication UI initialized for backend API');
});

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.authAPI = authAPI;
    window.AuthUI = AuthUI;
}