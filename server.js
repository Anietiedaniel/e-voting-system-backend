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

// Determine if production
const isProd = process.env.NODE_ENV === "production";

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,              // allow cookies to be sent cross-domain
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Preflight requests
app.options("*", cors(corsOptions));

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running in ${isProd ? "production" : "development"} on port ${PORT}`)
);
