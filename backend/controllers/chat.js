import { TryCatch } from '../utils/utility.js'
import { Chat } from '../models/chat.js'
import { Message } from '../models/message.js'
import mongoose from 'mongoose'
import { getSockets, getBase64 } from '../lib/helper.js'
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from '../constants/events.js'
import { isCloudEnabled, uploadBuffer } from '../utils/cloudinary.js'

export const newGroupChat = TryCatch(async (req, res) => {
  const { name, members = [] } = req.body || {}
  if (!name) return res.status(400).json({ ok: false, message: 'name is required' })
  const creator = req.user
  const uniqueMembers = Array.from(new Set([creator, ...members.map(String)]))

  const chat = await Chat.create({
    name,
    groupChat: true,
    creator,
    members: uniqueMembers,
  })
  return res.status(201).json({ ok: true, chat })
})

export const getMyChats = TryCatch(async (req, res) => {
  const myId = req.user
  const items = await Chat.find({ members: myId })
    .select('_id name groupChat members createdAt updatedAt')
    .lean()
  return res.json({ ok: true, items })
})

export const getMyGroups = TryCatch(async (req, res) => {
  const myId = req.user
  const items = await Chat.find({ members: myId, groupChat: true })
    .select('_id name members createdAt updatedAt')
    .lean()
  return res.json({ ok: true, items })
})

export const addMembers = TryCatch(async (req, res) => {
  const { chatId, members = [] } = req.body || {}
  const chat = await Chat.findById(chatId)
  if (!chat) return res.status(404).json({ ok: false, message: 'Chat not found' })
  if (!chat.groupChat) return res.status(400).json({ ok: false, message: 'Not a group chat' })
  if (!chat.members.map(String).includes(String(req.user))) return res.status(403).json({ ok: false, message: 'Not a member' })

  const set = new Set(chat.members.map(String))
  members.map(String).forEach((m) => set.add(m))
  chat.members = Array.from(set)
  await chat.save()
  return res.json({ ok: true, chat })
})

export const removeMember = TryCatch(async (req, res) => {
  const { chatId, memberId } = req.body || {}
  const chat = await Chat.findById(chatId)
  if (!chat) return res.status(404).json({ ok: false, message: 'Chat not found' })
  if (!chat.groupChat) return res.status(400).json({ ok: false, message: 'Not a group chat' })
  if (!chat.members.map(String).includes(String(req.user))) return res.status(403).json({ ok: false, message: 'Not a member' })

  chat.members = chat.members.filter((m) => String(m) !== String(memberId))
  await chat.save()
  return res.json({ ok: true, chat })
})

export const leaveGroup = TryCatch(async (req, res) => {
  const { id } = req.params
  const chat = await Chat.findById(id)
  if (!chat) return res.status(404).json({ ok: false, message: 'Chat not found' })
  if (!chat.groupChat) return res.status(400).json({ ok: false, message: 'Not a group chat' })

  chat.members = chat.members.filter((m) => String(m) !== String(req.user))
  await chat.save()
  return res.json({ ok: true })
})

export const renameGroup = TryCatch(async (req, res) => {
  const { id } = req.params
  const { name } = req.body || {}
  const chat = await Chat.findById(id)
  if (!chat) return res.status(404).json({ ok: false, message: 'Chat not found' })
  if (!chat.groupChat) return res.status(400).json({ ok: false, message: 'Not a group chat' })
  if (!chat.members.map(String).includes(String(req.user))) return res.status(403).json({ ok: false, message: 'Not a member' })
  if (!name) return res.status(400).json({ ok: false, message: 'name is required' })

  chat.name = name
  await chat.save()
  return res.json({ ok: true, chat })
})

export const deleteChat = TryCatch(async (req, res) => {
  const { id } = req.params
  const chat = await Chat.findById(id)
  if (!chat) return res.status(404).json({ ok: false, message: 'Chat not found' })
  if (!chat.members.map(String).includes(String(req.user))) return res.status(403).json({ ok: false, message: 'Not a member' })

  await Message.deleteMany({ chat: id })
  await Chat.deleteOne({ _id: id })
  return res.json({ ok: true })
})

export const sendAttachments = TryCatch(async (req, res) => {
  const { chatId } = req.body || {}
  if (!chatId) return res.status(400).json({ ok: false, message: 'chatId is required' })

  const chat = await Chat.findById(chatId)
  if (!chat) return res.status(404).json({ ok: false, message: 'Chat not found' })
  if (!chat.members.map(String).includes(String(req.user))) return res.status(403).json({ ok: false, message: 'Not a member' })

  const files = req.files || []
  if (!files.length) return res.status(400).json({ ok: false, message: 'No files provided' })

  let attachments = []
  if (isCloudEnabled()) {
    attachments = await Promise.all(files.map((f) => uploadBuffer(f)))
  } else {
    // Fallback: base64 data URLs
    attachments = files.map((file, idx) => ({
      public_id: `${Date.now()}_${idx}`,
      url: getBase64(file),
    }))
  }

  const messageDoc = await Message.create({
    content: '',
    attachments,
    sender: req.user,
    chat: chatId,
  })

  const payload = {
    _id: messageDoc._id,
    content: '',
    attachments,
    sender: { _id: req.user },
    chat: chatId,
    createdAt: messageDoc.createdAt,
  }

  const sockets = getSockets(chat.members)
  const io = req.app.get('io')
  io.to(sockets).emit(NEW_MESSAGE, { chatId, message: payload })
  io.to(sockets).emit(NEW_MESSAGE_ALERT, { chatId })

  return res.status(201).json({ ok: true, message: payload })
})

export const getMessages = TryCatch(async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ ok: false, message: 'Invalid chat id' })
  const chat = await Chat.findById(id).select('_id members')
  if (!chat) return res.status(404).json({ ok: false, message: 'Chat not found' })
  if (!chat.members.map(String).includes(String(req.user))) return res.status(403).json({ ok: false, message: 'Not a member' })

  const items = await Message.find({ chat: id })
    .sort({ createdAt: 1 })
    .lean()
  return res.json({ ok: true, items })
})

export const getChatDetails = TryCatch(async (req, res) => {
  const { id } = req.params
  const chat = await Chat.findById(id)
  if (!chat) return res.status(404).json({ ok: false, message: 'Chat not found' })
  if (!chat.members.map(String).includes(String(req.user))) return res.status(403).json({ ok: false, message: 'Not a member' })
  return res.json({ ok: true, chat })
})
