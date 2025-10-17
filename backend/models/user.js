import mongoose, { Schema, model } from 'mongoose'
import { hash } from 'bcrypt'

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    bio: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z][a-z0-9_-]*$/, 'Invalid username format'],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
      marketing: {
        type: Boolean,
        default: true,
      },
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  // Normalize username and validate again
  if (this.isModified('username') && typeof this.username === 'string') {
    this.username = this.username.toLowerCase().trim()
    if (!/^[a-z][a-z0-9_-]*$/.test(this.username)) {
      return next(new Error('Invalid username format'))
    }
  }

  if (!this.isModified('password')) return next()
  this.password = await hash(this.password, 10)
  next()
})

// Normalize username on updates as well
userSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {}
  if (update.username && typeof update.username === 'string') {
    update.username = update.username.toLowerCase().trim()
    if (!/^[a-z][a-z0-9_-]*$/.test(update.username)) {
      return next(new Error('Invalid username format'))
    }
    this.setUpdate(update)
  }
  next()
})

export const User = mongoose.models.User || model('User', userSchema)
