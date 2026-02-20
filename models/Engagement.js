const mongoose = require('mongoose');

const engagementSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  target_id: { type: mongoose.Schema.Types.ObjectId, required: true }, // Post ID or Project ID
  target_type: { type: String, enum: ['POST', 'PROJECT'], required: true },
  type: { type: String, enum: ['LIKE', 'VIEW', 'COMMENT', 'SHARE'], required: true },
  
  // For comments
  text: { type: String },
  
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Engagement', engagementSchema);