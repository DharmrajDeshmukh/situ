const express = require('express');
const router = express.Router();
const controller = require('../controllers/engagementController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/view', controller.addView);
router.post('/like', controller.like);
router.post('/unlike', controller.unlike);
router.post('/comment', controller.comment);
router.post('/share', controller.share);
router.get('/comments', controller.getComments);

module.exports = router;