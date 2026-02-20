const mongoose = require('mongoose');

const readReceiptSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastReadMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' },
  lastReadAt: { type: Date, default: Date.now }
});

// One receipt per user per room
readReceiptSchema.index({ roomId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ReadReceipt', readReceiptSchema);