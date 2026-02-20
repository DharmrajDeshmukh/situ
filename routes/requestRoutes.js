const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const requestController = require('../controllers/requestController');

// 🔔 Notifications / Requests list
router.get(
  '/',
  protect,
  requestController.getMyRequests
);

// 📤 Send request
router.post(
  '/',
  protect,
  requestController.sendRequest
);

// ✅ Accept request
router.post(
  '/:requestId/accept',
  protect,
  requestController.acceptRequest
);

// ❌ Reject request
router.post(
  '/:requestId/reject',
  protect,
  requestController.rejectRequest
);

module.exports = router;
