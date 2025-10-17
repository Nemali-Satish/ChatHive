import { TryCatch, ErrorHandler } from '../utils/utility.js'
import { sendAdminToken, clearAdminToken } from '../utils/jwt.js'
import { User } from '../models/user.js'
import { Chat } from '../models/chat.js'
import { Message } from '../models/message.js'

export const adminLogin = TryCatch(async (req, res, next) => {
  const { secret } = req.body || {}
  const expected = process.env.ADMIN_SECRET || ''
  if (!secret) return next(new ErrorHandler('Secret key required', 400))
  if (secret !== expected) return next(new ErrorHandler('Invalid admin secret', 401))
  sendAdminToken(res)
  return res.json({ ok: true })
})

export const adminLogout = TryCatch(async (_req, res) => {
  clearAdminToken(res)
  return res.json({ ok: true })
})

export const getAdminData = TryCatch(async (_req, res) => {
  const [users, chats, messages] = await Promise.all([
    User.countDocuments(),
    Chat.countDocuments(),
    Message.countDocuments(),
  ])
  return res.json({ ok: true, users, chats, messages })
})

const parsePaging = (req) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)))
  const page = Math.max(1, Number(req.query.page || 1))
  const skip = (page - 1) * limit
  return { limit, page, skip }
}

export const allUsers = TryCatch(async (req, res) => {
  const { limit, skip, page } = parsePaging(req)
  const [items, total] = await Promise.all([
    User.find().select('_id name username avatar.url createdAt').skip(skip).limit(limit).lean(),
    User.countDocuments(),
  ])
  return res.json({ ok: true, items, page, total })
})

export const allChats = TryCatch(async (req, res) => {
  const { limit, skip, page } = parsePaging(req)
  const [items, total] = await Promise.all([
    Chat.find().select('_id name groupChat members createdAt').skip(skip).limit(limit).lean(),
    Chat.countDocuments(),
  ])
  return res.json({ ok: true, items, page, total })
})

export const allMessages = TryCatch(async (req, res) => {
  const { limit, skip, page } = parsePaging(req)
  const [items, total] = await Promise.all([
    Message.find().select('_id content chat sender createdAt').skip(skip).limit(limit).lean(),
    Message.countDocuments(),
  ])
  return res.json({ ok: true, items, page, total })
})

export const getDashboardStats = TryCatch(async (_req, res) => {
  const [users, chats, messages] = await Promise.all([
    User.countDocuments(),
    Chat.countDocuments(),
    Message.countDocuments(),
  ])
  return res.json({ ok: true, stats: { users, chats, messages } })
})
