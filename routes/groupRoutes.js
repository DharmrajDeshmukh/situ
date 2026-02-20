const express = require('express');
const router = express.Router();
const controller = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // ✅ Cloudinary upload middleware

// Protect all routes
router.use(protect);

// --------------------
// CREATE GROUP
// --------------------
router.post('/', controller.createGroup);
router.post('/from-idea', controller.createGroupFromIdea);

// --------------------
// RETRIEVAL
// --------------------
router.get('/details', controller.getMyGroupsZip);
router.get('/my-post-groups', controller.getMyPostGroups);  // ✅ ADD THIS

router.get('/:group_id', controller.getGroupDetailsZip);
router.get('/:group_id/overview', controller.getGroupOverview);
router.get('/:group_id/my-access', controller.getMyGroupAccess);

// --------------------
// UPDATES
// --------------------
router.put('/:group_id/name', controller.updateGroupName);
router.put('/:group_id/description', controller.updateGroupDescription);

router.put(
  '/:group_id/profile-image',
  upload.single('image'), // ✅ Upload to Cloudinary
  controller.updateGroupProfileImage
);

router.put(
  '/:group_id/banner',
  upload.single('image'), // ✅ Upload to Cloudinary
  controller.updateGroupBanner
);

// --------------------
// MEMBERS
// --------------------
router.get('/:group_id/members', controller.getGroupMembers);
router.put('/:group_id/members/:user_id/role', controller.updateMemberRole);
router.delete('/:group_id/members/:user_id', controller.removeMember);

// --------------------
// PERMISSIONS
// --------------------
router.get('/:group_id/members/:user_id/permissions', controller.getMemberPermissions);
router.put('/:group_id/members/:user_id/permissions', controller.updateMemberPermissions);

// --------------------
// PROJECTS
// --------------------
router.get('/:group_id/projects', controller.getGroupProjects);

// --------------------
// ADD MEMBERS
// --------------------
router.post('/:group_id/members', controller.addMembersToGroup);

module.exports = router;
