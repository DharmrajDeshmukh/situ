const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target_type: {
    type: String,
    enum: ['USER', 'GROUP'],
    default: 'USER'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate requests (both directions)
connectionRequestSchema.index(
  { sender_id: 1, receiver_id: 1, target_type: 1 },
  { unique: true }
);

module.exports = mongoose.model('ConnectionRequest', connectionRequestSchema);
