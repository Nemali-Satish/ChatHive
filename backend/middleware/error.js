import logger from '../config/logger.js';

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server Error';

  // Handle Mongo duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const fields = Object.keys(err.keyValue || {});
    message = `Duplicate value for field(s): ${fields.join(', ')}`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors || {}).map((e) => e.message);
    message = errors.join(', ');
  }

  // Log the error with context
  logger.error(`Error ${statusCode}: ${message}`, {
    method: req.method,
    path: req.path,
    body: req.body,
    stack: err.stack,
    raw: err,
    user: req.user?._id,
  });

  const code =
    statusCode === 401 ? 'UNAUTHORIZED' :
    statusCode === 403 ? 'FORBIDDEN' :
    statusCode === 404 ? 'NOT_FOUND' :
    statusCode === 400 ? 'BAD_REQUEST' :
    'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    message,
    code,
    path: req.path,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
