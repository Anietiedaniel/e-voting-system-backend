const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String }, // hashed, only for admin/chairman
  role: { type: String, enum: ["admin","chairman","voter"],default: "voter", required: true },

  // Voter-specific fields
  accessCode: { type: String, unique: true, sparse: true },
  hasVoted: { type: Boolean, default: false },

  // Chairman-specific fields
  createdElections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Election" }]
});

module.exports = mongoose.model("User", userSchema);
