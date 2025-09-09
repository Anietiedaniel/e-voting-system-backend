const express = require("express");
const {
  login,
  voterLogin,
  getMe,
  logout,
  register // <-- new
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Voter self-registration
router.post("/register", register);

// Admin/Chairman login (email + password)
router.post("/login", login);

// Voter login (access code only)
router.post("/voter-login", voterLogin);

// Get current logged-in user
router.get("/getme", protect, getMe);

// Logout (clear cookie)
router.post("/logout", logout);

module.exports = router;
