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
  toggleMuteGroup,
  leaveGroup,
  addAdmin,
  removeAdmin,
  updateGroupInfo,
  deleteGroupForAll,
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
router.put('/group/mute', protect, requireProfileCompleted, toggleMuteGroup);
router.put('/group/leave', protect, requireProfileCompleted, leaveGroup);
router.put('/group/admin/add', protect, requireProfileCompleted, addAdmin);
router.put('/group/admin/remove', protect, requireProfileCompleted, removeAdmin);
router.put('/group/info', protect, requireProfileCompleted, updateGroupInfo);
router.delete('/:chatId/clear', protect, requireProfileCompleted, clearChat);
router.delete('/:chatId', protect, requireProfileCompleted, deleteChat);
router.delete('/group/:chatId/all', protect, requireProfileCompleted, deleteGroupForAll);

export default router;

