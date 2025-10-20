import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['message', 'group'],
      required: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // For group invites/requests
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    message: {
      type: String,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

inviteSchema.index({ to: 1, status: 1, type: 1 });
inviteSchema.index({ from: 1, to: 1, type: 1, group: 1 }, { unique: false });

const Invite = mongoose.model('Invite', inviteSchema);
export default Invite;
