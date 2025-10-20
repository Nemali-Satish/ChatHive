import asyncHandler from 'express-async-handler';
import Invite from '../models/Invite.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import { getIO } from '../socket/socket.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

// Create/send an invite
// POST /api/invites
export const createInvite = asyncHandler(async (req, res) => {
  const { type, to, groupId, message } = req.body || {};
  if (!type || !to) {
    res.status(400);
    throw new Error('type and to are required');
  }
  if (!['message', 'group'].includes(type)) {
    res.status(400);
    throw new Error('Invalid invite type');
  }
  if (type === 'group' && !groupId) {
    res.status(400);
    throw new Error('groupId is required for group invites');
  }

  const target = await User.findById(to);
  if (!target) {
    res.status(404);
    throw new Error('Target user not found');
  }

  // Prevent duplicate pending invite of same kind
  const existing = await Invite.findOne({
    type,
    from: req.user._id,
    to,
    group: groupId || undefined,
    status: 'pending',
  });
  if (existing) {
    return res.status(200).json({ success: true, data: existing, message: 'Invite already pending' });
  }

  const invite = await Invite.create({
    type,
    from: req.user._id,
    to,
    group: groupId || undefined,
    message,
  });

  // Realtime: notify both parties their invites list changed
  try {
    const io = getIO();
    io.to(String(to)).emit(SOCKET_EVENTS.INVITES_UPDATED, { userId: to });
    io.to(String(req.user._id)).emit(SOCKET_EVENTS.INVITES_UPDATED, { userId: req.user._id });
  } catch {}

  res.status(201).json({ success: true, data: invite });
});

// List pending invites for current user
// GET /api/invites/pending
export const listPendingInvites = asyncHandler(async (req, res) => {
  const invites = await Invite.find({ to: req.user._id, status: 'pending' })
    .sort({ createdAt: -1 })
    .populate('from', 'name avatar email')
    .populate('group', 'chatName');
  res.json({ success: true, data: invites });
});

// List pending invites sent by current user
// GET /api/invites/sent
export const listPendingInvitesSent = asyncHandler(async (req, res) => {
  const invites = await Invite.find({ from: req.user._id, status: 'pending' })
    .sort({ createdAt: -1 })
    .populate('to', 'name avatar email')
    .populate('group', 'chatName');
  res.json({ success: true, data: invites });
});

// Accept invite
// PUT /api/invites/:id/accept
export const acceptInvite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const invite = await Invite.findById(id);
  if (!invite || invite.to.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Invite not found');
  }
  if (invite.status !== 'pending') {
    res.status(400);
    throw new Error('Invite is not pending');
  }

  invite.status = 'accepted';
  await invite.save();

  // For message invites, auto-add as friends (two-way or single-way?)
  if (invite.type === 'message') {
    await User.findByIdAndUpdate(invite.to, { $addToSet: { friends: invite.from } });
    await User.findByIdAndUpdate(invite.from, { $addToSet: { friends: invite.to } });
  }

  // For group invites, add user to group
  if (invite.type === 'group' && invite.group) {
    await Chat.findByIdAndUpdate(invite.group, { $addToSet: { users: invite.to } });
  }

  // Realtime: notify both parties
  try {
    const io = getIO();
    io.to(String(invite.to)).emit(SOCKET_EVENTS.INVITES_UPDATED, { userId: invite.to });
    io.to(String(invite.from)).emit(SOCKET_EVENTS.INVITES_UPDATED, { userId: invite.from });
  } catch {}

  res.json({ success: true, data: invite });
});

// Decline invite
// PUT /api/invites/:id/decline
export const declineInvite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const invite = await Invite.findById(id);
  if (!invite || invite.to.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Invite not found');
  }
  if (invite.status !== 'pending') {
    res.status(400);
    throw new Error('Invite is not pending');
  }
  invite.status = 'declined';
  await invite.save();
  try {
    const io = getIO();
    io.to(String(invite.to)).emit(SOCKET_EVENTS.INVITES_UPDATED, { userId: invite.to });
    io.to(String(invite.from)).emit(SOCKET_EVENTS.INVITES_UPDATED, { userId: invite.from });
  } catch {}
  res.json({ success: true, data: invite });
});

// Mark invite as read
// PUT /api/invites/:id/read
export const markInviteRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const invite = await Invite.findById(id);
  if (!invite || invite.to.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Invite not found');
  }
  invite.read = true;
  await invite.save();
  try {
    const io = getIO();
    io.to(String(invite.to)).emit(SOCKET_EVENTS.INVITES_UPDATED, { userId: invite.to });
  } catch {}
  res.json({ success: true, data: invite });
});
