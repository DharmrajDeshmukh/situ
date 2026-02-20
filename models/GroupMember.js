// models/GroupMember.js
const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema({
  groupId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Group', 
    required: true,
    index: true
  },

  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },

  role: { 
    type: String,
    enum: ['owner', 'co_owner', 'admin', 'member'],
    default: 'member',
    lowercase: true   // 🔥 important for consistent matching
  },

  joinedAt: { 
    type: Date, 
    default: Date.now 
  },

  // 🔥 Group-level permissions
  permissions: {
    canCreateProject: { type: Boolean, default: false },
    canCreatePost: { type: Boolean, default: false },
    canDeletePost: { type: Boolean, default: false },
    canInviteMembers: { type: Boolean, default: false },
    canRemoveMembers: { type: Boolean, default: false },
    canHireMembers: { type: Boolean, default: false }
  },

  // 🔥 Project-specific permissions (Admin-level granularity)
  projectPermissions: [{
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Project' 
    },
    canManageProject: { type: Boolean, default: false },
    canPostInProject: { type: Boolean, default: false },
    canAddProjectMembers: { type: Boolean, default: false },
    canRemoveProjectMembers: { type: Boolean, default: false },
    canArchiveProject: { type: Boolean, default: false }
  }]

}, { timestamps: true }); // 🔥 adds createdAt & updatedAt


// 🔥 Ensure unique membership
groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

// 🔥 Optimize permission filtering (important for your use case)
groupMemberSchema.index({ userId: 1, role: 1 });

module.exports = mongoose.model('GroupMember', groupMemberSchema);
