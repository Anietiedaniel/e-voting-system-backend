const express = require("express");
const {
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} = require("../controllers/candidateController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin/Chairman: get all candidates
router.get("/", protect, authorizeRoles("admin", "chairman"), getCandidates);

// Fetch all OR by electionId
router.get("/:electionId", protect, authorizeRoles("chairman", "admin", "voter"), getCandidates);

// Admin/Chairman only
router.post("/", protect, authorizeRoles("chairman"), createCandidate);
router.put("/:id", protect, authorizeRoles("chairman"), updateCandidate);
router.delete("/:id", protect, authorizeRoles("chairman"), deleteCandidate);

module.exports = router;
