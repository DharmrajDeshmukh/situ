const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema({

  type: {
    type: String,
    enum: ["COMMUNITY", "GROUP", "PROJECT", "DIRECT"],
    required: true
  },

  chatPairKey: {
    type: String,
    sparse: true
  },

  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
    default: null
  },

  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    default: null
  },

  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    default: null
  },

  name: {
    type: String,
    trim: true
  },

  isDefault: {
    type: Boolean,
    default: false
  },

  isPrivate: {
    type: Boolean,
    default: true
  },

  members: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },

      role: {
        type: String,
        enum: ["OWNER", "ADMIN", "MEMBER"],
        default: "MEMBER"
      },

      joinedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }

}, { timestamps: true });


/* INDEXES */

chatRoomSchema.index({ communityId: 1 });

chatRoomSchema.index({ groupId: 1 });

chatRoomSchema.index({ projectId: 1 });

chatRoomSchema.index({ "members.userId": 1 });

chatRoomSchema.index(
  { type: 1, chatPairKey: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "DIRECT" }
  }
);

module.exports = mongoose.model("ChatRoom", chatRoomSchema);