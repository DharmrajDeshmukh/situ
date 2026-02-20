const express = require('express');
const router = express.Router();
const collabController = require('../controllers/collabController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/v1/collab/hiring
router.get('/hiring', protect, collabController.getHiringGroups);

module.exports = router;    