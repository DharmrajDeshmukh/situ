
const mongoose = require("mongoose");

const projectMemberSchema = new mongoose.Schema(
{
  /* ======================================================
     RELATIONS
  ====================================================== */

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

  /* ======================================================
     ROLE (Simple for now)
     Default role will be MEMBER if not provided
  ====================================================== */

  role: {
    type: String,
    enum: ["OWNER", "ADMIN", "MEMBER"],
    default: "MEMBER"
  },

  /* ======================================================
     MEMBERSHIP STATUS
  ====================================================== */

  status: {
    type: String,
    enum: ["INVITED", "ACCEPTED", "REJECTED", "LEFT"],
    default: "INVITED",
    required: true,
    index: true
  },

  /* ======================================================
     PERMISSIONS CACHE (Optional / Future use)
  ====================================================== */

  can_post: {
    type: Boolean,
    default: true
  },

  can_edit_project: {
    type: Boolean,
    default: false
  },

  /* ======================================================
     SOFT DELETE
  ====================================================== */

  is_removed: {
    type: Boolean,
    default: false
  }

},
{
  timestamps: true
});


/* ======================================================
   UNIQUE MEMBERSHIP
   Prevents the same user joining the same project twice
====================================================== */

projectMemberSchema.index(
  { project_id: 1, user_id: 1 },
  { unique: true }
);


/* ======================================================
   FAST PERMISSION LOOKUPS
   Used for project access / admin queries
====================================================== */

projectMemberSchema.index({
  project_id: 1,
  status: 1,
  role: 1
});


module.exports = mongoose.model("ProjectMember", projectMemberSchema);
