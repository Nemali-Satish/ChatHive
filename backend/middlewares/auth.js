import jwt from 'jsonwebtoken'
import { CHATTU_TOKEN, ADMIN_TOKEN } from '../constants/config.js'
import { ErrorHandler } from '../utils/utility.js'
import { User } from '../models/user.js'

export const isAuthenticated = (req, _res, next) => {
  const token = req.cookies?.[CHATTU_TOKEN]
  if (!token) return next(new ErrorHandler('Please login to access this route', 401))
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded._id
    return next()
  } catch (e) {
    return next(new ErrorHandler('Invalid or expired session', 401))
  }
}

export const adminOnly = (req, _res, next) => {
  const token = req.cookies?.[ADMIN_TOKEN]
  if (!token) return next(new ErrorHandler('Only Admin can access this route', 401))
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const ok = decoded?.key && decoded.key === (process.env.ADMIN_SECRET || '')
    if (!ok) return next(new ErrorHandler('Only Admin can access this route', 401))
    return next()
  } catch (e) {
    return next(new ErrorHandler('Only Admin can access this route', 401))
  }
}

export const socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err)
    const token = socket.request?.cookies?.[CHATTU_TOKEN]
    if (!token) return next(new ErrorHandler('Please login to access this route', 401))
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded._id)
    if (!user) return next(new ErrorHandler('Please login to access this route', 401))
    socket.user = { _id: user._id, name: user.name }
    return next()
  } catch (e) {
    return next(new ErrorHandler('Please login to access this route', 401))
  }
}
