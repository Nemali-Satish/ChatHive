import { userSocketIDs } from '../app.js'

export const getOtherMember = (members, userId) =>
  members.find((member) => member._id?.toString() !== userId?.toString())

export const getSockets = (users = []) => {
  const sockets = users
    .map((user) => (typeof user === 'string' ? user : user?._id)?.toString())
    .map((id) => userSocketIDs.get(id))
    .filter(Boolean)
  return sockets
}

export const getBase64 = (file) => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
