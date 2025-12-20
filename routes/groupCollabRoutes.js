const express = require('express');
const router = express.Router();
const controller = require('../controllers/groupCollabController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Hiring
router.post('/:groupId/hiring/requirements', controller.createOrUpdateHiringRequirement);
router.post('/:groupId/hiring/close', controller.closeGroupHiring);

// Collab
router.post('/collab/invite/send', controller.sendCollabInvite);
router.post('/collab/request/send', controller.sendCollabRequest);

// Status
router.post('/:groupId/collab/requests/pending', controller.getPendingCollabRequests);
router.post('/:groupId/collab/my-request', controller.getMyCollabRequestStatus);

module.exports = router;