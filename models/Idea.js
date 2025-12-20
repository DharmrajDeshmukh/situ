const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  pic: { type: String },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Idea', ideaSchema);