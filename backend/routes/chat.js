import express from 'express'
import { isAuthenticated } from '../middlewares/auth.js'
import { upload } from '../middlewares/multer.js'
import { body, param } from 'express-validator'
import { validate } from '../middlewares/validate.js'
import {
  addMembers,
  deleteChat,
  getChatDetails,
  getMessages,
  getMyChats,
  getMyGroups,
  leaveGroup,
  newGroupChat,
  removeMember,
  renameGroup,
  sendAttachments,
} from '../controllers/chat.js'

const app = express.Router()

// Protected routes
app.use(isAuthenticated)

app.post(
  '/new',
  validate([
    body('name').isString().trim().notEmpty(),
    body('members').optional().isArray(),
  ]),
  newGroupChat
)
app.get('/my', getMyChats)
app.get('/my/groups', getMyGroups)
app.put('/addmembers', validate([body('chatId').isMongoId(), body('members').isArray()]), addMembers)
app.put('/removemember', validate([body('chatId').isMongoId(), body('memberId').isMongoId()]), removeMember)
app.delete('/leave/:id', validate([param('id').isMongoId()]), leaveGroup)

// Messages
app.post('/message', upload.array('files'), validate([body('chatId').isMongoId()]), sendAttachments)
app.get('/message/:id', validate([param('id').isMongoId()]), getMessages)

// Chat details
app
  .route('/:id')
  .get(validate([param('id').isMongoId()]), getChatDetails)
  .put(validate([param('id').isMongoId(), body('name').isString().trim().notEmpty()]), renameGroup)
  .delete(validate([param('id').isMongoId()]), deleteChat)

export default app
