const mongoose = require('mongoose');

const userEncryptionKeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceId: { type: String, required: true }, 
  publicKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserEncryptionKey', userEncryptionKeySchema);