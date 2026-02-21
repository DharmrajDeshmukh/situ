const app = require("../app");
const connectDB = require("../config/db");

// Connect database
connectDB();

module.exports = app;