import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // Full display name kept for compatibility; will be derived from first/last if possible
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z][a-z0-9_-]{2,29}$/, 'Username must start with a letter and contain only lowercase letters, digits, underscore or hyphen'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    avatar: {
      public_id: String,
      url: {
        type: String,
        default: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
      },
    },
    bio: {
      type: String,
      maxlength: 150,
      default: 'Hey there! I am using ChatHive',
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    // Still ensure name is set if first/last present
    if (!this.name && (this.firstName || this.lastName)) {
      this.name = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
    }
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Ensure name is populated pre-validate if missing
userSchema.pre('validate', function (next) {
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
