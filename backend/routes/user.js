import express from 'express'
import { isAuthenticated } from '../middlewares/auth.js'
import { body, query, oneOf } from 'express-validator'
import { validate } from '../middlewares/validate.js'
import {
  acceptFriendRequest,
  getMyFriends,
  getMyNotifications,
  getMyProfile,
  login,
  logout,
  newUser,
  searchUser,
  sendFriendRequest,
  updateProfile,
} from '../controllers/user.js'

const app = express.Router()

// Auth
app.post(
  '/new',
  validate([
    body('name').isString().trim().notEmpty().withMessage('name is required'),
    body('username').isString().trim().notEmpty().withMessage('username is required'),
    body('email').isEmail().normalizeEmail().withMessage('valid email is required'),
    body('password').isString().isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  ]),
  newUser
)
// Alias for clarity with frontend
app.post(
  '/register',
  validate([
    body('name').isString().trim().notEmpty(),
    body('username').isString().trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 6 }),
  ]),
  newUser
)
app.post(
  '/login',
  validate([
    oneOf([
      body('username').isString().trim().notEmpty(),
      body('email').isEmail().normalizeEmail(),
    ], 'username or email is required'),
    body('password').isString().notEmpty(),
  ]),
  login
)

// Protected
app.use(isAuthenticated)
app.get('/me', getMyProfile)
app.get('/logout', logout)
app.get('/search', validate([query('q').optional().isString()]), searchUser)
app.put('/sendrequest', validate([body('userId').isMongoId()]), sendFriendRequest)
app.put(
  '/profile',
  validate([
    body('name').optional().isString().trim().isLength({ min: 1 }).withMessage('name must be non-empty when provided'),
    body('username').optional().isString().trim().isLength({ min: 3 }).withMessage('username must be at least 3 characters'),
    body('bio').optional().isString().isLength({ min: 1 }).withMessage('bio must be non-empty when provided'),
    body('avatarUrl').optional().isURL().withMessage('avatarUrl must be a valid URL'),
  ]),
  updateProfile
)
app.put(
  '/acceptrequest',
  validate([body('requestId').isMongoId(), body('accept').optional().isBoolean()]),
  acceptFriendRequest
)
app.get('/notifications', getMyNotifications)
app.get('/friends', getMyFriends)

export default app
