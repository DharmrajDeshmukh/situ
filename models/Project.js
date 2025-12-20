const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  pic: { type: String },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  role: { type: String, default: 'Developer' }, // User's role in this project
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  contributors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);