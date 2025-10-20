import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { getIO } from '../socket/socket.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';

// @desc    Update user privacy (visibility)
// @route   PUT /api/users/privacy
// @access  Private
export const updatePrivacy = asyncHandler(async (req, res) => {
  const { visibility } = req.body || {};
  if (!['public', 'private'].includes(visibility)) {
    res.status(400);
    throw new Error('Invalid visibility');
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.visibility = visibility;
  const updated = await user.save();
  res.json({ success: true, data: { _id: updated._id, visibility: updated.visibility } });
});

// @desc    Search users
// @route   GET /api/users/search?query=
// @access  Private
export const searchUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.query
    ? {
        $or: [
          { name: { $regex: req.query.query, $options: 'i' } },
          { email: { $regex: req.query.query, $options: 'i' } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });

  res.json({
    success: true,
    data: users,
  });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } });

  res.json({
    success: true,
    data: users,
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, bio, avatarBase64, avatarUrl } = req.body || {};

    if (name) user.name = name;
    if (bio) user.bio = bio;

    // Handle avatar change
    if (avatarBase64 && typeof avatarBase64 === 'string') {
      // Remove old avatar from Cloudinary if present
      if (user.avatar?.public_id) {
        try { await deleteFromCloudinary(user.avatar.public_id); } catch {}
      }
      const buffer = Buffer.from(avatarBase64.split(',')[1] || '', 'base64');
      const result = await uploadToCloudinary(buffer, 'chatapp/avatars', { resource_type: 'image' });
      user.avatar = { public_id: result.public_id, url: result.url };
    } else if (avatarUrl && typeof avatarUrl === 'string') {
      // Set to provided URL (e.g., default avatar) and clear public_id
      user.avatar = { public_id: undefined, url: avatarUrl };
    }

    // Mark as completed when key fields exist
    user.profileCompleted = Boolean(user.name && user.bio && user.avatar?.url);

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        profileCompleted: updatedUser.profileCompleted,
      },
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user avatar
// @route   PUT /api/users/avatar
// @access  Private
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Validate mimetype strictly as image
  const mime = (req.file.mimetype || '').toLowerCase();
  if (!mime.startsWith('image/')) {
    res.status(400);
    throw new Error('Only image files are allowed for avatar');
  }

  // Delete old avatar from cloudinary if exists
  if (user.avatar.public_id) {
    try { await deleteFromCloudinary(user.avatar.public_id); } catch {}
  }

  // Upload new avatar (enforce resource_type image)
  let result;
  try {
    // With uploadMemory.single('avatar'), req.file has a buffer; pass the file object directly
    result = await uploadToCloudinary(req.file, 'chatapp/avatars', { resource_type: 'image' });
  } catch (e) {
    res.status(500);
    console.log(e)
    throw new Error(e.message || 'File upload failed');
  }

  user.avatar = {
    public_id: result.public_id,
    url: result.url,
  };

  await user.save();

  res.json({
    success: true,
    data: user.avatar,
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('friends', 'name email avatar bio')
    .populate('blockedUsers', 'name email avatar');

  if (user) {
    res.json({
      success: true,
      data: user,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Add friend
// @route   POST /api/users/friends/:userId
// @access  Private
export const addFriend = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user._id.toString()) {
    res.status(400);
    throw new Error('Cannot add yourself as friend');
  }

  const user = await User.findById(req.user._id);
  const friendUser = await User.findById(userId);

  if (!friendUser) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if already friends
  if (user.friends.includes(userId)) {
    res.status(400);
    throw new Error('Already friends');
  }

  // Remove from blocked if exists
  user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId);
  
  // Add to friends
  user.friends.push(userId);
  await user.save();

  res.json({
    success: true,
    message: 'Friend added successfully',
    data: user,
  });
});

// @desc    Remove friend
// @route   DELETE /api/users/friends/:userId
// @access  Private
export const removeFriend = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(req.user._id);

  user.friends = user.friends.filter(id => id.toString() !== userId);
  await user.save();

  res.json({
    message: 'Friend removed successfully',
    data: user,
  });
});

  // @desc    Block user
  // @route   POST /api/users/block/:userId
  // @access  Private
  export const blockUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

  if (userId === req.user._id.toString()) {
    res.status(400);
    throw new Error('Cannot block yourself');
  }

  // Do not remove friends on block; keep existing friendship through block/unblock so that unblocking preserves friend status.
  const user = await User.findById(req.user._id);
  const blockedUser = await User.findById(userId);

  if (!blockedUser) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if already blocked
  if (user.blockedUsers.includes(userId)) {
    res.status(400);
    throw new Error('User already blocked');
  }

  // Policy: Keep friendship status intact when blocking so that unblocking restores messaging seamlessly
  // Add to blocked
  user.blockedUsers.push(userId);
  await user.save();

  // Notify target user in real-time
  try {
    const io = getIO();
    io.to(userId).emit('user blocked', { by: req.user._id.toString() });
  } catch {}

  res.json({
    success: true,
    message: 'User blocked successfully',
    data: user,
  });
});

// @desc    Unblock user
// @route   DELETE /api/users/block/:userId
// @access  Private
export const unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(req.user._id);

  user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId);
  await user.save();

  // Notify previously blocked user that they are unblocked
  try {
    const io = getIO();
    io.to(userId).emit('user unblocked', { by: req.user._id.toString() });
  } catch {}

  res.json({
    success: true,
    message: 'User unblocked successfully',
    data: user,
  });
});
