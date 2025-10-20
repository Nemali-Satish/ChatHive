import express from 'express';
import {
  getAllUsers,
  searchUsers,
  updateProfile,
  updateAvatar,
  getUserById,
  addFriend,
  removeFriend,
  blockUser,
  unblockUser,
  updatePrivacy,
} from '../controllers/userController.js';
import { protect, requireProfileCompleted } from '../middleware/auth.js';
import { upload, uploadMemory } from '../middleware/upload.js';

const router = express.Router();

router.get('/', protect, requireProfileCompleted, getAllUsers);
router.get('/search', protect, requireProfileCompleted, searchUsers);
router.put('/profile', protect, updateProfile);
router.put('/avatar', protect, uploadMemory.single('avatar'), updateAvatar);
router.put('/privacy', protect, requireProfileCompleted, updatePrivacy);
router.post('/friends/:userId', protect, requireProfileCompleted, addFriend);
router.delete('/friends/:userId', protect, requireProfileCompleted, removeFriend);
router.post('/block/:userId', protect, requireProfileCompleted, blockUser);
router.delete('/block/:userId', protect, requireProfileCompleted, unblockUser);
router.get('/:id', protect, requireProfileCompleted, getUserById);

export default router;
