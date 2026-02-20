const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { protect } = require('../middleware/authMiddleware');

// A) ROLE MANAGEMENT
router.post('/groups/:groupId/admins/:userId/promote', protect, permissionController.promoteToAdmin);
router.post('/groups/:groupId/admins/:userId/demote', protect, permissionController.demoteAdmin);

// B) GROUP PERMISSIONS
router.get('/groups/:groupId/permissions/me', protect, permissionController.getMyGroupPermissions);
router.put('/groups/:groupId/permissions/:userId', protect, permissionController.updateGroupPermissions);

// D) HIRING TOGGLE
router.post('/groups/:groupId/hiring/toggle', protect, permissionController.toggleGroupHiring);

module.exports = router;