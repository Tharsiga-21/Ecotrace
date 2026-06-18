import { GoogleGenAI } from "@google/genai";
import { CARBON_FACTORS } from "../constants/carbonFactors";
import {
  HomeEnergyState,
  TransportState,
  DietState,
  WasteState,
  FootprintResult,
  CarbonAnalysisResponse
} from "../types/index";

export class CarbonService {
  private static aiClient: GoogleGenAI | null = null;

  /**
   * Lazily initializes Google Gen AI. Prevents app crashing at load-time if key is missing.
   */
  private static getAiClient(): GoogleGenAI | null {
    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        this.aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      }
    }
    return this.aiClient;
  }

  /**
   * Translates activity metrics to annual kg CO2 equivalent.
   */
  public static calculateFootprint(
    energy: HomeEnergyState,
    transport: TransportState,
    diet: DietState,
    waste: WasteState
  ): FootprintResult {
    // 1. Home Energy Calculation
    let electricityKwh = energy.useCost
      ? (energy.electricityCost / CARBON_FACTORS.AVERAGE_ELECTRICITY_PRICE_PER_KWH)
      : energy.electricityKwh;

    let electricityCo2 = electricityKwh * 12 * CARBON_FACTORS.ELECTRICITY_KG_CO2_PER_KWH;

    if (energy.hasSolarOnGrid) {
      electricityCo2 *= CARBON_FACTORS.SOLAR_MULTIPLIER;
    } else if (energy.cleanEnergyMix > 0) {
      electricityCo2 *= (1 - energy.cleanEnergyMix / 100);
    }

    let gasCo2 = energy.gasTherms * 12 * CARBON_FACTORS.GAS_KG_CO2_PER_THERM;
    let homeEnergyTotal = Math.max(0, electricityCo2 + gasCo2);

    // 2. Transport Calculation
    let carMilesAnnual = transport.carMiles * 12;
    let carCo2 = carMilesAnnual * (CARBON_FACTORS.CAR_FUEL_KG_CO2_PER_MILE[transport.carType] ?? 0);
    let transitCo2 = transport.publicTransitMiles * 12 * CARBON_FACTORS.PUBLIC_TRANSIT_KG_CO2_PER_MILE;
    let flightCo2 = (transport.shortFlights * CARBON_FACTORS.FLIGHT_SHORT_HAUL_KG_CO2) +
                    (transport.longFlights * CARBON_FACTORS.FLIGHT_LONG_HAUL_KG_CO2);

    let transportTotal = carCo2 + transitCo2 + flightCo2;

    // 3. Diet Calculation
    const dietBase = CARBON_FACTORS.DIET_BASE_KG_CO2_PER_YEAR[diet.dietType] ?? 2200;
    const foodWasteAdj = CARBON_FACTORS.FOOD_WASTE_ADJUSTMENT[diet.foodWaste] ?? 0;
    let dietTotal = dietBase + foodWasteAdj;

    if (diet.buyLocal) {
      dietTotal *= CARBON_FACTORS.BUY_LOCAL_MULTIPLIER;
    }
    let dietFinal = Math.max(300, dietTotal);

    // 4. Waste Calculation
    let wasteBase = CARBON_FACTORS.WASTE_BASE_KG_CO2_PER_YEAR[waste.wasteLevel] ?? 500;

    if (waste.recyclePaper) wasteBase -= CARBON_FACTORS.RECYCLING_OFFSETS.recyclePaper;
    if (waste.recyclePlastic) wasteBase -= CARBON_FACTORS.RECYCLING_OFFSETS.recyclePlastic;
    if (waste.recycleGlass) wasteBase -= CARBON_FACTORS.RECYCLING_OFFSETS.recycleGlass;
    if (waste.recycleMetal) wasteBase -= CARBON_FACTORS.RECYCLING_OFFSETS.recycleMetal;
    if (waste.compostFood) wasteBase -= CARBON_FACTORS.RECYCLING_OFFSETS.compostFood;

    let wasteFinal = Math.max(50, wasteBase);

    return {
      homeEnergy: Math.round(homeEnergyTotal),
      transport: Math.round(transportTotal),
      diet: Math.round(dietFinal),
      waste: Math.round(wasteFinal),
      total: Math.round(homeEnergyTotal + transportTotal + dietFinal + wasteFinal),
    };
  }

  /**
   * Performs rule-based local analysis fallback when Gemini API is throttled/absent.
   */
  public static calculateLocalAnalysis(
    energy: HomeEnergyState,
    transport: TransportState,
    diet: DietState,
    waste: WasteState,
    result: FootprintResult
  ): CarbonAnalysisResponse {
    const totalTons = Number((result.total / 1000).toFixed(2));
    let statusLabel = "Moderate Impact";
    let statusGrade = "C";

    if (totalTons <= 2.0) {
      statusLabel = "Excellent / Climate Safer";
      statusGrade = "A";
    } else if (totalTons <= 4.5) {
      statusLabel = "Good (Moderate Impact)";
      statusGrade = "B";
    } else if (totalTons > 8.0) {
      statusLabel = "High Impact Profile";
      statusGrade = "F";
    } else {
      statusLabel = "Elevated Emissions";
      statusGrade = "D";
    }

    const hotspots: { category: string; description: string; impactPercent: number }[] = [];
    const total = result.total || 1;

    const hPct = Math.round((result.homeEnergy / total) * 100);
    const tPct = Math.round((result.transport / total) * 100);
    const dPct = Math.round((result.diet / total) * 100);

    if (result.homeEnergy > 1500) {
      hotspots.push({
        category: "Home Energy",
        description: `Heating natural gas & electricity configurations contribute ${hPct}% of emissions. Active insulating and energy efficiency audits hold high leverage.`,
        impactPercent: hPct
      });
    }

    if (transport.carMiles > 500 && (transport.carType === "gasoline" || transport.carType === "diesel")) {
      hotspots.push({
        category: "Transport Tailpipes",
        description: `Driving a non-hybrid/non-EV highway commute contributes heavily. Transitioning to EV or carpooling cuts this contributor instantly.`,
        impactPercent: tPct
      });
    } else if (result.transport > 2000) {
      hotspots.push({
        category: "Aviation Emissions",
        description: `High altitude flight burning generates exceptional greenhouse multipliers. Reducing short flight runs offers heavy environmental protection.`,
        impactPercent: tPct
      });
    }

    if (diet.dietType === "meat-heavy" || diet.dietType === "average") {
      hotspots.push({
        category: "Dietary Footprints",
        description: `Meat-heavy nutritional choices require massive agricultural upstream supplies. Plant-based proteins cut agricultural land/methane loads by up to 70%.`,
        impactPercent: dPct
      });
    }

    // Default ensure we have 2 hotspots
    if (hotspots.length < 2) {
      hotspots.push({
        category: "Grid electricity",
        description: "Your local energy mix contains some fossil power generators. Opt-in to grid community solar clean plans.",
        impactPercent: hPct
      });
      hotspots.push({
        category: "Solid garbage waste",
        description: "Decomposing garbage generates landfills gases. Recycling paper/metal reduces overall raw metal manufacturing pressure.",
        impactPercent: Math.round((result.waste / total) * 100)
      });
    }

    const recommendations: { title: string; description: string; expectedSavingsKg: number; difficulty: "easy" | "medium" | "hard" }[] = [];

    if (energy.cleanEnergyMix < 85 && !energy.hasSolarOnGrid) {
      recommendations.push({
        title: "Subscribe to Certified Community Solar Plans",
        description: "Opt-in to local clean power utilities to purchase wind/solar credits. This simple check cuts house grid carbon without buying private modules.",
        expectedSavingsKg: Math.round(result.homeEnergy * 0.4),
        difficulty: "easy"
      });
    }

    if (transport.carType === "gasoline" || transport.carType === "diesel") {
      recommendations.push({
        title: "Consider Shifting to HEV/EV Car Options",
        description: "Battery electric commutes slash individual tailpipe greenhouse weights from 404 grams down to 100 grams per mile driven.",
        expectedSavingsKg: Math.round(result.transport * 0.55),
        difficulty: "hard"
      });
    }

    if (diet.dietType === "meat-heavy" || diet.dietType === "average") {
      recommendations.push({
        title: "Initiate Weekly Plant-Based Cooking Rules",
        description: "Swapping carbon-heavy beef recipes with delicious legumes and greens cuts individual upstream food emissions by 15%.",
        expectedSavingsKg: Math.round(result.diet * 0.15),
        difficulty: "easy"
      });
    }

    // fallback filler if recommendations size is low
    while (recommendations.length < 3) {
      recommendations.push({
        title: "Optimize Kitchen Food Waste Composting",
        description: "Composting scraps feeds organic soil nutrients without creating high landfill atmospheric methane release.",
        expectedSavingsKg: 100,
        difficulty: "medium"
      });
    }

    recommendations.sort((a, b) => b.expectedSavingsKg - a.expectedSavingsKg);

    const goalPlan = {
      timeframe: "3-Month Targeted Carbon Reduction Pathway",
      milestones: [
        { action: "Month 1: Enable active food composting & subscribe to community solar billing", expectedEmissionsAfter: Math.round(result.total - 250) },
        { action: "Month 2: Shift 2 commuting runs per week to cycling/trains & adopt Meatless days", expectedEmissionsAfter: Math.round(result.total - 750) },
        { action: "Month 3: Plan high-range attic insulation seals or audit EV/HEV highway vehicles", expectedEmissionsAfter: Math.round(Math.max(1000, result.total - 1600)) }
      ]
    };

    return {
      carbonStatus: { label: statusLabel, grade: statusGrade },
      hotspots: hotspots.slice(0, 3),
      recommendations: recommendations.slice(0, 3),
      goalPlan,
      generationTimestamp: new Date().toISOString(),
      isAiGenerated: false
    };
  }

  /**
   * High-fidelity, local-first rule engine generating highly personalized sustainability recommendations.
   * Runs completely offline with 0ms latency to eliminate API timeouts or rate-limiting.
   */
  public static async generateSecureRecommendations(
    energy: HomeEnergyState,
    transport: TransportState,
    diet: DietState,
    waste: WasteState,
    result: FootprintResult,
    endpointHint: "analyze" | "recommendations" | "goal-plan"
  ): Promise<CarbonAnalysisResponse> {
    console.log(`[CarbonService] Generating dynamic local recommendations for task: ${endpointHint}`);
    return this.calculateLocalAnalysis(energy, transport, diet, waste, result);
  }

  /**
   * Helper utility to compile local advisor response into beautifully formatted Markdown.
   * Keeps the rich chat counselor vibe in case Gemini API is offline/throttled.
   */
  public static compileLocalAdvisorMarkdown(
    analysis: CarbonAnalysisResponse,
    result: FootprintResult
  ): string {
    const totalTons = (result.total / 1000).toFixed(2);
    
    return `### 🍃 Eco-Advisor Local Analysis Report

Your personalized Carbon Assessment is ready! Since my live neural link is currently congested, I have calculated your profile with our local **Climate Logic Engine v2.0**.

#### 📊 Carbon Scorecard
* **Estimated Annual Footprint:** **${totalTons} metric tons CO2e**
* **IPCC Paris safe limit:** **2.00 metric tons** (Maximum per/capita annual target)
* **Carbon Impact Class:** **${analysis.carbonStatus.label}** (Grade: **${analysis.carbonStatus.grade}**)

---

#### 🚨 Primary Carbon Hotspots
${analysis.hotspots.map((h, i) => `
**${i + 1}. ${h.category} (${h.impactPercent}% of total)**
* ${h.description}
`).join("")}

---

#### 💡 Recommended Actions to Adopt This Week
${analysis.recommendations.map((r, i) => `
**Action #${i + 1}: ${r.title}**
* **Impact:** Cuts approximately **${r.expectedSavingsKg} kg CO2e / year**
* **Difficulty:** \`${r.difficulty.toUpperCase()}\`
* *How:* ${r.description}
`).join("")}

---

#### 📅 Your 3-Month Emission Reduction Pathway
${analysis.goalPlan.milestones.map((m) => `
* **${m.action}**
  * *Target Footprint After:* \`~${(m.expectedEmissionsAfter / 1000).toFixed(2)} tons / year\`
`).join("")}

Would you like more guidance or specific tips on any of the actions recommended above? Just ask me below, and I will coach you through the steps!`;
  }

  /**
   * Generates a fully dynamic, user-tailored chat response locally, responding directly to standard queries
   * with exact carbon metrics and personalized advice based on live slider states.
   */
  public static generateLocalAdvisorResponse(
    message: string,
    energy: HomeEnergyState,
    transport: TransportState,
    diet: DietState,
    waste: WasteState,
    result: FootprintResult
  ): string {
    const msg = message.toLowerCase();
    const totalTons = (result.total / 1000).toFixed(2);
    
    // 1. Audit / Analysis Trigger
    if (msg.includes("carbon profile") || msg.includes("analyze my footprint") || msg.includes("personalized carbon profile") || msg.includes("sustainability report") || msg.includes("audit")) {
      const analysis = this.calculateLocalAnalysis(energy, transport, diet, waste, result);
      return this.compileLocalAdvisorMarkdown(analysis, result);
    }
    
    // 2. Diet & Food Trigger
    if (msg.includes("diet") || msg.includes("vegan") || msg.includes("vegetarian") || msg.includes("food") || msg.includes("meat")) {
      const dietBase = result.diet;
      let suggestion = "";
      if (diet.dietType === "meat-heavy" || diet.dietType === "average") {
        const potentialSavings = Math.round(dietBase - 1400);
        suggestion = `* **Switch to Vegetarian/Vegan days:** Doing so can slash your dietary carbon footprint significantly. For instance, shifting from your current **${diet.dietType}** diet to a vegetarian diet would cut food greenhouse emissions by approximately **${potentialSavings > 0 ? potentialSavings : 400} kg CO2e / year**.`;
      } else if (diet.dietType === "vegetarian" || diet.dietType === "pescatarian") {
        suggestion = `* **Go Full Vegan:** Transitioning from vegetarian/pescatarian to fully plant-based vegan saves an additional **400 kg CO2e / year**.`;
      } else {
        suggestion = `* **Keep rocking the Vegan Diet:** You've minimized your agricultural food footprint to the optimal **${dietBase} kg CO2e / year** standard. Absolute stellar climate protection!`;
      }
      
      const localSourcingSavings = Math.round(dietBase * 0.1);
      const localSourcingDesc = diet.buyLocal 
        ? `* **Buy Local regularly:** Awesome! Your local sourcing choices are already saving you **${localSourcingSavings} kg CO2e / year** in freight logistics emissions.`
        : `* **Prioritize Local Farmers:** Opting-in to farm-to-table sources would cut agricultural transit freight output, dropping your food emissions by an extra **${localSourcingSavings} kg CO2e / year** (10% discount).`;

      const foodWasteSavings = diet.foodWaste === "high" ? 280 : (diet.foodWaste === "average" ? 100 : 0);
      const foodWasteDesc = foodWasteSavings > 0
        ? `* **Zero Waste Habits:** Actively planning meals to eliminate leftovers would save up to **${foodWasteSavings} kg CO2e / year** of climate emissions while preventing rotting organic landfill rot.`
        : `* **Superb Food Waste Management:** Your low food waste habits keep your kitchen footprint as clean as possible.`;

      return `### 🥗 Personalized Low-Impact Dietary Guide

Your dietary choices currently produce **${dietBase.toLocaleString()} kg CO2e / year** (representing **${Math.round((result.diet / (result.total || 1)) * 100)}%** of your grand total). Here is a dynamic roadmap based on your profile:

${suggestion}

${localSourcingDesc}

${foodWasteDesc}

*Did you know?* Swapping just one high-climate beef dinner a week for a robust legume/veggie recipe cuts more greenhouse gas than taking a vehicle off the street for a full day. Try initiating a weekly "Meatless Monday" challenge!`;
    }

    // 3. Travel & Transportation Trigger
    if (msg.includes("transit") || msg.includes("car") || msg.includes("vehicle") || msg.includes("electric") || msg.includes("hybrid") || msg.includes("flight") || msg.includes("aviation") || msg.includes("travel")) {
      const transBase = result.transport;
      
      let vehicleDesc = "";
      if (transport.carType === "none") {
        vehicleDesc = `* **No Private Vehicle:** You've avoided car emissions completely! This is the single strongest way to keep transit load minimal.`;
      } else {
        const annualCarMiles = transport.carMiles * 12;
        const currentCarCo2 = Math.round(annualCarMiles * (CARBON_FACTORS.CAR_FUEL_KG_CO2_PER_MILE[transport.carType] ?? 0.404));
        const evCo2 = Math.round(annualCarMiles * 0.1);
        const evSavings = Math.max(0, currentCarCo2 - evCo2);

        vehicleDesc = `* **Private Commute Audit:** Driving **${transport.carMiles} miles / month** in your **${transport.carType}** car produces **${currentCarCo2.toLocaleString()} kg CO2e / year**. 
  * If you upgraded to a **full electric vehicle (EV)**, you would save **${evSavings.toLocaleString()} kg CO2e / year** (a **${Math.round((1 - 0.1 / (CARBON_FACTORS.CAR_FUEL_KG_CO2_PER_MILE[transport.carType] || 0.404)) * 100)}%** tailpipe drop!).
  * If you shifted **2 commuting days** to public train/bus runs, you would slash car emissions by **${Math.round(currentCarCo2 * 0.28).toLocaleString()} kg CO2e / year**.`;
      }

      let flightsDesc = "";
      const flightsEmission = (transport.shortFlights * 220) + (transport.longFlights * 900);
      if (flightsEmission > 0) {
        flightsDesc = `* **Aviation Footprint:** Your **${transport.shortFlights} short-haul** and **${transport.longFlights} long-haul** flights generate **${flightsEmission.toLocaleString()} kg CO2e / year**. 
  * *Tip:* High-altitude combustion is particularly warming. Try combining trips, opting for high-speed trains for travel under 4 hours, or offsetting residual flights via certified programs like Gold Standard.`;
      } else {
        flightsDesc = `* **No Aviation Footprint:** Having 0 annual flights keeps your travel emissions remarkably low. Stellar!`;
      }

      return `### 🚗 Personalized Green Transportation Playbook

Your travel and transit patterns currently generate **${transBase.toLocaleString()} kg CO2e / year** (representing **${Math.round((result.transport / (result.total || 1)) * 100)}%** of your profile). Let's review your options:

${vehicleDesc}

${flightsDesc}

*Actionable Next Step:* Next time you plan an errand, try combining multiple stops into a single, optimized circular navigation path to cut dry car miles.`;
    }

    // 4. energy, gas & Electricity trigger
    if (msg.includes("home") || msg.includes("energy") || msg.includes("gas") || msg.includes("electricity") || msg.includes("solar") || msg.includes("insulate") || msg.includes("heating") || msg.includes("utility")) {
      const homeBase = result.homeEnergy;
      
      let electricityDesc = "";
      if (energy.hasSolarOnGrid) {
        electricityDesc = `* **Active Solar Grid:** Excellent! Having grid-tied solar panels already credits a massive **80% discount** on your electricity emissions!`;
      } else {
        const potentialSolarSavings = Math.round((energy.useCost ? (energy.electricityCost / 0.16) : energy.electricityKwh) * 12 * 0.39 * 0.8);
        electricityDesc = `* **Grid Electricity Use:** Your electricity demand generates home greenhouse emissions.
  * *Upgrade to Solar:* Installing a residential grid-tied solar system would save you roughly **${potentialSolarSavings.toLocaleString()} kg CO2e / year**.
  * *Opt-in to Green Power:* Increasing your Clean Energy Mix (currently at **${energy.cleanEnergyMix}%**) to **100%** using community-backed green billing programs would immediately wipe out remaining electricity carbon, saving **${Math.round(homeBase * (1 - (energy.cleanEnergyMix / 100)))} kg CO2e / year** instantly without high installation costs!`;
      }

      let heatingDesc = "";
      const heatingEmissions = Math.round(energy.gasTherms * 12 * 5.3);
      if (heatingEmissions > 0) {
        heatingDesc = `* **Heating Gas Footprint:** Consuming **${energy.gasTherms} therms / month** of natural gas produces **${heatingEmissions.toLocaleString()} kg CO2e / year**.
  * *Insulation & Shell Sealing:* Sealing attic or floor drafts and upgrading double-glazing window seals can cut heating loads by up to **15%**, saving **${Math.round(heatingEmissions * 0.15)} kg / year**.
  * *Smart Thermostat:* Lowering your temperature setting by just 2°F during winter nights can drop your gas bill and carbon load by **10%** (~**${Math.round(heatingEmissions * 0.1)} kg / year**).`;
      } else {
        heatingDesc = `* **Zero Heating Gas:** Amazing! You have no climate gas burning load.`;
      }

      return `### ⚡ Personalized Residential Energy Audit

Your home utility settings generate **${homeBase.toLocaleString()} kg CO2e / year** (representing **${Math.round((result.homeEnergy / (result.total || 1)) * 100)}%** of your carbon footprint). Here are your high-leverage thermal pathways:

${electricityDesc}

${heatingDesc}

*Efficiency Tip:* Shift major laundry load drying runs to early mornings or late evenings and clean lint filters regularly. This simple habit keeps appliance motors running cool and light.`;
    }

    // 5. waste & Compost trigger
    if (msg.includes("compost") || msg.includes("waste") || msg.includes("garbage") || msg.includes("recycle") || msg.includes("trash")) {
      const wasteBase = result.waste;
      
      const compostDesc = waste.compostFood
        ? `* **Organic Composting:** Fantastic! By composting your food scraps, you are actively diverting organic fertilizer from landfill decomposition and preventing **70 kg CO2e / year** of atmospheric methane.`
        : `* **Initiate Food Composting:** You are currently not composting dining scraps. Setting up a kitchen organic composter cuts composting offsets of **70 kg CO2e / year** and feeds local garden soil!`;

      // Find unchecked recycling items
      const recyclingList: string[] = [];
      if (!waste.recyclePaper) recyclingList.push("📰 Paper & Cardboard (saves **40 kg / year**)");
      if (!waste.recyclePlastic) recyclingList.push("🏺 Plastics (saves **50 kg / year**)");
      if (!waste.recycleGlass) recyclingList.push("🍷 Glass bottles (saves **30 kg / year**)");
      if (!waste.recycleMetal) recyclingList.push("🥫 Aluminum/Metals (saves **60 kg / year**)");

      let recyclingDesc = "";
      if (recyclingList.length === 0) {
        recyclingDesc = `* **Full Circular Recycling:** Superb! You are actively checking all recycling streams available, earning a total offset of **180 kg CO2e / year**!`;
      } else {
        recyclingDesc = `* **Recycling Improvement Channels:** You can harvest additional easy offsets by opting-in and sorting these household recycling streams:
  ${recyclingList.map(item => `  * Enable ${item}`).join("\n")}`;
      }

      return `### 🗑️ Personalized Household Waste Strategy

Your waste disposal profile generates **${wasteBase.toLocaleString()} kg CO2e / year** (representing **${Math.round((result.waste / (result.total || 1)) * 100)}%** of your profile). Let's review your circular loops:

${compostDesc}

${recyclingDesc}

*Zero-Waste Tip:* Try placing a reusable shopping tote in your car trunk or main backpack so you never have to compile single-use plastic bags when grocery hunting!`;
    }

    // 6. Offsets trigger
    if (msg.includes("offset") || msg.includes("residual") || msg.includes("neutral") || msg.includes("carbon-neutral")) {
      const costLow = Math.round(result.total / 1000 * 15);
      const costHigh = Math.round(result.total / 1000 * 25);
      
      return `### 🍃 Guide to Offsetting Your Residual Carbon

Your current total carbon footprint stands at **${totalTons} metric tons CO2e / year**. While active reduction is always the primary priority, you can offset your remaining emissions through verified environmental programs:

1. **How Offsetting Works:** You fund certified climate projects (such as reforestation, community clean cookstove distributions, or farm methane capturing) that actively reduce or capture equivalent emissions.
2. **Gold Standard & VCS:** Always look for credits backed by rigorous third-party registries like **Gold Standard** or **Verra (VCS)** to ensure high-additionality and real permanent sequestration.
3. **Financial Estimation:** Purchasing high-caliber carbon offsets typical trades at **$15 to $25 per metric ton**.
   * To achieve a certified carbon-neutral lifestyle, neutralizing your residual **${totalTons} tons** would cost roughly **$${costLow} to $${costHigh} annually**.
4. **Reduction Over Offsetting:** Buying offsets should never be a license to emit. It is a complementary final step after maximizing home-thermostat adjustments, diet switches, and green transit choices!`;
    }

    // Default response
    return `### 🍃 CarbonLeaf Sustainability Coaching

Hello! I have reviewed your current carbon parameters:
* **Annual Carbon Load:** **${totalTons} metric tons CO2e / year** (Paris Limit Target: **2.00 tons**)
* **Active Status Class:** **${this.calculateLocalAnalysis(energy, transport, diet, waste, result).carbonStatus.label}**

How would you like to proceed?
* Click **"✨ Analyze My Footprint"** below to compile a full audit scorecard!
* Ask me questions like:
  * *"How can I lower my heating gas consumption?"*
  * *"Is a vegetarian or vegan diet better for the climate?"*
  * *"What are my biggest carbon hotspots?"*
  * *"How do I offset my residual emissions?"*

I am ready to coach you through every step towards clean carbon living!`;
  }
}
