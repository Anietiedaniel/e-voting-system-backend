const express = require("express");
const { castVote, getMyVotes, getResults } = require("../controllers/voteController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Voter routes
router.post("/", protect, authorizeRoles("voter"), castVote); // Cast a vote
router.get("/my", protect, authorizeRoles("voter"), getMyVotes); // Get logged-in voter's votes
router.get("/results", protect, authorizeRoles("voter", "chairman", "admin"), getResults); // Election results

module.exports = router;
