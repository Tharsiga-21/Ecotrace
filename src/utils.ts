import { 
  HomeEnergyState, 
  TransportState, 
  DietState, 
  WasteState, 
  FootprintResult 
} from "./types/index";
import { CarbonService } from "./services/carbonService";

export function calculateFootprint(
  energy: HomeEnergyState,
  transport: TransportState,
  diet: DietState,
  waste: WasteState
): FootprintResult {
  return CarbonService.calculateFootprint(energy, transport, diet, waste);
}

export function compileAdvisorPrompt(
  energy: HomeEnergyState,
  transport: TransportState,
  diet: DietState,
  waste: WasteState,
  result: FootprintResult
): string {
  const electricityDesc = energy.useCost 
    ? `$${energy.electricityCost}/month` 
    : `${energy.electricityKwh} kWh/month`;
    
  const solarDesc = energy.hasSolarOnGrid ? "Yes (Grid-tied Solar Panel system)" : "No";
  
  const formattedResults = `
Carbon Footprint Overview:
- Home Energy Emissions: ${result.homeEnergy.toLocaleString()} kg CO2e/year
- Transportation Emissions: ${result.transport.toLocaleString()} kg CO2e/year
- Diet Emissions: ${result.diet.toLocaleString()} kg CO2e/year
- Waste & Garbage Emissions: ${result.waste.toLocaleString()} kg CO2e/year
- GRAND TOTAL: ${(result.total / 1000).toFixed(2)} metric tons (or ${result.total.toLocaleString()} kg) CO2e/year.

The user's input specifications:
1. Home Energy:
   - Electricity: ${electricityDesc}
   - Solar: ${solarDesc}
   - Green clean mix: ${energy.cleanEnergyMix}%
   - Heating Gas: ${energy.gasTherms} therms/month

2. Transport:
   - Vehicle: Monthly car mileage ${transport.carMiles} miles with a ${transport.carType} vehicle
   - Transit: Public transit ${transport.publicTransitMiles} miles/month
   - Aviation: ${transport.shortFlights} short flights and ${transport.longFlights} long flights annually

3. Diet:
   - Meal type: Preferring a ${diet.dietType} diet
   - Food waste habits: ${diet.foodWaste} level
   - Local sourcing: ${diet.buyLocal ? "Yes regularly" : "No rarely"}

4. Solid Waste:
   - Household Trash volume: ${waste.wasteLevel}
   - Recycling: Recycles Paper: ${waste.recyclePaper ? "Yes" : "No"}, Plastic: ${waste.recyclePlastic ? "Yes" : "No"}, Glass: ${waste.recycleGlass ? "Yes" : "No"}, Metal: ${waste.recycleMetal ? "Yes" : "No"}
   - Organic Composting: ${waste.compostFood ? "Yes" : "No"}`;

  return `Here is my current personalized Carbon Profile calculations:
${formattedResults}

Please give me a brief, highly personalized sustainability report. 
Outline:
1. A quick review of my carbon footprint grade relative to the climate target (which is below 2.0 metric tons).
2. The 2 biggest "carbon hotspots" in my layout or lifestyle options and why they generate so much impact.
3. A bulleted checklist of exactly 3 highly effective and specific actions I can adopt this week to start slashing my emissions. Give expected carbon savings for each if possible.`;
}
