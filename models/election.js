const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema({
  title: String,
  description: String,
  startTime: Date,
  endTime: Date,
  isActive: { type: Boolean, default: false },
  candidates: [{ type: mongoose.Schema.Types.ObjectId, ref: "Candidate" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // chairman
});

module.exports = mongoose.model("Election", electionSchema);
