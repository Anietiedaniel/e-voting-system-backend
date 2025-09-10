const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration
const isProd = process.env.NODE_ENV === "production";
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true, // allow cookies to be sent cross-domain
  })
);

// Import routes
const authRoutes = require("./routes/authRoute");
const adminRoutes = require("./routes/adminRoute");
const electionRoutes = require("./routes/electionRoute");
const voteRoutes = require("./routes/voteRoute");
const candidateRoutes = require("./routes/candidateRoute");

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/votes", voteRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Election System API is running...");
});

// Error handler (last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
