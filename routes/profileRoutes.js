// const express = require('express');
// const router = express.Router();
// const controller = require('../controllers/profileController');
// const { protect } = require('../middleware/authMiddleware');
// const { validateRequest, schemas } = require('../utils/validators');
// const multer = require('multer');

// // Simple Multer Config (Memory Storage for Validation)
// const upload = multer({ 
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//   fileFilter: (req, file, cb) => {
//     if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
//     else cb(new Error('Only JPG, PNG, WEBP allowed'));
//   }
// });

// // All routes here are protected
// router.use(protect);

// router.get('/me', controller.getMyProfile);
// router.put('/edit', validateRequest(schemas.editProfile), controller.editProfile);
// router.put('/update-name', validateRequest(schemas.updateName), controller.updateName);
// router.put('/update-username', validateRequest(schemas.updateUsername), controller.updateUsername);
// router.put('/update-bio', validateRequest(schemas.updateBio), controller.updateBio);
// router.put('/update-college', validateRequest(schemas.updateCollege), controller.updateCollege);

// // Skills & Interests
// router.get('/skills/suggestions', controller.getSkillSuggestions); // Query param, no body validation needed
// router.delete('/remove-skill', validateRequest(schemas.manageSkill), controller.removeSkill);
// router.post('/add-interest', validateRequest(schemas.manageInterest), controller.addInterest);
// router.delete('/remove-interest', validateRequest(schemas.manageInterest), controller.removeInterest);

// // Profile Pic
// router.post('/update-profile-picture', upload.single('file'), controller.updateProfilePic);

// router.get('/user-projects', controller.getUserProjects);
// module.exports = router;


const express = require('express');
const router = express.Router();
const controller = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.use(protect); // All routes require login

// 1. Edit Full Profile
router.put('/edit', controller.editProfile);

// 2. Get My Profile
router.get('/me', controller.getMyProfile);

// 3. Single Field Updates
router.put('/update-name', controller.updateName);
router.put('/update-username', controller.updateUsername);
router.put('/update-bio', controller.updateBio);
router.put('/update-college', controller.updateCollege);

// 4. Skills
router.post('/add-skill', controller.addSkill);
router.delete('/remove-skill', controller.removeSkill);

// 5. Interests
router.post('/add-interest', controller.addInterest);
router.delete('/remove-interest', controller.removeInterest);

// 6. Suggestions (Public data, but authenticated)
// Note: We mount these under /api/v1 in app.js, so we might need custom handling or routes here.
// Kotlin expects: /project1/api/v1/colleges/suggestions
// If this file is mounted at /project1/api/v1/profile, then we need to adjust app.js or routes.
// EASIEST FIX: Keep them here and update app.js to route multiple paths to this file OR just handle them.
// Let's assume standard REST: /profile/skills/suggestions is better, but we stick to Kotlin spec.
// See Step 3 for how we handle the URL path mismatch.

// 7. Profile Picture
router.post('/update-profile-picture', upload.single('file'), controller.updateProfilePicture);

// 8. Views
router.get('/user-projects', controller.getUserProjects);
router.get('/view/:userId', controller.getUserProfileView);
router.get('/open/:userId', controller.openUserProfile);

module.exports = router;