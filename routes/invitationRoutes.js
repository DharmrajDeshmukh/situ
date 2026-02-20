const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const invitationController = require("../controllers/invitationController");

router.use(protect);

/*
|--------------------------------------------------------------------------
| GROUP COLLABORATION (HIRING → APPLY)
|--------------------------------------------------------------------------
| User applies to collaborate with a group
*/
router.post(
  "/groups/:groupId/apply",
  invitationController.applyToGroup
);

/*
|--------------------------------------------------------------------------
| ❌ OLD INVITATION ROUTES (COMMENTED)
|--------------------------------------------------------------------------
| These controllers are commented, so routes MUST be commented
*/

// router.post("/send", invitationController.sendInvitation);
// router.post("/accept", invitationController.acceptInvitation);
// router.post("/reject", invitationController.rejectInvitation);
// router.get("/", invitationController.getMyInvitations);
// router.get("/group/:groupId", invitationController.getGroupInvitations);
// router.post("/join", invitationController.joinGroup);

module.exports = router;
