// routes/adminRoutes.js
const express = require("express");
const {
  getAllUsers,
  generateAccessCodes,
  updateVoter,
  deleteVoter,
  monitorActivity,
  viewResults,
} = require("../controllers/adminController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/* ====================== ADMIN ROUTES ====================== */

// ✅ Get all users (admin + chairman can also view)
router.get("/", protect, authorizeRoles("admin", "chairman"), getAllUsers);

// ✅ Generate access codes for voters (admin only)
router.post(
  "/generate-access-codes",
  protect,
  authorizeRoles("admin"),
  generateAccessCodes
);

// ✅ Update voter info (admin only)
router.put("/voter/:id", protect, authorizeRoles("admin"), updateVoter);

// ✅ Delete voter (admin only)
router.delete("/voter/:id", protect, authorizeRoles("admin"), deleteVoter);

// ✅ Monitor system activity (admin only)
router.get("/monitor", protect, authorizeRoles("admin"), monitorActivity);

// ✅ View election results (admin, chairman, voter)
router.get(
  "/results",
  protect,
  authorizeRoles("admin", "chairman", "voter"),
  viewResults
);

module.exports = router;
