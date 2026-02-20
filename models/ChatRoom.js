const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['COMMUNITY', 'GROUP', 'PROJECT', 'DIRECT'], // ✅ Added PROJECT
    required: true
  },

  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null,
    index: true
  },

  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null,
    index: true
  },

  projectId: {                                  // ✅ Added
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },

  name: {
    type: String,
    trim: true
  },

  isDefault: {
    type: Boolean,
    default: false
  },

  isPrivate: {
    type: Boolean,
    default: true
  },

  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MEMBER'],
      default: 'MEMBER'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, { timestamps: true });

/* 🔥 CRITICAL INDEX FOR DIRECT CHAT */
chatRoomSchema.index(
  { type: 1, "members.userId": 1 },
  { unique: true, partialFilterExpression: { type: "DIRECT" } }
);

/* 🔥 PROJECT CHAT FAST QUERY */
chatRoomSchema.index({ projectId: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
