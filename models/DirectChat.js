// const mongoose = require('mongoose');

// const directChatSchema = new mongoose.Schema({
//   userOneId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   userTwoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   createdAt: { type: Date, default: Date.now }
// });

// // Ensure unique conversation between two users
// directChatSchema.index({ userOneId: 1, userTwoId: 1 }, { unique: true });

// module.exports = mongoose.model('DirectChat', directChatSchema);