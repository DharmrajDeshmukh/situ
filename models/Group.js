const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Images
  profile_image: { type: String, default: null },
  banner_image: { type: String, default: null },
  
  // Arrays
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  technology_stack: [{ type: String }], // Required for Project Details
  
  // Project Lifecycle
  project_status: { type: String, default: "ongoing" },
  current_stage: { type: String, default: "planning" },
  started_at: { type: Date, default: Date.now },
  expected_completion: { type: Date },
  
  // Stats & Timestamps
  followers_count: { type: Number, default: 0 },
  last_activity_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },

  // Add this line to your existing Group Schema
communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // [cite: 986]

// Add inside your Group Schema
// Add inside Group Schema
hiring: {
  isOpen: {
    type: Boolean,
    default: false
  },

  message: {
    type: String
  },

  requiredSkills: [{
    type: String
  }],

  preferredSkills: [{
    type: String
  }],

  hiringMode: {
    type: String,
    enum: ['ONLINE', 'OFFLINE', 'HYBRID'],
    default: 'ONLINE'
  },

  preferredCity: {
    type: String
  },

  createdAt: {
    type: Date
  },

  closedAt: {
    type: Date
  }
}



});



module.exports = mongoose.model('Group', groupSchema);