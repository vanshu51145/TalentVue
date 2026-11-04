const express = require("express");

const protect = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(
      req.user.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Protected route accessed successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("PROFILE FETCH ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
