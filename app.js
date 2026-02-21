require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

const connectDB = require("./config/db");
connectDB();

app.get("/check", (req, res) => {
  res.json({ status: "API WORKING PERFECTLY" });
});

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        imgSrc: [
          "'self'",
          "data:",
          "https://res.cloudinary.com",
          "https:"
        ],
      },
    },
  })
);



app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const BASE_URL = '/project1/api/v1';

// ---------------- ROUTES ----------------

// Auth
app.use(`${BASE_URL}/auth`, require('./routes/authRoutes'));

// Profile
app.use(`${BASE_URL}/profile`, require('./routes/profileRoutes'));

// Groups & Collab
app.use(`${BASE_URL}/groups`, require('./routes/groupRoutes'));
app.use(`${BASE_URL}/groups`, require('./routes/groupCollabRoutes'));

// Connections
app.use(`${BASE_URL}/connections`, require('./routes/connectionRoutes'));

// Ideas
app.use(`${BASE_URL}/idea`, require('./routes/ideaRoutes'));

// Search
app.use(`${BASE_URL}/search`, require('./routes/searchRoutes'));

// Chat
app.use(BASE_URL, require('./routes/chatRoutes'));

// Invitations
app.use(`${BASE_URL}/invitations`, require('./routes/invitationRoutes'));

// Requests
app.use(`${BASE_URL}/requests`, require('./routes/requestRoutes'));

// Collab hiring
app.use(`${BASE_URL}/collab`, require('./routes/collabRoutes'));

// Permissions
app.use(BASE_URL, require('./routes/permissionRoutes'));

// Skills
const skillRoutes = require('./routes/skillroutes');
app.use(`${BASE_URL}`, skillRoutes);

// 🔥 ADD THESE BEFORE 404

// Posts
app.use(`${BASE_URL}`, require("./routes/postroute"));

// Projects
const projectRoutes = require("./routes/projectRoutes");
app.use(`${BASE_URL}/projects`, projectRoutes);



// Home Feed
const homeRoutes = require("./routes/homeRoutes");
app.use(`${BASE_URL}/home`, homeRoutes);

// Engagement
app.use(`${BASE_URL}/engagement`, require('./routes/engagementRoutes'));


// ---------------- 404 (ALWAYS LAST) ----------------
app.use((req, res) =>
  res.status(404).json({ success: false, message: 'Endpoint not found' })
);


module.exports = app;
