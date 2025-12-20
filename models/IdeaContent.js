const mongoose = require('mongoose');

const ideaContentSchema = new mongoose.Schema({
  idea_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true },
  content_type: { type: String, enum: ['video', 'short', 'image', 'file', 'post'], required: true },
  content_url: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IdeaContent', ideaContentSchema);