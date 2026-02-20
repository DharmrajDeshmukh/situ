const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'USER_CONNECTION',
        'GROUP_INVITE',
        'PROJECT_COLLAB'
      ],
      required: true
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null
    },

    role: {
      type: String,
      default: null
    },

    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Request', requestSchema);
