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

export interface CalculationInput {
  energy: HomeEnergyState;
  transport: TransportState;
  diet: DietState;
  waste: WasteState;
}

export interface Hotspot {
  category: string;
  description: string;
  impactPercent: number;
}

export interface Recommendation {
  title: string;
  description: string;
  expectedSavingsKg: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface Milestone {
  action: string;
  expectedEmissionsAfter: number;
}

export interface GoalPlan {
  timeframe: string;
  milestones: Milestone[];
}

export interface CarbonAnalysisResponse {
  carbonStatus: {
    label: string;
    grade: string;
  };
  hotspots: Hotspot[];
  recommendations: Recommendation[];
  goalPlan: GoalPlan;
  generationTimestamp: string;
  isAiGenerated: boolean;
}
