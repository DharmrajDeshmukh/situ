const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },

  isPrivate: {
    type: Boolean,
    default: true
  },

  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model('Community', communitySchema);
