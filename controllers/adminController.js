const User = require("../models/user");
const Election = require("../models/election");
const Candidate = require("../models/candidate");
const Vote = require("../models/vote");
const generateAccessCode = require("../utils/generateAccessCode");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcryptjs");

/* ====================== VOTER MANAGEMENT ====================== */

// Get all voters (and other users)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update voter info
exports.updateVoter = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const voter = await User.findByIdAndUpdate(
      id,
      { name, email },
      { new: true }
    ).select("-password");
    if (!voter) return res.status(404).json({ message: "Voter not found" });

    res.status(200).json(voter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete voter
exports.deleteVoter = async (req, res) => {
  const { id } = req.params;
  try {
    const voter = await User.findByIdAndDelete(id);
    if (!voter) return res.status(404).json({ message: "Voter not found" });

    res.status(200).json({ message: "Voter deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Generate access codes for voters and email them
exports.generateAccessCodes = async (req, res) => {
  const { voterIds } = req.body;

  try {
    const updatedVoters = await Promise.all(
      voterIds.map(async (id) => {
        const code = generateAccessCode();

        const voter = await User.findByIdAndUpdate(
          id,
          { accessCode: code },
          { new: true }
        ).select("-password");

        if (voter && voter.email) {
          // Styled HTML email
          const html = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <div style="background: linear-gradient(90deg, #38b2ac, #4299e1); padding: 40px; border-radius: 15px; text-align: center; color: white;">
              <h1 style="margin-bottom: 10px;">Your Access Code is Ready!</h1>
              <p style="font-size: 18px;">Hello <strong>${voter.name}</strong>,</p>
              <div style="background: white; color: #333; display: inline-block; padding: 20px 40px; border-radius: 10px; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
                ${code}
              </div>
              <p style="margin-top: 20px; font-size: 16px;">Use this code to log in and vote.</p>
              <p style="margin-top: 30px; font-size: 14px; color: #e2e8f0;">If you did not request this, contact the administrator.</p>
            </div>
            <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #718096;">
              © ${new Date().getFullYear()} Election System
            </p>
          </div>
          `;

          await sendEmail({
            to: voter.email,
            subject: "Your Voter Access Code",
            html,
          });
        }

        return voter;
      })
    );

    res.status(200).json({
      message: "Access codes generated and emailed successfully",
      voters: updatedVoters,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ====================== ELECTION MANAGEMENT ====================== */

// View election results (with vote counts and dates)
exports.viewResults = async (req, res) => {
  try {
    const elections = await Election.find().lean();

    const results = await Promise.all(
      elections.map(async (election) => {
        const candidates = await Candidate.find({ election: election._id }).lean();

        const candidatesWithVotes = await Promise.all(
          candidates.map(async (candidate) => {
            const voteCount = await Vote.countDocuments({ candidate: candidate._id });
            return {
              _id: candidate._id,
              name: candidate.name,
              party: candidate.party,
              votes: voteCount,
            };
          })
        );

        return {
          ...election,
          candidates: candidatesWithVotes,
        };
      })
    );

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ====================== SYSTEM MONITORING ====================== */

// ==============================
// Monitor system activity
// ==============================
exports.monitorActivity = async (req, res) => {
  try {
    // Total counts
    const totalUsers = await User.countDocuments();
    const totalElections = await Election.countDocuments();

    // Fetch all users with their vote status
    const users = await User.find().select("name email role hasVoted").lean();

    // Fetch all votes with election and voter populated
    const votes = await Vote.find()
      .populate("election", "title")
      .populate("voter", "_id")
      .lean();

    const userVotesMap = {};
    const electionVotesMap = {}; // ✅ track votes per election

    votes.forEach(vote => {
      // Skip if voter missing
      if (!vote.voter || !vote.voter._id) return;

      // Track votes by user
      if (!userVotesMap[vote.voter._id]) userVotesMap[vote.voter._id] = [];

      if (vote.election && vote.election._id) {
        userVotesMap[vote.voter._id].push({
          electionId: vote.election._id,
          electionTitle: vote.election.title,
        });

        // Track votes by election
        if (!electionVotesMap[vote.election._id]) {
          electionVotesMap[vote.election._id] = {
            electionId: vote.election._id,
            electionTitle: vote.election.title,
            votes: 0,
          };
        }
        electionVotesMap[vote.election._id].votes += 1;
      } else {
        userVotesMap[vote.voter._id].push({
          electionId: null,
          electionTitle: "Deleted or unavailable election",
        });
      }
    });

    // Attach voted elections to each user
    const usersWithVotes = users.map(user => ({
      ...user,
      votedElections: userVotesMap[user._id] || [],
    }));

    // Convert electionVotesMap to array
    const votesByElection = Object.values(electionVotesMap);

    // Total votes across all elections
    const totalVotes = votesByElection.reduce((sum, e) => sum + e.votes, 0);

    res.status(200).json({
      totalUsers,
      totalElections,
      totalVotes,
      votesByElection, // ✅ election-by-election breakdown
      users: usersWithVotes,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
