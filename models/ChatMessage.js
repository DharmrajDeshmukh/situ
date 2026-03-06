const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({

  // 🔑 ROOM
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },

  // 👤 SENDER
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // 🔒 MESSAGE CONTENT
  cipherText: {
    type: String,
    required: true
  },

  // 📦 MESSAGE TYPE
  messageType: {
    type: String,
    enum: ['TEXT', 'IMAGE', 'VIDEO', 'FILE', 'SYSTEM'],
    default: 'TEXT'
  },

  // ↩️ REPLY MESSAGE
  replyToMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage',
    default: null
  },

  /* =========================
     DELIVERY STATUS
  ========================= */

  deliveredTo: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      deliveredAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  /* =========================
     READ STATUS
  ========================= */

  readBy: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);