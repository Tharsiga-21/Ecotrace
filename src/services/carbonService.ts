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
  /**
   * Calculates the carbon footprint from user states based on EPA factors.
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
      
    let annualElectricityKwh = electricityKwh * 12;
    let electricityCo2 = annualElectricityKwh * CARBON_FACTORS.ELECTRICITY_KG_CO2_PER_KWH;
    
    if (energy.hasSolarOnGrid) {
      electricityCo2 *= CARBON_FACTORS.SOLAR_MULTIPLIER;
    } else if (energy.cleanEnergyMix > 0) {
      electricityCo2 *= (1 - energy.cleanEnergyMix / 100);
    }
    
    let gasCo2 = energy.gasTherms * 12 * CARBON_FACTORS.GAS_KG_CO2_PER_THERM;
    let homeEnergyTotal = Math.max(0, electricityCo2 + gasCo2);

    // 2. Transport Calculation
    let carMilesAnnual = transport.carMiles * 12;
    let carCo2 = 0;
    
    const carTypeFactor = CARBON_FACTORS.CAR_FUEL_KG_CO2_PER_MILE[transport.carType] ?? 0;
    carCo2 = carMilesAnnual * carTypeFactor;
    
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

    // 5. Total summation
    let total = homeEnergyTotal + transportTotal + dietFinal + wasteFinal;

    return {
      homeEnergy: Math.round(homeEnergyTotal),
      transport: Math.round(transportTotal),
      diet: Math.round(dietFinal),
      waste: Math.round(wasteFinal),
      total: Math.round(total)
    };
  }

  /**
   * Highly granular, context-aware LOCAL fallback engine for carbon emissions analysis.
   * Generates extremely useful, personalized recommendations in case the AI API has exhausted its quota.
   */
  public static generateLocalAnalysis(
    energy: HomeEnergyState,
    transport: TransportState,
    diet: DietState,
    waste: WasteState,
    result: FootprintResult
  ): CarbonAnalysisResponse {
    const totalTons = Number((result.total / 1000).toFixed(2));
    
    // Evaluate status
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

    // Identify hotspots
    const hotspots: { category: string; description: string; impactPercent: number }[] = [];
    const total = result.total || 1;
    
    const hPct = Math.round((result.homeEnergy / total) * 100);
    const tPct = Math.round((result.transport / total) * 100);
    const dPct = Math.round((result.diet / total) * 100);
    const wPct = Math.round((result.waste / total) * 100);

    // Dynamic Hotspot Evaluation
    if (result.homeEnergy > 1500) {
      hotspots.push({
        category: "Home Energy",
        description: `Utility systems are producing significant load (${result.homeEnergy.toLocaleString()} kg/yr). High reliance on non-renewable grid mixes or active natural gas heaters is holding you back from a lower footprint grade.`,
        impactPercent: hPct
      });
    }

    if (transport.carMiles > 500 && (transport.carType === "gasoline" || transport.carType === "diesel")) {
      hotspots.push({
        category: "Private Transit",
        description: `Commuting ${transport.carMiles} miles per month in a ${transport.carType} vehicle is a massive carbon hotspot, producing roughly ${Math.round(transport.carMiles * 12 * (CARBON_FACTORS.CAR_FUEL_KG_CO2_PER_MILE[transport.carType])).toLocaleString()} kg/CO2 annually. Shifting parameters here holds the highest potential leverage.`,
        impactPercent: tPct
      });
    }

    if (transport.longFlights > 0 || transport.shortFlights > 2) {
      hotspots.push({
        category: "Aviation/Flight emissions",
        description: `Air travel frequency compiles heavy high-altitude greenhouse multipliers. Your short-haul/long-haul flight count contributes highly (${Math.round((transport.shortFlights * 220) + (transport.longFlights * 900)).toLocaleString()} kg/yr).`,
        impactPercent: tPct
      });
    }

    if (diet.dietType === "meat-heavy" || diet.dietType === "average") {
      hotspots.push({
        category: "Dietary Habits",
        description: `Sourcing agricultural meat products (especially red meat) produces high upstream greenhouse loads compared to plant-based proteins. Diet contributes ${dPct}% of your grand total emissions.`,
        impactPercent: dPct
      });
    }

    // Default ensure at least two hotspots are returned using values
    if (hotspots.length < 2) {
      // Pick highest percentage contributors
      const categoriesList = [
        { name: "Home Utilities", val: result.homeEnergy, pct: hPct, desc: "Residential heating, electricity consumption, and cooling power." },
        { name: "Transportation", val: result.transport, pct: tPct, desc: "Aviation fuel burning and private gasoline highway commutes." },
        { name: "Dietary Source", val: result.diet, pct: dPct, desc: "Agricultural supply chains, animal raising, and transport food miles." },
        { name: "Waste Disposal", val: result.waste, pct: wPct, desc: "Landfill organic breakdown, decomposing food leftovers, and trash volume." }
      ].sort((a, b) => b.val - a.val);

      hotspots.push({
        category: categoriesList[0].name,
        description: `${categoriesList[0].desc} This constitutes your #1 absolute biggest emission node at ${categoriesList[0].pct}% of your profile.`,
        impactPercent: categoriesList[0].pct
      });

      hotspots.push({
        category: categoriesList[1].name,
        description: `${categoriesList[1].desc} This is your #2 contributor, representing ${categoriesList[1].pct}% of your overall carbon impact.`,
        impactPercent: categoriesList[1].pct
      });
    }

    // Formulate targeted recommendations
    const recommendations: { title: string; description: string; expectedSavingsKg: number; difficulty: "easy" | "medium" | "hard" }[] = [];

    // Category Based Expert Local Rules
    if (energy.cleanEnergyMix < 80 && !energy.hasSolarOnGrid) {
      recommendations.push({
        title: "Subscribe to Community Solar or Clean Power Mix",
        description: "Switch your utility billing profile to a certified 100% renewable electricity program. Many local distributors offer green plans where power is sourced exclusively via solar/wind.",
        expectedSavingsKg: Math.round(result.homeEnergy * 0.4),
        difficulty: "easy"
      });
    }

    if (transport.carType === "gasoline" || transport.carType === "diesel") {
      recommendations.push({
        title: "Transition to Hybrid / Full EV Commuting",
        description: "Upgrading to a highly efficient hybrid or battery-electric vehicle directly slashes transportation carbon by 50% to 75%. Over a year, this saves thousands of greenhouse kilograms.",
        expectedSavingsKg: Math.round(result.transport * 0.6),
        difficulty: "hard"
      });
    }

    if (transport.carMiles > 300) {
      recommendations.push({
        title: "Shift 1 or 2 Commuting Days to Public Transit",
        description: "Utilizing subways, passenger trains or clean buses twice a week reduces single-occupant highway tailpipe emissions heavily.",
        expectedSavingsKg: Math.round(transport.carMiles * 12 * 0.2),
        difficulty: "medium"
      });
    }

    if (diet.dietType === "meat-heavy" || diet.dietType === "average") {
      recommendations.push({
        title: "Commit to regular 'Meatless Mondays'",
        description: "Replacing animal-derived meats with rich vegetable recipes just one day per week helps cut agricultural climate footprint by roughly 12% to 15% annually.",
        expectedSavingsKg: Math.round(result.diet * 0.15),
        difficulty: "easy"
      });
    }

    if (diet.foodWaste === "high" || diet.foodWaste === "average") {
      recommendations.push({
        title: "Improve Meal Planning & Food Storage",
        description: "Plan standard recipes ahead of shopping runs and utilize proper vacuum/refrigerated storage. Minimizing organic garbage rot keeps massive landfill methane emissions out of the atmosphere.",
        expectedSavingsKg: 150,
        difficulty: "easy"
      });
    }

    if (!waste.compostFood) {
      recommendations.push({
        title: "Establish a Kitchen Scraps Composting Bin",
        description: "Redirecting organic discards into garden composting rather than airtight trash landfills eliminates localized methane gas generation.",
        expectedSavingsKg: 100,
        difficulty: "medium"
      });
    }

    // Default ensures at least three rich recommendations of varying difficulty are presented
    while (recommendations.length < 3) {
      recommendations.push({
        title: "Unplug Idle Phantom Electronics & Smart Power Strips",
        description: "Televisions, displays, chargers, and modems consume passive voltage even when turned off. Unplug them or use smart cut-out timers.",
        expectedSavingsKg: 50,
        difficulty: "easy"
      });
    }

    // Sort to prioritize highest expected carbon savings
    recommendations.sort((a, b) => b.expectedSavingsKg - a.expectedSavingsKg);

    // Formulate a structured 3-Month Action milestone plan
    const goalPlan = {
      timeframe: "3 Months to Climate Action",
      milestones: [
        {
          action: "Month 1: Quick Wins (Opt-in to Green Power mix billing, enable full food composting, and adjust thermostat temperature ±2°F)",
          expectedEmissionsAfter: Math.round(result.total - 300)
        },
        {
          action: "Month 2: Commuting Shifts (Combine physical errands, transition 25% of vehicle mileage to train/bus transit or cycling, and execute 3 Meatless days per week)",
          expectedEmissionsAfter: Math.round(result.total - 800)
        },
        {
          action: "Month 3: Investment Phase (Perform full home attic sealing/insulation reviews, audit heating gas efficiency, or evaluate EV hybrid commuting options)",
          expectedEmissionsAfter: Math.round(Math.max(1200, result.total - 1800))
        }
      ]
    };

    return {
      carbonStatus: {
        label: statusLabel,
        grade: statusGrade
      },
      hotspots,
      recommendations: recommendations.slice(0, 3), // Return top 3 highly relevant recommendations
      goalPlan,
      generationTimestamp: new Date().toISOString(),
      isAiGenerated: false
    };
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
}
