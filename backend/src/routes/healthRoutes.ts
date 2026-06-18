import { Router } from "express";
import { CarbonController } from "../controllers/carbonController";

const router = Router();

router.get("/", CarbonController.checkHealth);

export default router;
