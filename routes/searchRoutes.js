const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// IMPORT FIX: Use destructuring to get 'protect' from authMiddleware
const { protect } = require('../middleware/authMiddleware'); 

// Debugging: This helps you see exactly what is missing in your terminal
if (!protect) console.error("❌ Error: 'protect' middleware is missing! Check imports.");
if (!searchController.search) console.error("❌ Error: 'searchController.search' is missing!");

// POST /api/v1/search
// USE FIX: Use 'protect' here, not 'auth'
router.post('/', protect, searchController.search);

module.exports = router;