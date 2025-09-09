const jwt = require("jsonwebtoken");

const sendToken = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only on HTTPS in prod
    sameSite: "strict",
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      user: { id: user._id, name: user.name, role: user.role }
    });
};

module.exports = sendToken;
