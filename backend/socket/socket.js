import { Server } from 'socket.io';
import logger from '../config/logger.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
    pingTimeout: 60000,
  });

  const userSocketMap = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    logger.info(`Socket connected ${socket.id}`);

    // Setup user
    socket.on(SOCKET_EVENTS.SETUP, (userData) => {
      socket.join(userData._id);
      userSocketMap.set(userData._id, socket.id);
      socket.emit(SOCKET_EVENTS.CONNECTED);
      
      // Broadcast user online status
      socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, userData._id);
    });

    // Join chat room
    socket.on(SOCKET_EVENTS.JOIN_CHAT, (room) => {
      socket.join(room);
      logger.debug(`Socket ${socket.id} joined room ${room}`);
    });

    // Typing indicator
    socket.on(SOCKET_EVENTS.TYPING, (room) => {
      socket.to(room).emit(SOCKET_EVENTS.TYPING, room);
    });

    socket.on(SOCKET_EVENTS.STOP_TYPING, (room) => {
      socket.to(room).emit(SOCKET_EVENTS.STOP_TYPING, room);
    });

    // New message
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (newMessageReceived) => {
      const chat = newMessageReceived.chat;

      if (!chat.users) return console.log('chat.users not defined');

      chat.users.forEach((user) => {
        if (user._id === newMessageReceived.sender._id) return;
        socket.to(user._id).emit(SOCKET_EVENTS.MESSAGE_RECEIVED, newMessageReceived);
      });
    });

    // Message read: broadcast so all clients (sidebars) can update badges
    socket.on(SOCKET_EVENTS.MESSAGE_READ, ({ chatId, userId }) => {
      io.emit(SOCKET_EVENTS.MESSAGE_READ, { chatId, userId });
    });

    // User disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected ${socket.id}`);
      
      // Find and remove user from map
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, userId);
          break;
        }
      }
    });

    // Leave chat
    socket.on(SOCKET_EVENTS.LEAVE_CHAT, (room) => {
      socket.leave(room);
      logger.debug(`Socket ${socket.id} left room ${room}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
