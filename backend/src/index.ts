import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import carbonRoutes from "./routes/carbonRoutes";
import healthRoutes from "./routes/healthRoutes";
import { errorHandler } from "./middleware/errorHandler";

// Load configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(cors({
  origin: "*", // allow connecting from Vercel frontends or any browser client easily
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Main App API Routes
app.use("/api/health", healthRoutes);
app.use("/api/carbon", carbonRoutes);

// Catch-all API error fallback
app.use((req, res, next) => {
  res.status(404).json({
    error: "Specified Carbon endpoint does not exist."
  });
});

// Central Exception Logger & Handler
app.use(errorHandler);

// Start Server (only if not loaded as a module)
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`[BACKEND SERVER] CarbonLeaf Backend is active at http://localhost:${PORT}`);
  });
}

export default app;
