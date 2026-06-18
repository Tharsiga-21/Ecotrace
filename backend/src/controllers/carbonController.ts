import { Request, Response, NextFunction } from "express";
import { CarbonService } from "../services/carbonService";

export class CarbonController {
  
  /**
   * GET /api/health
   * Simple endpoint to check service status.
   */
  public static checkHealth(req: Request, res: Response) {
    res.status(200).json({
      status: "ok",
      message: "Modular secured CarbonLeaf Tracker Backend is fully active!",
      timestamp: new Date().toISOString()
    });
  }

  /**
   * POST /api/carbon/calculate
   * Client-side/server-side matching carbon footprint calculator.
   */
  public static calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const { energy, transport, diet, waste } = req.body;
      const result = CarbonService.calculateFootprint(energy, transport, diet, waste);
      
      res.status(200).json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/carbon/analyze
   * Evaluates footprint grade, carbon hotspots, and carbon status.
   */
  public static async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const { energy, transport, diet, waste } = req.body;
      const result = CarbonService.calculateFootprint(energy, transport, diet, waste);
      
      const analysis = await CarbonService.generateSecureRecommendations(
        energy,
        transport,
        diet,
        waste,
        result,
        "analyze"
      );

      res.status(200).json({
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/carbon/recommendations
   * Generates localized targeted checklists for reducing emissions.
   */
  public static async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const { energy, transport, diet, waste } = req.body;
      const result = CarbonService.calculateFootprint(energy, transport, diet, waste);

      const analysis = await CarbonService.generateSecureRecommendations(
        energy,
        transport,
        diet,
        waste,
        result,
        "recommendations"
      );

      res.status(200).json({
        success: true,
        recommendations: analysis.recommendations,
        isAiGenerated: analysis.isAiGenerated,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/carbon/goal-plan
   * Generates a 3-month action plan.
   */
  public static async getGoalPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { energy, transport, diet, waste } = req.body;
      const result = CarbonService.calculateFootprint(energy, transport, diet, waste);

      const analysis = await CarbonService.generateSecureRecommendations(
        energy,
        transport,
        diet,
        waste,
        result,
        "goal-plan"
      );

      res.status(200).json({
        success: true,
        goalPlan: analysis.goalPlan,
        isAiGenerated: analysis.isAiGenerated,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }
}
