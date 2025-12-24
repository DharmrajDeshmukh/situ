require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan'); // HTTP request logger
const helmet = require('helmet'); // Security headers
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const socialRoutes = require('./routes/socialRoutes');
const ideaRoutes = require('./routes/ideaRoutes');
const groupRoutes = require('./routes/groupRoutes');


const app = express();


// 1. Global Middleware
app.use(helmet()); // Secure HTTP headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Log requests
app.use(express.json()); // Parse JSON bodies
app.use('/project1/api/v1/auth', require('./routes/authRoutes'));
app.use('/project1/api/v1/profile', profileRoutes); // <--- Added
app.use('/project1/api/v1/social', socialRoutes);   // <--- Added
app.use('/project1/api/v1/idea', ideaRoutes);   // <--- Added
app.use('/project1/api/v1/group', groupRoutes); // <--- Added
app.use('/api/v1/groups', require('./routes/groupRoutes'));





// 2. Routes
app.use('/project1/api/v1/auth', authRoutes);

// 3. 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// 4. Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});
// app.js
const BASE_PATH = '/project1/api/v1'; // IMPORTANT: Matches Kotlin @POST("project1/...")

app.use(`${BASE_PATH}/auth`, require('./routes/authRoutes'));


//line 52-other routes ->update kiya hai
const BASE_URL = '/project1/api/v1';
// Profile Routes (Handles /project1/api/v1/profile/...)
app.use(`${BASE_URL}`/profile, require('./routes/profileRoutes'));

// --- FIX FOR SUGGESTIONS (Routing them to specific controller functions) ---
const profileController = require('./controllers/profileController');
const { protect } = require('./middleware/authMiddleware');

// Manually define these "root level" routes from the Kotlin spec
app.get(`${BASE_URL}`/skills/suggestions, protect, profileController.getSkillSuggestions);
app.get(`${BASE_URL}`/colleges/suggestions, protect, profileController.getCollegeSuggestions);
app.get(`${BASE_URL}`/interests/suggestions, protect, profileController.getInterestSuggestions);

// ... other routes (auth, groups, etc.)
// ... other routes



module.exports = app;

