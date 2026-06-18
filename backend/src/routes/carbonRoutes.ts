import { Router } from "express";
import { CarbonController } from "../controllers/carbonController";
import { validateCarbonInput } from "../validators/carbonValidator";
import { rateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Secure calculations and advisor predictions with rates-limiting & validations
router.post("/calculate", rateLimiter, validateCarbonInput, CarbonController.calculate);
router.post("/analyze", rateLimiter, validateCarbonInput, CarbonController.analyze);
router.post("/recommendations", rateLimiter, validateCarbonInput, CarbonController.getRecommendations);
router.post("/goal-plan", rateLimiter, validateCarbonInput, CarbonController.getGoalPlan);

export default router;
