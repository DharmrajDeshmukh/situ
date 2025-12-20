const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token_hash: { type: String, required: true },
  device_id: { type: String },
  is_revoked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 2592000 } // 30 days
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);