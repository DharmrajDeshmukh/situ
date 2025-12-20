const express = require('express');
const router = express.Router();
const controller = require('../controllers/connectionController'); // Make sure you updated the controller!
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/send', controller.sendConnectionRequest);
router.post('/accept', controller.acceptConnection);
router.post('/reject', controller.rejectConnection);

module.exports = router;