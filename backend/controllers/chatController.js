import asyncHandler from 'express-async-handler';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';

// @desc    Create or fetch one-to-one chat
// @route   POST /api/chats
// @access  Private
export const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400);
    throw new Error('UserId param not sent with request');
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate('users', '-password')
    .populate('latestMessage');

  isChat = await User.populate(isChat, {
    path: 'latestMessage.sender',
    select: 'name avatar email',
  });

  if (isChat.length > 0) {
    res.json({
      success: true,
      data: isChat[0],
    });
  } else {
    const chatData = {
      chatName: 'sender',
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findOne({ _id: createdChat._id }).populate('users', '-password');

    res.status(201).json({
      success: true,
      data: fullChat,
    });
  }
});

// @desc    Fetch all chats for a user
// @route   GET /api/chats
// @access  Private
export const fetchChats = asyncHandler(async (req, res) => {
  // Fetch chats where current user is a participant and has NOT soft-deleted the chat
  let chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
      deletedBy: { $ne: req.user._id },
    })
    .populate('users', '-password')
    .populate('groupAdmin', '-password')
    .sort({ updatedAt: -1 });

  // For each chat, compute latestMessage that is visible to current user (not soft-deleted for them)
  const visibleChats = [];
  for (const chat of chats) {
    const latest = await Message.findOne({ chat: chat._id, deletedBy: { $ne: req.user._id } })
      .sort({ createdAt: -1 })
      .populate('sender', 'name avatar email');
    const c = chat.toObject();
    c.latestMessage = latest || null;
    visibleChats.push(c);
  }

  // Sort by latest visible message time (desc), fallback to chat.updatedAt
  visibleChats.sort((a, b) => {
    const aTime = a.latestMessage?.createdAt ? new Date(a.latestMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
    const bTime = b.latestMessage?.createdAt ? new Date(b.latestMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });

  res.json({
    success: true,
    data: visibleChats,
  });
});

// @desc    Create group chat
// @route   POST /api/chats/group
// @access  Private
export const createGroupChat = asyncHandler(async (req, res) => {
  const { users, name } = req.body;

  if (!users || !name) {
    res.status(400);
    throw new Error('Please fill all the fields');
  }

  const usersArray = JSON.parse(users);

  if (usersArray.length < 2) {
    res.status(400);
    throw new Error('More than 2 users are required to form a group chat');
  }

  usersArray.push(req.user._id);

  const groupChat = await Chat.create({
    chatName: name,
    users: usersArray,
    isGroupChat: true,
    groupAdmin: req.user._id,
  });

  const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  res.status(201).json({
    success: true,
    data: fullGroupChat,
  });
});

// @desc    Rename group
// @route   PUT /api/chats/group/rename
// @access  Private
export const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (!updatedChat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  res.json({
    success: true,
    data: updatedChat,
  });
});

// @desc    Add user to group
// @route   PUT /api/chats/group/add
// @access  Private
export const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  // Check if user is admin
  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only admin can add users');
  }

  const added = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { users: userId } },
    { new: true }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  res.json({
    success: true,
    data: added,
  });
});

// @desc    Remove user from group
// @route   PUT /api/chats/group/remove
// @access  Private
export const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  // Check if user is admin
  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only admin can remove users');
  }

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  res.json({
    success: true,
    data: removed,
  });
});

// @desc    Update group avatar
// @route   PUT /api/chats/group/avatar
// @access  Private
export const updateGroupAvatar = asyncHandler(async (req, res) => {
  const { chatId } = req.body;

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  // Check if user is admin
  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only admin can update group avatar');
  }

  // Delete old avatar if exists
  if (chat.groupAvatar && chat.groupAvatar.public_id) {
    await deleteFromCloudinary(chat.groupAvatar.public_id);
  }

  // Upload new avatar (memory storage -> pass file object with buffer)
  const result = await uploadToCloudinary(req.file, 'chatapp/groups');

  chat.groupAvatar = {
    public_id: result.public_id,
    url: result.url,
  };

  await chat.save();

  res.json({
    success: true,
    data: chat.groupAvatar,
  });
});

// @desc    Clear all messages in a chat
// @route   DELETE /api/chats/:chatId/clear
// @access  Private
export const clearChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  // Ensure current user is a participant
  if (!chat.users.map(id => id.toString()).includes(req.user._id.toString())) {
    res.status(403);
    throw new Error('Not authorized to clear this chat');
  }

  // Mark all messages in this chat as deleted for current user
  await Message.updateMany(
    { chat: chatId, deletedBy: { $ne: req.user._id } },
    { $addToSet: { deletedBy: req.user._id } }
  );

  res.json({ success: true, message: 'Chat cleared successfully' });
});

// @desc    Delete a chat and its messages
// @route   DELETE /api/chats/:chatId
// @access  Private
export const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  // Ensure current user is a participant
  if (!chat.users.map(id => id.toString()).includes(req.user._id.toString())) {
    res.status(403);
    throw new Error('Not authorized to delete this chat');
  }

  // Soft-delete chat for current user and mark all its messages as deleted for them
  await Chat.findByIdAndUpdate(chatId, { $addToSet: { deletedBy: req.user._id } });
  await Message.updateMany(
    { chat: chatId, deletedBy: { $ne: req.user._id } },
    { $addToSet: { deletedBy: req.user._id } }
  );

  // If it's a direct (1:1) chat, remove the other participant from friends and blocked lists for the current user
  if (!chat.isGroupChat) {
    const otherUserId = chat.users
      .map((u) => (u._id ? u._id.toString() : u.toString()))
      .find((uid) => uid !== req.user._id.toString());
    if (otherUserId) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { friends: otherUserId, blockedUsers: otherUserId },
      });
    }
  }

  res.json({ success: true, message: 'Chat deleted for current user' });
});
