const mongoose = require('mongoose');

const engagementSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    target_type: {
      type: String,
      enum: ['POST', 'PROJECT', 'GROUP'],
      required: true
    },

    type: {
      type: String,
      enum: ['LIKE', 'VIEW', 'COMMENT', 'SHARE'],
      required: true
    },

    text: { type: String }
  },
  { timestamps: true }  // 🔥 THIS FIXES EVERYTHING
);

module.exports = mongoose.model('Engagement', engagementSchema);