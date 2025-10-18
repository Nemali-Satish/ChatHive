import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';

// Import configurations
import connectDB from './config/db.js';
import configureCloudinary from './config/cloudinary.js';
import logger from './config/logger.js';
import corsOptions from './config/corsOptions.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// Import middleware
import { notFound, errorHandler } from './middleware/error.js';

// Import socket
import { initializeSocket } from './socket/socket.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Configure Cloudinary (required for uploads)
configureCloudinary();

// Initialize Express app
const app = express();

// Get __dirname in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// No local uploads directory needed when using Cloudinary exclusively

// Enable mongoose debug logging in development
if ((process.env.NODE_ENV || 'development') !== 'production') {
  mongoose.set('debug', (collectionName, method, query, doc, options) => {
    // logger.debug(`Mongoose: ${collectionName}.${method} ${JSON.stringify(query)} ${doc ? JSON.stringify(doc) : ''}`);
  });
}

// Security & performance middleware
// Allow loading static images from a different origin (frontend) via CORP
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());

// Morgan HTTP request logger
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// No static serving for local uploads; files are hosted by Cloudinary

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'ChatHive API is running...' });
});

// Routes (no rate limiting as requested)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// Lightweight health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development', db: mongoose.connection.readyState });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`API URL: http://localhost:${PORT}`);
});

// Global process error handlers
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { message: err.message, stack: err.stack });
});
