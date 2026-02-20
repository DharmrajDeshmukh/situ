const express = require('express');
const router = express.Router();
const controller = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/send', controller.sendConnection);
router.post('/accept', controller.acceptConnection);
router.post('/reject', controller.rejectConnection);
router.get('/pending', controller.getPendingConnection);
router.get('/status', controller.getConnectionStatus);



module.exports = router;
