const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  // Auth
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  is_phone_verified: { type: Boolean, default: false },
  is_email_verified: { type: Boolean, default: false },

  // Profile
  name: { type: String, trim: true },
  username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  bio: { type: String, maxLength: 200, default: "" },
  college: { type: String, trim: true },
  profilePic: { type: String, default: "" },

  // Skills
  skills: [{ type: String }],
  interests: [{ type: String }],

  // Social Graph
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // mutual
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],   // one-way

  createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('User', userSchema);
