import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';
import logger from '../config/logger.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, username, email, password, name } = req.body;

  logger.info('Registration attempt', { username, email });

  if ((!firstName && !name) || !username || !email || !password) {
    logger.warn('Registration failed: Missing required fields');
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    logger.warn(`Registration failed: User already exists - ${email} / ${username}`);
    res.status(400);
    throw new Error('User already exists with provided email or username');
  }

  try {
    const user = await User.create({
      name: name || [firstName, lastName].filter(Boolean).join(' ').trim(),
      firstName,
      lastName,
      username,
      email,
      password,
    });

    if (user) {
      logger.info(`User registered successfully: ${user.email}`);
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          profileCompleted: user.profileCompleted,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    logger.error('User creation error:', error);
    res.status(500);
    throw new Error(error.message || 'Failed to create user');
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { identifier, username, email, password } = req.body;

  const id = (identifier || username || email || '').toString();
  logger.info('Login attempt', { identifier: id });

  if (!id || !password) {
    logger.warn('Login failed: Missing credentials');
    res.status(400);
    throw new Error('Please provide username/email and password');
  }

  // Determine lookup by email vs username
  const isEmail = id.includes('@');
  const query = isEmail ? { email: id.toLowerCase() } : { username: id.toLowerCase() };
  const user = await User.findOne(query).select('+password');

  if (user && (await user.comparePassword(password))) {
    // Update online status
    user.isOnline = true;
    await user.save();

    logger.info(`User logged in successfully: ${user.username}`);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: user.isOnline,
        profileCompleted: user.profileCompleted,
        token: generateToken(user._id),
      },
    });
  } else {
    logger.warn(`Login failed: Invalid credentials for ${id}`);
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: user,
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (user) {
    user.isOnline = false;
    user.lastSeen = Date.now();
    await user.save();
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});
