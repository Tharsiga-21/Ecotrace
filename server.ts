import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { CarbonService } from "./backend/src/services/carbonService";

dotenv.config();

// Lazily initialize direct server-side Gemini client for Chat
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Diagnostics Router
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      server: "CarbonLeaf Fullstack Unified Dev Engine",
      timestamp: new Date().toISOString()
    });
  });

  // 2. High-Fidelity Carbon Calculations Router
  app.post("/api/carbon/calculate", (req, res, next) => {
    try {
      const { energy, transport, diet, waste } = req.body;
      if (!energy || !transport || !diet || !waste) {
        return res.status(400).json({ error: "Missing required carbon payload parameters." });
      }
      const result = CarbonService.calculateFootprint(energy, transport, diet, waste);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/carbon/analyze", async (req, res) => {
    try {
      const { energy, transport, diet, waste } = req.body;
      if (!energy || !transport || !diet || !waste) {
        return res.status(400).json({ error: "Missing required carbon payload parameters." });
      }
      const result = CarbonService.calculateFootprint(energy, transport, diet, waste);
      const analysis = await CarbonService.generateSecureRecommendations(
        energy, transport, diet, waste, result, "analyze"
      );
      res.json({ success: true, analysis });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/carbon/recommendations", async (req, res) => {
    try {
      const { energy, transport, diet, waste } = req.body;
      if (!energy || !transport || !diet || !waste) {
        return res.status(400).json({ error: "Missing required carbon payload parameters." });
      }
      const result = CarbonService.calculateFootprint(energy, transport, diet, waste);
      const analysis = await CarbonService.generateSecureRecommendations(
        energy, transport, diet, waste, result, "recommendations"
      );
      res.json({ success: true, recommendations: analysis.recommendations, isAiGenerated: analysis.isAiGenerated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/carbon/goal-plan", async (req, res) => {
    try {
      const { energy, transport, diet, waste } = req.body;
      if (!energy || !transport || !diet || !waste) {
        return res.status(400).json({ error: "Missing required carbon payload parameters." });
      }
      const result = CarbonService.calculateFootprint(energy, transport, diet, waste);
      const analysis = await CarbonService.generateSecureRecommendations(
        energy, transport, diet, waste, result, "goal-plan"
      );
      res.json({ success: true, goalPlan: analysis.goalPlan, isAiGenerated: analysis.isAiGenerated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Robust, Fail-Safe AI Conversation Advisor
  app.post("/api/chat", async (req, res) => {
    const { message, history, currentProfile } = req.body;
    try {
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      console.log(`[Advisor Chat] Running super high-fidelity, local-first dynamic rule-based counselor.`);

      let advisorResponse = "### 🍃 Welcome to CarbonLeaf Local Advisor\n\nI am currently offline. Please update the slider metrics above to see actual carbon offsets.";
      if (currentProfile && currentProfile.input && currentProfile.result) {
        advisorResponse = CarbonService.generateLocalAdvisorResponse(
          message,
          currentProfile.input.energy,
          currentProfile.input.transport,
          currentProfile.input.diet,
          currentProfile.input.waste,
          currentProfile.result
        );
      } else {
        advisorResponse = `### 🍃 CarbonLeaf Sustainability Coaching

Hello! I have reviewed your profile and am ready to coach you. Please input your green utility details and ask me anything about lowering your footprints!`;
      }

      const queryHistory = history || [];
      const updatedHistory = [
        ...queryHistory,
        { role: "user", parts: [{ text: message }] },
        { role: "model", parts: [{ text: advisorResponse }] },
      ];

      res.json({
        text: advisorResponse,
        history: updatedHistory
      });
    } catch (error: any) {
      console.error("[Advisor Chat Exception] local fallback failure:", error?.message);
      res.status(500).json({ error: "Local simulation failed." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
