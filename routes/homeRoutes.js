const express = require("express");
const router = express.Router();

const homeController = require("../controllers/homeController");
const { protect } = require("../middleware/authMiddleware");

/*
   GET /project1/api/v1/home/feed
*/
router.get(
  "/feed",
  protect,
  homeController.getHomeFeed
);

module.exports = router;
