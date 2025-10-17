import jwt from 'jsonwebtoken'
import { CHATTU_TOKEN, ADMIN_TOKEN } from '../constants/config.js'

const isProd = (process.env.NODE_ENV || 'development') === 'production'

export const signToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn })
}

export const sendToken = (res, user) => {
  const token = signToken({ _id: user._id })
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  res.cookie(CHATTU_TOKEN, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    expires,
  })

  return token
}

export const clearToken = (res) => {
  res.clearCookie(CHATTU_TOKEN, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
  })
}

export const signAdminToken = (key, expiresIn = '1d') => {
  return jwt.sign({ key }, process.env.JWT_SECRET, { expiresIn })
}

export const sendAdminToken = (res) => {
  const token = signAdminToken(process.env.ADMIN_SECRET || '')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  res.cookie(ADMIN_TOKEN, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    expires,
  })
  return token
}

export const clearAdminToken = (res) => {
  res.clearCookie(ADMIN_TOKEN, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
  })
}
