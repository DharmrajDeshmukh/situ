const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createProject,
  getMyPostProjects,
  getProjectDetail,
  updateProject,
  deleteProject,
  getProjectsByGroup
} = require("../controllers/project.controller");

/* =====================================================
   CREATE PROJECT
   ===================================================== */
router.post(
  "/",
  protect,
  upload.single("banner"),
  createProject
);

/* =====================================================
   GET MY POST PROJECTS
   ===================================================== */
router.get(
  "/my-post-projects",
  protect,
  getMyPostProjects
);

/* =====================================================
   GET PROJECTS BY GROUP  ⚠️ MUST COME BEFORE :projectId
   ===================================================== */
router.get(
  "/by-group/:groupId",
  protect,
  getProjectsByGroup
);

/* =====================================================
   GET PROJECT DETAIL
   ===================================================== */
router.get(
  "/:projectId",
  protect,
  getProjectDetail
);

/* =====================================================
   UPDATE PROJECT
   ===================================================== */
router.put(
  "/:projectId",
  protect,
  upload.single("banner"),
  updateProject
);

/* =====================================================
   DELETE PROJECT
   ===================================================== */
router.delete(
  "/:projectId",
  protect,
  deleteProject
);

module.exports = router;
