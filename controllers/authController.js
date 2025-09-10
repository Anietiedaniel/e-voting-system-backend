const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendToken = require("../utils/sendToken");
const sendEmail = require("../utils/sendEmail"); // NodeMailer utility

// Admin/Chairman login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!["admin", "chairman"].includes(user.role)) {
      return res.status(403).json({ message: "Forbidden: use access code" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Voter login with access code
exports.voterLogin = async (req, res) => {
  const { accessCode } = req.body;

  try {
    const voter = await User.findOne({ accessCode, role: "voter" });
    if (!voter) return res.status(404).json({ message: "Invalid access code" });

    sendToken(voter, 200, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Registration (Admin/Chairman or Voter)
exports.register = async (req, res) => {
  const { name, email, password, voterId, role } = req.body;

  try {
    if (role === "admin" || role === "chairman") {
      // Admin/Chairman registration
      if (!name || !email || !password || !role) {
        return res
          .status(400)
          .json({ message: "Name, email, password, and role are required" });
      }

      const existingRole = await User.findOne({ role });
      if (existingRole) {
        return res.status(400).json({ message: `Only one ${role} is allowed in the system` });
      }

      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const adminOrChairman = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
      });

      return res.status(201).json({
        success: true,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
        user: {
          id: adminOrChairman._id,
          name: adminOrChairman.name,
          email: adminOrChairman.email,
          role: adminOrChairman.role,
        },
      });

    } else if (role === "voter") {
      // Voter registration
      if (!name || !email || !voterId) {
        return res
          .status(400)
          .json({ message: "Name, email, and voterId are required for voter" });
      }

      const existingVoter = await User.findOne({ $or: [{ email }, { voterId }] });
      if (existingVoter) {
        return res
          .status(400)
          .json({ message: "Email or Voter ID already registered" });
      }

      const voter = await User.create({
        name,
        email,
        voterId,
        role: "voter",
      });

      // Send email notification to all admins/chairmen
      try {
        const admins = await User.find({ role: { $in: ["admin", "chairman"] } });
        const adminEmails = admins.map(a => a.email).join(",");
        if (adminEmails) {
          await sendEmail({
            to: adminEmails,
            subject: "New Voter Registration",
            text: `A new voter has registered.\n\nName: ${name}\nEmail: ${email}\nVoter ID: ${voterId}\n\nPlease login as Admin to generate access code.`,
            html: `<p>A new voter has registered.</p>
                   <p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email:</strong> ${email}</p>
                   <p><strong>Voter ID:</strong> ${voterId}</p>
                   <p>Please login as Admin to generate access code.</p>`
          });
        }
      } catch (err) {
        console.error("Error sending admin notification email:", err.message);
      }

      return res.status(201).json({
        success: true,
        message: "Voter registered successfully. Wait for Admin to generate your access code.",
        user: {
          id: voter._id,
          name: voter.name,
          email: voter.email,
          voterId: voter.voterId,
          role: voter.role,
        },
      });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get current user (/getme)
exports.getMe = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Logout
exports.logout = (req, res) => {
  res
    .cookie("token", "", { httpOnly: true, expires: new Date(0) })
    .status(200)
    .json({ success: true, message: "Logged out" });
};
