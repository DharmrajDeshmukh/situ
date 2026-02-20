const mongoose = require('mongoose');

const groupCollabRequestSchema = new mongoose.Schema({
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true
  },
  requester_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  skill_id: {
    type: String,
    default: null   // 🔥 IMPORTANT
  },

  message: String,

  status: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "REJECTED"],
    default: "PENDING"
  },

  created_at: {
    type: Date,
    default: Date.now
  }
});


module.exports = mongoose.model('GroupCollabRequest', groupCollabRequestSchema);