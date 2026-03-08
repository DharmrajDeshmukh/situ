const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
{
  /* ===============================
     REQUEST TYPE
  =============================== */

  type: {
    type: String,
    enum: [
      "USER_CONNECTION",
      "GROUP_INVITE",
      "GROUP_JOIN_REQUEST",
      "PROJECT_INVITE",
      "PROJECT_JOIN_REQUEST"
    ],
    required: true
  },

  /* ===============================
     USERS
  =============================== */

  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  /* ===============================
     TARGETS
  =============================== */

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

  /* ===============================
     ROLE (for invites)
  =============================== */

  role: {
    type: String,
    default: "member"
  },

  /* ===============================
     OPTIONAL MESSAGE
  =============================== */

  message: {
    type: String,
    default: ""
  },

  /* ===============================
     SKILLS (FOR COLLAB REQUESTS)
  =============================== */

  skills: {
    type: [String],
    default: []
  },

  /* ===============================
     REQUEST STATUS
  =============================== */

  status: {
    type: String,
    enum: [
      "PENDING",
      "APPROVED",
      "ACCEPTED",
      "REJECTED"
    ],
    default: "PENDING"
  }

},
{ timestamps: true }
);

/* =====================================================
   PREVENT DUPLICATE REQUESTS
===================================================== */

requestSchema.index(
  { senderId: 1, receiverId: 1, type: 1, groupId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "PENDING" }
  }
);

/* =====================================================
   FAST NOTIFICATION FETCH
===================================================== */

requestSchema.index({
  receiverId: 1,
  status: 1,
  createdAt: -1
});

/* =====================================================
   FAST GROUP REQUEST LOOKUP
===================================================== */

requestSchema.index({
  groupId: 1,
  type: 1,
  status: 1
});

module.exports = mongoose.model("Request", requestSchema);