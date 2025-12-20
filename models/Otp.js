const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // Phone or Email
  type: { type: String, enum: ['phone', 'email'], required: true },
  hashed_otp: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 300 } // Auto-delete after 5 mins (300s)
});

module.exports = mongoose.model('Otp', otpSchema);