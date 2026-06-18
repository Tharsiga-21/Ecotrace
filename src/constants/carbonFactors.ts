/**
 * Carbon emission factors based on EPA (Environmental Protection Agency) and IPCC estimates.
 * All factors translate raw activity metrics to kilograms of CO2 equivalent (kg CO2e).
 */
export const CARBON_FACTORS = {
  // Electricity average emission factor: 0.39 kg CO2 per kWh
  ELECTRICITY_KG_CO2_PER_KWH: 0.39,
  
  // Natural gas average emission factor: 5.3 kg CO2 per therm
  GAS_KG_CO2_PER_THERM: 5.3,

  // Solar reduction factor (e.g. 80% reduction in electric impact)
  SOLAR_MULTIPLIER: 0.20,

  // Car emission factors per mile based on fuel engine class
  CAR_FUEL_KG_CO2_PER_MILE: {
    gasoline: 0.404,
    diesel: 0.380,
    hybrid: 0.200,
    electric: 0.100,
    none: 0.000,
  },

  // Public transit average: 0.14 kg CO2 per passenger mile (train/bus mix)
  PUBLIC_TRANSIT_KG_CO2_PER_MILE: 0.14,

  // Average flight leg emissions (including radiative forcing estimation)
  FLIGHT_SHORT_HAUL_KG_CO2: 220, // < 3 hours
  FLIGHT_LONG_HAUL_KG_CO2: 900,  // International / long-range

  // Annual agricultural & production CO2 impact based on dietary selection
  DIET_BASE_KG_CO2_PER_YEAR: {
    "meat-heavy": 3200,
    "average": 2200,
    "pescatarian": 1700,
    "vegetarian": 1400,
    "vegan": 1000,
  },

  // Adjustments for organic spoilage behaviors
  FOOD_WASTE_ADJUSTMENT: {
    low: -180,
    average: 0,
    high: 280,
  },

  // Buying local food multiplier reduction discount (10% savings)
  BUY_LOCAL_MULTIPLIER: 0.90,

  // Direct trash landfill methane/emissions baseline representation
  WASTE_BASE_KG_CO2_PER_YEAR: {
    low: 300,
    average: 500,
    high: 800,
  },

  // Savings offsets for standard materials recycling (subtracts from waste base)
  RECYCLING_OFFSETS: {
    recyclePaper: 40,
    recyclePlastic: 50,
    recycleGlass: 30,
    recycleMetal: 60,
    compostFood: 70,
  },

  // Climate target thresholds (Paris Climate Agreement personal cap of 2.0 metric tons)
  ANNUAL_TARGET_LIMIT_KG: 2000, 
  AVERAGE_ELECTRICITY_PRICE_PER_KWH: 0.16, // used to estimate kWh from expense dollars
};
