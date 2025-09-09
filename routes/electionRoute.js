const express = require("express");
const {
  createElection,
  updateElection,
  deleteElection,
  getElections,
  getActiveElectionsForVoter,
  activateVoting,
  endVoting,
} = require("../controllers/electionController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/* ====== ADMIN / CHAIRMAN ====== */
router.post("/", protect, authorizeRoles("admin", "chairman"), createElection);
router.put("/:id", protect, authorizeRoles("admin", "chairman"), updateElection);
router.delete("/:id", protect, authorizeRoles("admin", "chairman"), deleteElection);
router.put("/:id/activate", protect, authorizeRoles("admin", "chairman"), activateVoting);
router.put("/:id/end", protect, authorizeRoles("admin", "chairman"), endVoting);
router.get("/", protect, authorizeRoles("admin", "chairman"), getElections);

/* ====== VOTER ====== */
router.get("/active", protect, authorizeRoles("voter"), getActiveElectionsForVoter);

module.exports = router;
