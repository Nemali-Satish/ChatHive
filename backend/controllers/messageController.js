import asyncHandler from 'express-async-handler';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';

// @desc    Send message
// @route   POST /api/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!chatId) {
    res.status(400);
    throw new Error('Chat ID is required');
  }

  if (!content && !req.files && !req.file) {
    res.status(400);
    throw new Error('Message content or attachments are required');
  }

  // Check if sender is blocked by any recipient
  const chat = await Chat.findById(chatId).populate('users', 'blockedUsers visibility friends');
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  // Check if current user is blocked by any chat participant
  for (const chatUser of chat.users) {
    if (chatUser._id.toString() !== req.user._id.toString()) {
      if (chatUser.blockedUsers && chatUser.blockedUsers.some(id => id.toString() === req.user._id.toString())) {
        res.status(403);
        throw new Error('You are blocked by this user');
      }
    }
  }

  // Check if current user has blocked any participant
  const currentUser = await User.findById(req.user._id);
  for (const chatUser of chat.users) {
    if (chatUser._id.toString() !== req.user._id.toString()) {
      if (currentUser.blockedUsers && currentUser.blockedUsers.some(id => id.toString() === chatUser._id.toString())) {
        res.status(403);
        throw new Error('You have blocked this user');
      }
    }
  }

  // Enforce privacy for 1:1 chats: prevent sending to private user unless friends
  if (!chat.isGroupChat) {
    const otherUser = chat.users.find((u) => (u._id || u).toString() !== req.user._id.toString());
    if (otherUser && otherUser.visibility === 'private') {
      // Load friend's list if not present (in case populate missed)
      const otherUserFriends = Array.isArray(otherUser.friends) ? otherUser.friends : [];
      const isFriend = otherUserFriends.some((id) => id.toString() === req.user._id.toString());
      if (!isFriend) {
        res.status(403);
        return res.json({ success: false, code: 'PRIVATE_USER', requiresInvite: true, message: 'User is private. Send invite first.' });
      }
    }
  }

  const newMessage = {
    sender: req.user._id,
    content: content || '',
    chat: chatId,
  };

  // Handle file attachments - support both req.files (array) and req.file (single)
  const incomingFiles = Array.isArray(req.files)
    ? req.files
    : req.file
    ? [req.file]
    : [];

  if (incomingFiles.length > 0) {
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    const attachments = [];

    for (const file of incomingFiles) {
      try {
        // Skip oversized files
        if (file.size && file.size > MAX_SIZE) continue;

        const mime = (file.mimetype || '').toLowerCase();
        let resourceType = 'raw';
        if (mime.startsWith('image/')) resourceType = 'image';
        else if (mime.startsWith('video/')) resourceType = 'video';
        else if (mime.startsWith('audio/')) resourceType = 'video';

        const result = await uploadToCloudinary(file.path || file, 'chatapp/messages', { resource_type: resourceType });

        let fileType = 'document';
        if (file.mimetype?.startsWith('image/')) fileType = 'image';
        else if (file.mimetype?.startsWith('video/')) fileType = 'video';
        else if (file.mimetype?.startsWith('audio/')) fileType = 'audio';

        attachments.push({
          public_id: result.public_id,
          url: result.url,
          type: fileType,
        });

        if (!newMessage.messageType || newMessage.messageType === 'text') {
          newMessage.messageType = fileType;
        }
      } catch (e) {
        // Skip file on any upload error, continue with others
        continue;
      }
    }

    if (attachments.length > 0) {
      newMessage.attachments = attachments;
    } else if (!content) {
      res.status(400);
      throw new Error('No valid attachments under 20MB');
    }
  }

  let message = await Message.create(newMessage);

  message = await message.populate('sender', 'name avatar');
  message = await message.populate('chat');
  message = await User.populate(message, {
    path: 'chat.users',
    select: 'name avatar email',
  });

  // Update latest message in chat
  // Also ensure the chat reappears for participants who previously deleted it
  const participantIds = chat.users.map((u) => u._id || u);
  await Chat.findByIdAndUpdate(
    chatId,
    {
      latestMessage: message,
      $pull: { deletedBy: { $in: participantIds } },
    }
  );

  res.status(201).json({
    success: true,
    data: message,
  });
});

// @desc    Get all messages for a chat
// @route   GET /api/messages/:chatId
// @access  Private
export const getAllMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({
      chat: req.params.chatId,
      deletedBy: { $ne: req.user._id },
    })
    .populate('sender', 'name avatar email')
    .populate('chat');

  res.json({
    success: true,
    data: messages,
  });
});

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:chatId
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  await Message.updateMany(
    {
      chat: chatId,
      sender: { $ne: req.user._id },
      readBy: { $ne: req.user._id },
    },
    {
      $push: { readBy: req.user._id },
    }
  );

  res.json({
    success: true,
    message: 'Messages marked as read',
  });
});

// @desc    Delete message
// @route   DELETE /api/messages/:messageId
// @access  Private
export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  // Check if user is the sender
  if (message.sender.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this message');
  }

  await message.deleteOne();

  res.json({
    success: true,
    message: 'Message deleted successfully',
  });
});
