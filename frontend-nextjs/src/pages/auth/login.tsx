import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { LoginFormData, RegisterFormData } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { validateEmail, validateUsername, validatePassword } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginForm = useForm<LoginFormData>();
  const registerForm = useForm<RegisterFormData>();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (data: LoginFormData) => {
    try {
      await login(data.identifier, data.password);
      toast.success('Login successful!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    // Client-side validation
    if (!validateEmail(data.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!validateUsername(data.username)) {
      toast.error('Username must be 3-20 characters long and contain only letters, numbers, and underscores');
      return;
    }

    if (!validatePassword(data.password)) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!data.agreeTerms) {
      toast.error('Please agree to the Terms & Conditions');
      return;
    }

    try {
      await register(data);
      toast.success('Account created successfully!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Auth Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="card p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl font-bold">M</span>
                </div>
                <h1 className="text-2xl font-display font-bold text-gray-900 ml-3">
                  MediaMix Hub
                </h1>
              </div>
              <p className="text-gray-600">Your Creative Media Workspace</p>
            </div>

            {/* Tabs */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'login'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'register'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Register
              </button>
            </div>

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <Input
                    label="Username or Email"
                    type="text"
                    placeholder="Enter your username or email"
                    icon={<User className="w-5 h-5" />}
                    {...loginForm.register('identifier', { required: 'Username or email is required' })}
                    error={loginForm.formState.errors.identifier?.message}
                  />
                </div>

                <div>
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    icon={<Lock className="w-5 h-5" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    }
                    {...loginForm.register('password', { required: 'Password is required' })}
                    error={loginForm.formState.errors.password?.message}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      {...loginForm.register('rememberMe')}
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                    Forgot Password?
                  </a>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Sign In
                </Button>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div>
                  <Input
                    label="Username"
                    type="text"
                    placeholder="Choose a username"
                    icon={<User className="w-5 h-5" />}
                    {...registerForm.register('username', { required: 'Username is required' })}
                    error={registerForm.formState.errors.username?.message}
                  />
                </div>

                <div>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    icon={<Mail className="w-5 h-5" />}
                    {...registerForm.register('email', { required: 'Email is required' })}
                    error={registerForm.formState.errors.email?.message}
                  />
                </div>

                <div>
                  <Input
                    label="Password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    icon={<Lock className="w-5 h-5" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    }
                    {...registerForm.register('password', { required: 'Password is required' })}
                    error={registerForm.formState.errors.password?.message}
                  />
                </div>

                <div>
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    icon={<Lock className="w-5 h-5" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    }
                    {...registerForm.register('confirmPassword', { required: 'Please confirm your password' })}
                    error={registerForm.formState.errors.confirmPassword?.message}
                  />
                </div>

                <div>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                      {...registerForm.register('agreeTerms', { required: true })}
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      I agree to the{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-500">
                        Terms & Conditions
                      </a>
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Create Account
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side - Features Showcase */}
        <div className="hidden lg:block">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Why Choose MediaMix Hub?
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Easy Upload</h3>
              <p className="text-sm text-gray-600">Drag & drop your media files with instant preview</p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Creative Tools</h3>
              <p className="text-sm text-gray-600">Built-in editing and organization features</p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Storage</h3>
              <p className="text-sm text-gray-600">Your media is protected with enterprise-grade security</p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Team Collaboration</h3>
              <p className="text-sm text-gray-600">Share and collaborate with your team seamlessly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}