const express = require("express");

const protect = require("../middleware/authMiddleware");
const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const router = express.Router();

router.post("/", protect, createProject);

router.get("/", protect, getProjects);

router.put(
  "/:id",
  protect,
  updateProject
);

router.delete(
  "/:id",
  protect,
  deleteProject
);

module.exports = router;
