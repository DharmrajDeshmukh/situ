const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const requestController = require("../controllers/requestController");

/*
|--------------------------------------------------------------------------
| USER → GET ALL REQUESTS (Notifications screen)
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  protect,
  requestController.getMyRequests
);

/*
|--------------------------------------------------------------------------
| USER → SEND REQUEST
| (used for join request, connection request, etc.)
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  protect,
  requestController.sendRequest
);

/*
|--------------------------------------------------------------------------
| OWNER → VIEW GROUP COLLAB REQUESTS
|--------------------------------------------------------------------------
*/

router.get(
  "/groups/:groupId",
  protect,
  requestController.getGroupRequests
);

/*
|--------------------------------------------------------------------------
| OWNER → INVITE USER TO GROUP
|--------------------------------------------------------------------------
*/

router.post(
  "/groups/:groupId/invite",
  protect,
  requestController.inviteUserToGroup
);

/*
|--------------------------------------------------------------------------
| OWNER → BULK INVITE USERS
|--------------------------------------------------------------------------
*/

router.post(
  "/groups/:groupId/invite/bulk",
  protect,
  requestController.bulkInviteUsersToGroup
);

/*
|--------------------------------------------------------------------------
| ACCEPT REQUEST / INVITATION
|--------------------------------------------------------------------------
*/

router.post(
  "/:requestId/accept",
  protect,
  requestController.acceptRequest
);

/*
|--------------------------------------------------------------------------
| REJECT REQUEST
|--------------------------------------------------------------------------
*/

router.post(
  "/:requestId/reject",
  protect,
  requestController.rejectRequest
);

/*
|--------------------------------------------------------------------------
| USER → JOIN GROUP AFTER OWNER APPROVAL
|--------------------------------------------------------------------------
*/

router.post(
  "/:requestId/join",
  protect,
  requestController.joinGroup
);

module.exports = router;