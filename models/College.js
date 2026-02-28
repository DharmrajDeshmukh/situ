const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  city: String,
  state: String,
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model("College", collegeSchema);