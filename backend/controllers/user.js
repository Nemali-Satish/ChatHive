import { TryCatch } from '../utils/utility.js'
import { sendToken, clearToken } from '../utils/jwt.js'
import { User } from '../models/user.js'
import { compare } from 'bcrypt'
import { Request } from '../models/request.js'
import { Chat } from '../models/chat.js'
import { getSockets } from '../lib/helper.js'
import { NEW_REQUEST, REFETCH_CHATS } from '../constants/events.js'

export const newUser = TryCatch(async (req, res) => {
  const { name, username, email, password } = req.body || {}
  if (!name || !username || !email || !password) {
    return res.status(400).json({ ok: false, message: 'name, username, email, password are required' })
  }

  const uname = String(username).toLowerCase().trim()
  const existingUsername = await User.findOne({ username: uname })
  if (existingUsername) return res.status(409).json({ ok: false, message: 'Username already taken' })

  const existingEmail = await User.findOne({ email: String(email).toLowerCase().trim() })
  if (existingEmail) return res.status(409).json({ ok: false, message: 'Email already registered' })

  const user = await User.create({
    name,
    username: uname,
    email: String(email).toLowerCase().trim(),
    password,
    avatar: { public_id: 'placeholder', url: 'https://placehold.co/96x96' },
    profileCompleted: false,
  })

  sendToken(res, user)
  return res.status(201).json({
    ok: true,
    user: { _id: user._id, name: user.name, username: user.username, email: user.email, profileCompleted: user.profileCompleted },
  })
})

export const login = TryCatch(async (req, res) => {
  const { username, email, password } = req.body || {}
  const identifier = (email || username || '').toString().trim().toLowerCase()
  if (!identifier || !password) return res.status(400).json({ ok: false, message: 'identifier and password are required' })

  const isEmail = /@/.test(identifier)
  const query = isEmail ? { email: identifier } : { username: identifier }
  const user = await User.findOne(query).select('+password')
  if (!user) return res.status(401).json({ ok: false, message: 'Invalid credentials' })

  const isMatch = await compare(password, user.password)
  if (!isMatch) return res.status(401).json({ ok: false, message: 'Invalid credentials' })

  sendToken(res, user)
  return res.json({ ok: true, user: { _id: user._id, name: user.name, username: user.username, email: user.email, profileCompleted: user.profileCompleted } })
})

export const logout = TryCatch(async (_req, res) => {
  clearToken(res)
  return res.json({ ok: true })
})

export const getMyProfile = TryCatch(async (req, res) => {
  const user = await User.findById(req.user).lean()
  return res.json({ ok: true, user })
})

export const updateProfile = TryCatch(async (req, res) => {
  const { name, username, bio, avatarUrl, avatarBase64, preferences } = req.body || {}
  const user = await User.findById(req.user)
  if (!user) return res.status(404).json({ ok: false, message: 'User not found' })

  // Update name
  if (typeof name === 'string' && name.trim()) {
    user.name = name.trim()
  }
  // Update username with uniqueness check
  if (typeof username === 'string' && username.trim() && username !== user.username) {
    const exists = await User.findOne({ username })
    if (exists) return res.status(409).json({ ok: false, message: 'Username already taken' })
    user.username = username.trim()
  }

  if (bio) user.bio = bio
  if (avatarUrl || avatarBase64) {
    user.avatar = user.avatar || {}
    user.avatar.url = avatarUrl || avatarBase64
    user.avatar.public_id = user.avatar.public_id || 'uploaded'
  }
  if (preferences && typeof preferences === 'object') {
    if (preferences.theme === 'light' || preferences.theme === 'dark') {
      user.preferences = user.preferences || {}
      user.preferences.theme = preferences.theme
    }
    if (typeof preferences.marketing === 'boolean') {
      user.preferences = user.preferences || {}
      user.preferences.marketing = preferences.marketing
    }
  }
  user.profileCompleted = true
  await user.save()

  return res.json({ ok: true, user: { _id: user._id, name: user.name, username: user.username, email: user.email, profileCompleted: user.profileCompleted, avatar: user.avatar, bio: user.bio, preferences: user.preferences } })
})

export const searchUser = TryCatch(async (req, res) => {
  const q = req.query.q || ''
  const items = await User.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { username: { $regex: q, $options: 'i' } },
    ],
  })
    .select('_id name username avatar.url')
    .limit(20)
    .lean()
  return res.json({ ok: true, items })
})

export const sendFriendRequest = TryCatch(async (req, res) => {
  const receiver = req.body?.userId
  const sender = req.user
  if (!receiver) return res.status(400).json({ ok: false, message: 'userId is required' })
  if (String(receiver) === String(sender)) return res.status(400).json({ ok: false, message: 'Cannot send request to yourself' })

  const exists = await Request.findOne({ sender, receiver, status: 'pending' })
  if (exists) return res.status(409).json({ ok: false, message: 'Request already sent' })

  await Request.create({ sender, receiver, status: 'pending' })

  const io = req.app.get('io')
  const sockets = getSockets([receiver])
  io.to(sockets).emit(NEW_REQUEST)

  return res.json({ ok: true })
})

export const acceptFriendRequest = TryCatch(async (req, res) => {
  const { requestId, accept } = req.body || {}
  if (!requestId) return res.status(400).json({ ok: false, message: 'requestId is required' })
  const fr = await Request.findById(requestId)
  if (!fr) return res.status(404).json({ ok: false, message: 'Request not found' })
  if (String(fr.receiver) !== String(req.user)) return res.status(403).json({ ok: false, message: 'Not authorized' })

  fr.status = accept === false ? 'rejected' : 'accepted'
  await fr.save()

  // If accepted, ensure a direct chat exists
  if (fr.status === 'accepted') {
    const members = [String(fr.sender), String(fr.receiver)]
    let chat = await Chat.findOne({ groupChat: false, members: { $all: members, $size: 2 } })
    if (!chat) {
      chat = await Chat.create({ name: 'Direct Chat', groupChat: false, members })
    }
  }

  const io = req.app.get('io')
  const sockets = getSockets([fr.sender, fr.receiver])
  io.to(sockets).emit(REFETCH_CHATS)

  return res.json({ ok: true })
})

export const getMyNotifications = TryCatch(async (req, res) => {
  const items = await Request.find({ receiver: req.user, status: 'pending' })
    .populate('sender', '_id name username avatar.url')
    .sort({ createdAt: -1 })
    .lean()
  return res.json({ ok: true, items })
})

export const getMyFriends = TryCatch(async (req, res) => {
  const myId = String(req.user)
  const directChats = await Chat.find({ groupChat: false, members: myId })
    .select('_id name members createdAt updatedAt')
    .lean()
  return res.json({ ok: true, friends: directChats })
})
