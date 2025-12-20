const app = require('./app');
const connectDB = require('./config/db.js'); // Import the file

// 1. Connect to Database
connectDB();

// 2. Start Server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections (e.g. if DB drops later)
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});