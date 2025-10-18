import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, MessageCircle, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import { validateLoginForm } from '../utils/validation';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/constants';
import useAuthStore from '../store/useAuthStore';

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'identifier') {
      // Lowercase if it's a username (no @)
      const v = value.includes('@') ? value : value.toLowerCase();
      setFormData({ ...formData, identifier: v });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Clear previous errors
    setErrors({});

    const { isValid, errors: validationErrors } = validateLoginForm(
      formData.identifier,
      formData.password
    );

    if (!isValid) {
      setErrors(validationErrors);
      toast.error('Please fill in all fields correctly');
      return false;
    }

    setLoading(true);

    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, {
        identifier: formData.identifier,
        password: formData.password,
      });
      const data = response.data;

      if (data.success) {
        setAuth(data.data, data.data.token);
        toast.success('Login successful!');
        const params = new URLSearchParams(window.location.search);
        const next = params.get('next');
        setTimeout(() => navigate(next || '/'), 100);
      } else {
        const errorMsg = data.message || 'Login failed';
        toast.error(errorMsg);
        setErrors({ general: errorMsg });
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Invalid credentials';
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }

    return false;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-app px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full bg-panel border border-default rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 dark:bg-blue-700 p-3 rounded-full">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-primary mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-secondary mb-8">
          Sign in to continue to ChatHive
        </p>

        {/* Error Message */}
        {errors.general && (
          <div className="mb-4 p-3 border rounded-lg" style={{ borderColor: '#fecaca', background: 'rgba(254, 202, 202, 0.2)' }}>
            <p className="text-sm text-center" style={{ color: '#ef4444' }}>{errors.general}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate autoComplete="off">
          <Input
            label="Username or Email"
            type="text"
            name="identifier"
            placeholder="Enter your username or email"
            value={formData.identifier}
            onChange={handleChange}
            error={errors.identifier}
            icon={UserIcon}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            icon={Lock}
            rightIcon={showPassword ? EyeOff : Eye}
            onRightIconClick={() => setShowPassword((v) => !v)}
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        {/* Register Link */}
        <p className="mt-6 text-center text-gray-600 dark:text-[#8696a0]">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
