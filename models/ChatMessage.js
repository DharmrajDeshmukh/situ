const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({

  // 🔑 SINGLE SOURCE OF TRUTH
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },

  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  cipherText: {
    type: String,
    required: true
  },

  messageType: {
    type: String,
    enum: ['TEXT', 'IMAGE', 'VIDEO', 'FILE', 'SYSTEM'],
    default: 'TEXT'
  },

  replyToMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage',
    default: null
  },

  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]

}, { timestamps: true }); // ⬅ replaces sentAt automatically

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
