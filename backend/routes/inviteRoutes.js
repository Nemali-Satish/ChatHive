import express from 'express';
import { protect, requireProfileCompleted } from '../middleware/auth.js';
import { createInvite, listPendingInvites, listPendingInvitesSent, acceptInvite, declineInvite, markInviteRead } from '../controllers/inviteController.js';

const router = express.Router();

router.get('/pending', protect, requireProfileCompleted, listPendingInvites);
router.get('/sent', protect, requireProfileCompleted, listPendingInvitesSent);
router.post('/', protect, requireProfileCompleted, createInvite);
router.put('/:id/accept', protect, requireProfileCompleted, acceptInvite);
router.put('/:id/decline', protect, requireProfileCompleted, declineInvite);
router.put('/:id/read', protect, requireProfileCompleted, markInviteRead);

export default router;
