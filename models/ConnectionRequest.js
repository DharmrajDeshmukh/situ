// const mongoose = require('mongoose');

// const connectionRequestSchema = new mongoose.Schema({
//   sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
//   createdAt: { type: Date, default: Date.now }
// });

// // Compound index to prevent duplicate requests between same users
// connectionRequestSchema.index({ sender_id: 1, receiver_id: 1 }, { unique: true });

// module.exports = mongoose.model('ConnectionRequest', connectionRequestSchema);

const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User or Group ID
  target_type: { type: String, enum: ['USER', 'GROUP'], default: 'USER' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

// Index to prevent duplicate requests
connectionRequestSchema.index({ sender_id: 1, receiver_id: 1, target_type: 1 }, { unique: true });

module.exports = mongoose.model('ConnectionRequest', connectionRequestSchema);