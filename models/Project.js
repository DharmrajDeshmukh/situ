const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    deadline: {
      type: Date,
      default: null
    },

    banner_url: {
      type: String,
      default: null
    },

    /* ================= VISIBILITY ================= */

    visibility: {
      type: String,
      enum: ["PUBLIC", "PRIVATE"],
      default: "PUBLIC",
      index: true
    },

    /* ================= OWNERSHIP ================= */

    creator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
      index: true
    },

    /* ================= STATUS ================= */

    is_deleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true // creates createdAt & updatedAt
  }
);


/* ================= INDEXES ================= */

// Fast fetch for user projects
projectSchema.index({ creator_id: 1, createdAt: -1 });

// Fast fetch for group projects
projectSchema.index({ group_id: 1, createdAt: -1 });

// Feed-level queries
projectSchema.index({ visibility: 1, is_deleted: 1, createdAt: -1 });


module.exports =
  mongoose.models.Project ||
  mongoose.model("Project", projectSchema);
