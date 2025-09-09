const mongoose = require("mongoose");
const Vote = require("../models/vote");
const Candidate = require("../models/candidate");
const Election = require("../models/election");
const User = require("../models/user");


// =========================
// Cast a vote
// =========================


exports.castVote = async (req, res) => {
  try {
    const { candidateId, electionId } = req.body;
    const voterId = req.user._id;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(candidateId) || !mongoose.Types.ObjectId.isValid(electionId)) {
      return res.status(400).json({ message: "Invalid candidate or election ID" });
    }

    // Check if election exists and is active
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: "Election not found" });
    if (!election.isActive) return res.status(400).json({ message: "Election is not active" });

    // Check if voter already voted in this election
    const existingVote = await Vote.findOne({ voter: voterId, election: electionId });
    if (existingVote) return res.status(400).json({ message: "You have already voted in this election" });

    // Check if candidate exists and belongs to this election
    const candidate = await Candidate.findById(candidateId);
    if (!candidate || candidate.election.toString() !== electionId) {
      return res.status(400).json({ message: "Invalid candidate for this election" });
    }

    // Create vote
    const vote = await Vote.create({
      voter: voterId,
      candidate: candidateId,
      election: electionId,
    });

    // Update voter's hasVoted to true
    await User.findByIdAndUpdate(voterId, { hasVoted: true });

    res.status(201).json({ message: "Vote cast successfully", vote });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// =========================
// Get all votes of the logged-in voter
// =========================
exports.getMyVotes = async (req, res) => {
  try {
    const voterId = req.user._id;

    const votes = await Vote.find({ voter: voterId })
      .populate({ path: "candidate", select: "name party" })
      .populate({ path: "election", select: "title description" });

    // Filter out any votes where candidate no longer exists
    const validVotes = votes.filter(v => v.candidate);

    res.status(200).json(validVotes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// Get results for an election (votes per candidate)
// =========================
exports.getResults = async (req, res) => {
  try {
    const { electionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(electionId)) {
      return res.status(400).json({ message: "Invalid election ID" });
    }

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: "Election not found" });

    // Aggregate votes per candidate
    const results = await Vote.aggregate([
      { $match: { election: election._id } },
      { $group: { _id: "$candidate", totalVotes: { $sum: 1 } } },
      {
        $lookup: {
          from: "candidates",
          localField: "_id",
          foreignField: "_id",
          as: "candidate",
        },
      },
      { $unwind: "$candidate" },
      {
        $project: {
          _id: 0,
          candidateId: "$candidate._id",
          candidateName: "$candidate.name",
          party: "$candidate.party",
          totalVotes: 1,
        },
      },
      { $sort: { totalVotes: -1 } },
    ]);

    res.status(200).json({ election: { _id: election._id, title: election.title }, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
