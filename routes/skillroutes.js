const express = require("express");
const router = express.Router();
const skillController = require("../controllers/skillcontroller");

router.get("/skills", skillController.getAllSkills);

module.exports = router;
