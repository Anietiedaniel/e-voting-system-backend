const Candidate = require("../models/candidate");
const Election = require("../models/election");

// =========================
// Create Candidate
// =========================
exports.createCandidate = async (req, res) => {
  try {
    const { name, party, photo, electionId } = req.body;

    if (!name || !party || !electionId) {
      return res
        .status(400)
        .json({ message: "Name, party, and election are required" });
    }

    // Check if election exists
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    const now = new Date();

    // Prevent adding candidates if election has started or ended
    if (election.startTime && now >= new Date(election.startTime)) {
      return res
        .status(400)
        .json({ message: "Cannot add candidates: Election has already started" });
    }
    if (election.endTime && now >= new Date(election.endTime)) {
      return res
        .status(400)
        .json({ message: "Cannot add candidates: Election has already ended" });
    }

    // Prevent multiple candidates from the same party in the same election
    const existingCandidate = await Candidate.findOne({
      election: electionId,
      party: party,
    });
    if (existingCandidate) {
      return res
        .status(400)
        .json({ message: `A candidate from the party "${party}" already exists in this election.` });
    }

    // Create candidate
    const candidate = await Candidate.create({
      name,
      party,
      photo,
      election: electionId,
    });

    await candidate.populate("election", "title");

    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// Get All Candidates (optionally by election)
// =========================
exports.getCandidates = async (req, res) => {
  try {
    const { electionId } = req.params;
    let candidates;

    if (electionId) {
      candidates = await Candidate.find({ election: electionId }).populate(
        "election",
        "title"
      );
    } else {
      candidates = await Candidate.find().populate("election", "title");
    }

    res.status(200).json(candidates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// Get Single Candidate
// =========================
exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate(
      "election",
      "title"
    );
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }
    res.status(200).json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// Update Candidate
// =========================
exports.updateCandidate = async (req, res) => {
  try {
    const { name, party, photo, electionId } = req.body;

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Check election of the candidate
    const currentElection = await Election.findById(candidate.election);
    const now = new Date();

    // Prevent updates if election has started
    if (currentElection.startTime && now >= new Date(currentElection.startTime)) {
      return res
        .status(400)
        .json({ message: "Cannot update candidate: Election has already started" });
    }

    const updates = { name, party, photo };

    if (electionId) {
      // Check if new election exists
      const newElection = await Election.findById(electionId);
      if (!newElection) {
        return res.status(404).json({ message: "Election not found" });
      }

      // Prevent changing to an election that has started
      if (newElection.startTime && now >= new Date(newElection.startTime)) {
        return res
          .status(400)
          .json({ message: "Cannot assign candidate: New election has already started" });
      }

      // Prevent same party duplication in new election
      const existingCandidate = await Candidate.findOne({
      election: electionId,
      party: party,
    });
      if (existingCandidate) {
        return res
          .status(400)
          .json({ message: `A candidate from the party "${party}" already exists in this election.` });
      }

      updates.election = electionId;
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidate._id,
      updates,
      { new: true }
    ).populate("election", "title");

    res.status(200).json(updatedCandidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// Delete Candidate
// =========================
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Delete is allowed even if election ended
    await Candidate.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Candidate deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
