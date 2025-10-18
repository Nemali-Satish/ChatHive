import express from 'express';
import {
  sendMessage,
  getAllMessages,
  markAsRead,
  deleteMessage,
} from '../controllers/messageController.js';
import { protect, requireProfileCompleted } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/', protect, requireProfileCompleted, upload.array('attachments', 5), sendMessage);
router.get('/:chatId', protect, requireProfileCompleted, getAllMessages);
router.put('/read/:chatId', protect, requireProfileCompleted, markAsRead);
router.delete('/:messageId', protect, requireProfileCompleted, deleteMessage);

export default router;
