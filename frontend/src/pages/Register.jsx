import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, MessageCircle, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import { validateRegisterForm } from '../utils/validation';
import useAuthStore from '../store/useAuthStore';

const Register = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const register = useAuthStore((state) => state.register);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'username') {
      setFormData({ ...formData, username: value.toLowerCase() });
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

    const { isValid, errors: validationErrors } = validateRegisterForm(
      formData.firstName,
      formData.lastName,
      formData.username,
      formData.email,
      formData.password,
      formData.confirmPassword
    );

    if (!isValid) {
      setErrors(validationErrors);
      toast.error('Please fill in all fields correctly');
      return false;
    }

    setLoading(true);

    try {
      const response = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      const data = response.data;

      if (data.success) {
        // Store register already persisted state; setAuth is redundant but kept to preserve existing flow
        setAuth(data.data, data.data.token);
        toast.success('Registration successful!');
        setTimeout(() => navigate('/'), 100);
      } else {
        const errorMsg = data.message || 'Registration failed';
        toast.error(errorMsg);
        setErrors({ general: errorMsg });
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }

    return false;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-app px-4 py-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full bg-panel border border-default rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-primary mb-2">
          Create Account
        </h2>
        <p className="text-center text-secondary mb-8">
          Sign up to get started with ChatHive
        </p>

        {/* Error Message */}
        {errors.general && (
          <div className="mb-4 p-3 border rounded-lg" style={{ borderColor: '#fecaca', background: 'rgba(254, 202, 202, 0.2)' }}>
            <p className="text-sm text-center" style={{ color: '#ef4444' }}>{errors.general}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate autoComplete="off">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              type="text"
              name="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              icon={UserIcon}
            />
            <Input
              label="Last Name"
              type="text"
              name="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              icon={UserIcon}
            />
          </div>

          <Input
            label="Username"
            type="text"
            name="username"
            placeholder="must start with a letter, a-z0-9_-"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            icon={User}
          />

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            icon={Mail}
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

          <Input
            label="Confirm Password"
            type={showConfirm ? 'text' : 'password'}
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            icon={Lock}
            rightIcon={showConfirm ? EyeOff : Eye}
            onRightIconClick={() => setShowConfirm((v) => !v)}
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
          >
            Sign Up
          </Button>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center text-gray-600 dark:text-[#8696a0]">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
