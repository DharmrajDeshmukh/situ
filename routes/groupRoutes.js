const express = require('express');
const router = express.Router();
const controller = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.use(protect); // Require Login

// 1. Create
router.post('/', controller.createGroup);
router.post('/from-idea', controller.createGroupFromIdea);

// 2. Retrieval (Order matters! Specific paths before parameters)
router.get('/details', controller.getMyGroupsZip); // Matches /api/v1/groups/details
router.get('/:group_id', controller.getGroupDetailsZip);
router.get('/:group_id/overview', controller.getGroupOverview);
router.get('/:group_id/my-access', controller.getMyGroupAccess);

// 3. Updates
router.put('/:group_id/name', controller.updateGroupName);
router.put('/:group_id/description', controller.updateGroupDescription);
router.put('/:group_id/profile-image', upload.single('file'), controller.updateGroupProfileImage);
router.put('/:group_id/banner', upload.single('file'), controller.updateGroupBanner);

// ... (Keep existing routes) ...

// MEMBERS & ROLES
router.get('/:group_id/members', controller.getGroupMembers);
router.put('/:group_id/members/:user_id/role', controller.updateMemberRole);
router.delete('/:group_id/members/:user_id', controller.removeMember);

// PERMISSIONS
router.get('/:group_id/members/:user_id/permissions', controller.getMemberPermissions);
router.put('/:group_id/members/:user_id/permissions', controller.updateMemberPermissions);

// PROJECTS
router.get('/:group_id/projects', controller.getGroupProjects);
// Note: You also have project-permissions endpoints[cite: 362], add them if needed similarly.



module.exports = router;