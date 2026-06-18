import { Request, Response, NextFunction } from "express";

/**
 * Validates request body to ensure all carbon parameters are present with safe data ranges.
 */
export function validateCarbonInput(req: Request, res: Response, next: NextFunction) {
  const { energy, transport, diet, waste } = req.body;

  if (!energy || !transport || !diet || !waste) {
    return res.status(400).json({
      error: "Missing parameters. Requests must contain: 'energy', 'transport', 'diet', and 'waste' configurations."
    });
  }

  // Sanitizations & bounded limits check
  try {
    // 1. Home Energy Inputs
    energy.electricityKwh = Math.max(0, Number(energy.electricityKwh ?? 0));
    energy.electricityCost = Math.max(0, Number(energy.electricityCost ?? 0));
    energy.gasTherms = Math.max(0, Number(energy.gasTherms ?? 0));
    energy.cleanEnergyMix = Math.min(100, Math.max(0, Number(energy.cleanEnergyMix ?? 0)));
    energy.hasSolarOnGrid = !!energy.hasSolarOnGrid;
    energy.useCost = !!energy.useCost;

    // 2. Transport Inputs
    transport.carMiles = Math.max(0, Number(transport.carMiles ?? 0));
    transport.publicTransitMiles = Math.max(0, Number(transport.publicTransitMiles ?? 0));
    transport.shortFlights = Math.max(0, Number(transport.shortFlights ?? 0));
    transport.longFlights = Math.max(0, Number(transport.longFlights ?? 0));
    
    const validCarTypes = ["gasoline", "diesel", "hybrid", "electric", "none"];
    if (!validCarTypes.includes(transport.carType)) {
      transport.carType = "gasoline";
    }

    // 3. Diet Inputs
    const validDiets = ["meat-heavy", "average", "vegetarian", "vegan", "pescatarian"];
    if (!validDiets.includes(diet.dietType)) {
      diet.dietType = "average";
    }
    
    const validWasteBehaviors = ["low", "average", "high"];
    if (!validWasteBehaviors.includes(diet.foodWaste)) {
      diet.foodWaste = "average";
    }
    diet.buyLocal = !!diet.buyLocal;

    // 4. Waste Inputs
    if (!validWasteBehaviors.includes(waste.wasteLevel)) {
      waste.wasteLevel = "average";
    }
    waste.recyclePaper = !!waste.recyclePaper;
    waste.recyclePlastic = !!waste.recyclePlastic;
    waste.recycleGlass = !!waste.recycleGlass;
    waste.recycleMetal = !!waste.recycleMetal;
    waste.compostFood = !!waste.compostFood;

    // Re-inject validated params
    req.body = { energy, transport, diet, waste };
    next();
  } catch (err) {
    return res.status(400).json({
      error: "Validation failed: Provided carbon input parameters contain invalid payload formats."
    });
  }
}
