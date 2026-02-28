const mongoose = require("mongoose");

const interestSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  usageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model("Interest", interestSchema);