const express = require('express');
const router = express.Router();
const controller = require('../controllers/followController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

/* ======================================================
   FOLLOW TARGET (GROUP / USER / PROJECT)
====================================================== */

router.post('/follow', controller.followTarget);

/* ======================================================
   UNFOLLOW TARGET
====================================================== */

router.delete('/unfollow/:targetId', controller.unfollowTarget);

/* ======================================================
   CHECK FOLLOW STATUS
====================================================== */

router.get('/status', controller.getFollowStatus);

/* ======================================================
   GET GROUPS I FOLLOW
====================================================== */

router.get('/groups', controller.getMyFollowingGroups);

/* ======================================================
   GET USERS I FOLLOW
====================================================== */

router.get('/users', controller.getMyFollowingUsers);

module.exports = router;