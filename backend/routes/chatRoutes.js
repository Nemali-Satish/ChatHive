import express from 'express';
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  updateGroupAvatar,
  clearChat,
  deleteChat,
} from '../controllers/chatController.js';
import { protect, requireProfileCompleted } from '../middleware/auth.js';
import { uploadMemory } from '../middleware/upload.js';

const router = express.Router();

router.post('/', protect, requireProfileCompleted, accessChat);
router.get('/', protect, requireProfileCompleted, fetchChats);
router.post('/group', protect, requireProfileCompleted, createGroupChat);
router.put('/group/rename', protect, requireProfileCompleted, renameGroup);
router.put('/group/add', protect, requireProfileCompleted, addToGroup);
router.put('/group/remove', protect, requireProfileCompleted, removeFromGroup);
router.put('/group/avatar', protect, requireProfileCompleted, uploadMemory.single('avatar'), updateGroupAvatar);
router.delete('/:chatId/clear', protect, requireProfileCompleted, clearChat);
router.delete('/:chatId', protect, requireProfileCompleted, deleteChat);

export default router;
