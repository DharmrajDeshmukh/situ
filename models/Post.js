const mongoose = require("mongoose");

// ================= MEDIA SUB SCHEMA =================
const postMediaSchema = new mongoose.Schema(
  {
    media_url: {
      type: String,
      required: true,
      trim: true
    },
    media_type: {
      type: String,
      enum: ["IMAGE", "PDF"],
      required: true
    },
    size_in_bytes: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);


// ================= MAIN POST SCHEMA =================
const postSchema = new mongoose.Schema(
  {
    // ================= OWNER =================
    user_id: {
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

    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true
    },

    // ================= VISIBILITY =================
    visibility: {
      type: String,
      enum: ["PUBLIC", "GROUP", "PROJECT"],
      required: true,
      index: true
    },

    // ================= CONTENT =================
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },

    media: {
      type: [postMediaSchema],
      default: [],
      validate: {
        validator: function (val) {
          return val.length <= 10;
        },
        message: "Maximum 10 media files allowed"
      }
    },

    // ================= COUNTERS =================
    like_count: { type: Number, default: 0 },
    comment_count: { type: Number, default: 0 },
    view_count: { type: Number, default: 0 },
    share_count: { type: Number, default: 0 },

    // ================= STATUS =================
    is_deleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);


// ================= INDEXES =================
postSchema.index({ project_id: 1, createdAt: -1 });
postSchema.index({ group_id: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });


// ================= FIXED PRE-SAVE HOOK =================
// 🔥 Use async style (NO next())
postSchema.pre("save", async function () {

  if (this.project_id) {
    this.visibility = "PROJECT";
  }

  if (!this.text || this.text.trim().length === 0) {
    throw new Error("Text is required");
  }

});


module.exports = mongoose.model("Post", postSchema);
