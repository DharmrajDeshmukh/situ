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

    type: {
      type: String,
      enum: ["GROUP", "PROJECT"],
      required: true
    },

    role: {
      type: String,
      default: "MEMBER"
    },

    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invitation", invitationSchema);
