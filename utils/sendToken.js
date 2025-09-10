const jwt = require("jsonwebtoken");

const sendToken = (user, statusCode, res) => {
  // Create JWT payload
  const payload = { id: user._id, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });

  // Determine if we are in production
  const isProd = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,                 // inaccessible to JS
    secure: isProd,                 // only send over HTTPS in prod
    sameSite: isProd ? "none" : "lax", // cross-site in prod
    maxAge: 8 * 60 * 60 * 1000,     // 8 hours
  };

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email || null,
        role: user.role,
      },
    });
};

module.exports = sendToken;
