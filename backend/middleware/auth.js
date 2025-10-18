import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        res.set('WWW-Authenticate', 'Bearer realm="api", error="invalid_token", error_description="user not found"');
        throw new Error('User not found');
      }

      next();
    } catch (error) {
      res.status(401);
      if (error.name === 'TokenExpiredError') {
        res.set('WWW-Authenticate', 'Bearer realm="api", error="invalid_token", error_description="token expired"');
        throw new Error('Not authorized, token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        res.set('WWW-Authenticate', 'Bearer realm="api", error="invalid_token", error_description="invalid token"');
        throw new Error('Not authorized, invalid token');
      }
      res.set('WWW-Authenticate', 'Bearer realm="api", error="invalid_token"');
      throw new Error('Not authorized, token verification failed');
    }
  }

  if (!token) {
    res.status(401);
    res.set('WWW-Authenticate', 'Bearer realm="api"');
    throw new Error('Not authorized, no token');
  }
});

export const requireProfileCompleted = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }
  if (!req.user.profileCompleted) {
    res.status(403);
    throw new Error('Profile incomplete');
  }
  next();
});
