const mongoose = require("mongoose");

const projectMemberSchema = new mongoose.Schema(
  {
    /* ================= RELATIONS ================= */

    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    /* ================= ROLE ================= */

    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "MEMBER"],
      default: "MEMBER",
      required: true
    },

    /* ================= STATUS ================= */

    status: {
      type: String,
      enum: ["INVITED", "ACCEPTED", "REJECTED", "LEFT"],
      default: "INVITED",
      required: true,
      index: true
    },

    /* ================= PERMISSIONS CACHE (OPTIONAL FUTURE) ================= */

    can_post: {
      type: Boolean,
      default: true
    },

    can_edit_project: {
      type: Boolean,
      default: false
    },

    /* ================= SOFT REMOVE ================= */

    is_removed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);


/* ================= UNIQUE CONSTRAINT ================= */

// Prevent duplicate membership
projectMemberSchema.index(
  { project_id: 1, user_id: 1 },
  { unique: true }
);


/* ================= FAST PERMISSION LOOKUPS ================= */

projectMemberSchema.index({
  project_id: 1,
  status: 1,
  role: 1
});


module.exports = mongoose.model("ProjectMember", projectMemberSchema);
