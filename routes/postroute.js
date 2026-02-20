const express = require("express");
const router = express.Router();

const {
  createPost,
  getFeedPosts,
  getProjectPosts,
  deletePost,
  updatePost
} = require("../controllers/postController");

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

/* =====================================================
   CREATE POST
   ===================================================== */

router.post(
  "/posts",
  protect,
  upload.array("media", 10),
  createPost
);

/* =====================================================
   GLOBAL FEED
   ===================================================== */

router.get(
  "/posts/feed",
  protect,
  getFeedPosts
);

/* =====================================================
   PROJECT POSTS
   ===================================================== */

router.get(
  "/projects/:projectId/posts",
  protect,
  getProjectPosts
);

/* =====================================================
   UPDATE POST
   ===================================================== */

router.put(
  "/posts/:postId",
  protect,
  updatePost
);

/* =====================================================
   DELETE POST
   ===================================================== */

router.delete(
  "/posts/:postId",
  protect,
  deletePost
);

module.exports = router;
