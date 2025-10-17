import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

import { connectDB } from './utils/features.js'
import { errorMiddleware } from './middlewares/error.js'
import { corsOptions } from './constants/config.js'
import { socketAuthenticator } from './middlewares/auth.js'
import {
  CHAT_JOINED,
  CHAT_LEAVED,
  ONLINE_USERS,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  START_TYPING,
  STOP_TYPING,
} from './constants/events.js'
import { Message } from './models/message.js'
import { getSockets } from './lib/helper.js'
import mongoose from 'mongoose'
import userRoute from './routes/user.js'
import chatRoute from './routes/chat.js'
import adminRoute from './routes/admin.js'

// Load env
dotenv.config({ path: './.env' })

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: corsOptions,
})

// In-memory registries
export const userSocketIDs = new Map()
export const onlineUsers = new Set()

// Make io available in routes/controllers
app.set('io', io)

// DB
const mongoURI = process.env.MONGO_URI || ''
await connectDB(mongoURI)

// Middlewares
app.use(express.json())
app.use(cookieParser())
app.use(cors(corsOptions))

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'chat-hive', time: new Date().toISOString() })
})

// API routes
app.use('/api/v1/user', userRoute)
app.use('/api/v1/chat', chatRoute)
app.use('/api/v1/admin', adminRoute)

// Socket.IO
io.use((socket, next) => {
  // parse cookies for WS handshake and run socket auth
  cookieParser()(socket.request, socket.request.res, (err) =>
    socketAuthenticator(err, socket, next)
  )
})

io.on('connection', (socket) => {
  // Basic handshake log. Extend with auth later
  const id = socket.id
  socket.emit('welcome', { id, message: 'Connected to ChatHive WS' })

  // Register user socket if authenticated user present
  const user = socket.user
  if (user && user._id) {
    userSocketIDs.set(String(user._id), socket.id)
  }

  // Track presence similar to reference impl
  socket.on(CHAT_JOINED, ({ userId, members }) => {
    if (userId) onlineUsers.add(String(userId))
    socket.to(members?.map((m) => userSocketIDs.get(String(m))) || []).emit(
      ONLINE_USERS,
      Array.from(onlineUsers)
    )
  })

  socket.on(CHAT_LEAVED, ({ userId, members }) => {
    if (userId) onlineUsers.delete(String(userId))
    socket.to(members?.map((m) => userSocketIDs.get(String(m))) || []).emit(
      ONLINE_USERS,
      Array.from(onlineUsers)
    )
  })

  // Typing indicators
  socket.on(START_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members)
    socket.to(membersSockets).emit(START_TYPING, { chatId })
  })

  socket.on(STOP_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members)
    socket.to(membersSockets).emit(STOP_TYPING, { chatId })
  })

  // New message
  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const now = new Date()
    const tempId = new mongoose.Types.ObjectId().toString()

    const messageForRealTime = {
      content: message,
      _id: tempId,
      sender: {
        _id: user?._id,
        name: user?.name,
      },
      chat: chatId,
      createdAt: now.toISOString(),
    }

    const messageForDB = {
      content: message,
      sender: user?._id,
      chat: chatId,
    }

    const membersSocket = getSockets(members)
    io.to(membersSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    })
    io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId })

    try {
      await Message.create(messageForDB)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to persist message', error)
    }
  })

  socket.on('disconnect', () => {
    if (user && user._id) {
      userSocketIDs.delete(String(user._id))
      onlineUsers.delete(String(user._id))
      socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers))
    }
  })
})

// Error handler
app.use(errorMiddleware)

// Start server
const PORT = Number(process.env.PORT || 3000)
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`)
})
