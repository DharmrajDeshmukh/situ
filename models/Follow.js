const mongoose = require("mongoose")

const followSchema = new mongoose.Schema({

  follower_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  target_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  target_type: {
    type: String,
    enum: ["USER", "GROUP", "PROJECT"],
    required: true
  }

}, { timestamps: true })

module.exports = mongoose.model("Follow", followSchema)