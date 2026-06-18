export interface HomeEnergyState {
  electricityKwh: number;
  electricityCost: number;
  useCost: boolean;
  gasTherms: number;
  hasSolarOnGrid: boolean;
  cleanEnergyMix: number;
}

export interface TransportState {
  carMiles: number;
  carType: "gasoline" | "diesel" | "hybrid" | "electric" | "none";
  publicTransitMiles: number;
  shortFlights: number;
  longFlights: number;
}

export interface DietState {
  dietType: "meat-heavy" | "average" | "vegetarian" | "vegan" | "pescatarian";
  foodWaste: "low" | "average" | "high";
  buyLocal: boolean;
}

export interface WasteState {
  wasteLevel: "low" | "average" | "high";
  recyclePaper: boolean;
  recyclePlastic: boolean;
  recycleGlass: boolean;
  recycleMetal: boolean;
  compostFood: boolean;
}

export interface FootprintResult {
  homeEnergy: number;
  transport: number;
  diet: number;
  waste: number;
  total: number;
}

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface CalculationInput {
  energy: HomeEnergyState;
  transport: TransportState;
  diet: DietState;
  waste: WasteState;
}

export interface CarbonAnalysisResponse {
  carbonStatus: {
    label: string;
    grade: string;
  };
  hotspots: {
    category: string;
    description: string;
    impactPercent: number;
  }[];
  recommendations: {
    title: string;
    description: string;
    expectedSavingsKg: number;
    difficulty: "easy" | "medium" | "hard";
  }[];
  goalPlan: {
    timeframe: string;
    milestones: {
      action: string;
      expectedEmissionsAfter: number;
    }[];
  };
  generationTimestamp: string;
  isAiGenerated: boolean;
}
