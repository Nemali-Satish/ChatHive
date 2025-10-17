import mongoose from 'mongoose'

export const connectDB = async (uri) => {
  if (!uri) throw new Error('MONGO_URI is missing')
  if (mongoose.connection.readyState === 1) return
  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME || 'chathive',
  })
}
