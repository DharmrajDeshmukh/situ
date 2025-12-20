const express = require('express');
const router = express.Router();
const controller = require('../controllers/ideaController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest, schemas } = require('../utils/validators');

router.use(protect);

router.get('/details', validateRequest(schemas.getIdeaDetails), controller.getIdeaDetails);

module.exports = router;