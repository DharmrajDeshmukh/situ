const express = require('express');
const router = express.Router();

const groupCollabController = require('../controllers/groupCollabController');
const { protect } = require('../middleware/authMiddleware');
const groupHiringController = require("../controllers/groupHiringController");


router.use(protect);

/* ================= GROUP HIRING ================= */

router.put(
  '/:groupId/hiring',
  groupCollabController.createOrUpdateHiringRequirement
);

router.get(
  "/:groupId/hiring/status",
  protect,
  groupHiringController.getGroupHiringStatus
);

router.post(
  '/:groupId/hiring/close',
  groupCollabController.closeGroupHiring
);

/* ================= USER → GROUP ================= */

router.post(
  '/:groupId/collab/requests',
  groupCollabController.sendCollabRequest
);

router.get(
  '/:groupId/collab/my-request',
  groupCollabController.getMyCollabRequestStatus
);

/* ================= ADMIN ================= */

router.get(
  '/:groupId/collab/requests',
  groupCollabController.getPendingCollabRequests
);

router.post(
  '/:groupId/collab/requests/:requestId/approve',
  groupCollabController.approveCollabRequest
);

router.post(
  '/:groupId/collab/requests/:requestId/reject',
  groupCollabController.rejectCollabRequest
);

router.post(
  '/:groupId/collab/requests/reject-all',
  groupCollabController.rejectAllPendingCollabRequests
);

router.post(
  "/:groupId/hiring/close",
  groupCollabController.closeGroupHiring
);

module.exports = router;
