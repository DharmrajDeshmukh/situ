const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
{
  invitedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group"
  },

  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project"
  },

  type: {
    type: String,
    enum: ["GROUP_INVITE", "PROJECT_INVITE"],
    required: true
  },

  role: {
    type: String,
    default: "MEMBER"
  },

  message: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "REJECTED"],
    default: "PENDING"
  }
},
{ timestamps: true }
);

/* prevent duplicate pending invites */
invitationSchema.index(
  { invitedUserId: 1, groupId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "PENDING" } }
);

/* faster search */
invitationSchema.index({
  groupId: 1,
  invitedUserId: 1
});

module.exports = mongoose.model("Invitation", invitationSchema);