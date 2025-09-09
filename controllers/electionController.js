const Election = require("../models/election");
const Candidate = require("../models/candidate");

/* ================== CREATE ELECTION ================== */
exports.createElection = async (req, res) => {
  const { title, description } = req.body;
  try {
    const election = await Election.create({
      title,
      description,
      createdBy: req.user._id,
      isActive: false, // default
    });
    res.status(201).json(election);
  } catch (error) {
    res.status(400).json({ message: "Error creating election", error });
  }
};

/* ================== UPDATE ELECTION ================== */
exports.updateElection = async (req, res) => {
  const { id } = req.params;
  const { title, description, startTime, endTime } = req.body;

  try {
    const updatedElection = await Election.findByIdAndUpdate(
      id,
      { title, description, startTime, endTime },
      { new: true }
    );

    if (!updatedElection)
      return res.status(404).json({ message: "Election not found" });

    res.status(200).json({ message: "Election updated", election: updatedElection });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================== DELETE ELECTION ================== */
exports.deleteElection = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedElection = await Election.findByIdAndDelete(id);
    if (!deletedElection)
      return res.status(404).json({ message: "Election not found" });

    res.status(200).json({ message: "Election deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================== GET ELECTIONS ================== */
exports.getElections = async (req, res) => {
  try {
    const elections = await Election.find()
      .populate("candidates")
      .populate("createdBy", "name email role");
    res.status(200).json(elections);
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActiveElectionsForVoter = async (req, res) => {
  try {
    const now = new Date();
    const elections = await Election.find({
      isActive: true,
      startTime: { $lte: now },
      $or: [{ endTime: { $gte: now } }, { endTime: null }],
    })
      .populate("candidates")
      .populate("createdBy", "name email role");

    res.status(200).json(elections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================== VOTING CONTROL ================== */
// Start election → activate + set startTime
exports.activateVoting = async (req, res) => {
  try {
    const { id } = req.params;
    const election = await Election.findById(id);
    if (!election) return res.status(404).json({ message: "Election not found" });

    election.isActive = true;
    election.startTime = election.startTime || new Date();
    await election.save();

    res.status(200).json({ message: "Election started successfully", election });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// End election → deactivate + set endTime
exports.endVoting = async (req, res) => {
  try {
    const { id } = req.params;
    const election = await Election.findById(id);
    if (!election) return res.status(404).json({ message: "Election not found" });

    election.isActive = false;
    election.endTime = election.endTime || new Date();
    await election.save();

    res.status(200).json({ message: "Election ended successfully", election });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
