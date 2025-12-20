const express = require('express');
const router = express.Router();
const controller = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest, schemas } = require('../utils/validators');
const multer = require('multer');

// Simple Multer Config (Memory Storage for Validation)
const upload = multer({ 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WEBP allowed'));
  }
});

// All routes here are protected
router.use(protect);

router.get('/me', controller.getMyProfile);
router.put('/edit', validateRequest(schemas.editProfile), controller.editProfile);
router.put('/update-name', validateRequest(schemas.updateName), controller.updateName);
router.put('/update-username', validateRequest(schemas.updateUsername), controller.updateUsername);
router.put('/update-bio', validateRequest(schemas.updateBio), controller.updateBio);
router.put('/update-college', validateRequest(schemas.updateCollege), controller.updateCollege);

// Skills & Interests
router.get('/skills/suggestions', controller.getSkillSuggestions); // Query param, no body validation needed
router.delete('/remove-skill', validateRequest(schemas.manageSkill), controller.removeSkill);
router.post('/add-interest', validateRequest(schemas.manageInterest), controller.addInterest);
router.delete('/remove-interest', validateRequest(schemas.manageInterest), controller.removeInterest);

// Profile Pic
router.post('/update-profile-picture', upload.single('file'), controller.updateProfilePic);

router.get('/user-projects', controller.getUserProjects);
module.exports = router;