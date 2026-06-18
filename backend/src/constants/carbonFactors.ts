/**
 * Carbon emission factors based on EPA (Environmental Protection Agency) and IPCC estimates.
 * All factors translate raw activity metrics to kilograms of CO2 equivalent (kg CO2e).
 */
export const CARBON_FACTORS = {
  ELECTRICITY_KG_CO2_PER_KWH: 0.39,
  GAS_KG_CO2_PER_THERM: 5.3,
  SOLAR_MULTIPLIER: 0.20,
  CAR_FUEL_KG_CO2_PER_MILE: {
    gasoline: 0.404,
    diesel: 0.380,
    hybrid: 0.200,
    electric: 0.100,
    none: 0.000,
  },
  PUBLIC_TRANSIT_KG_CO2_PER_MILE: 0.14,
  FLIGHT_SHORT_HAUL_KG_CO2: 220,
  FLIGHT_LONG_HAUL_KG_CO2: 900,
  DIET_BASE_KG_CO2_PER_YEAR: {
    "meat-heavy": 3200,
    "average": 2200,
    "pescatarian": 1700,
    "vegetarian": 1400,
    "vegan": 1000,
  },
  FOOD_WASTE_ADJUSTMENT: {
    low: -180,
    average: 0,
    high: 280,
  },
  BUY_LOCAL_MULTIPLIER: 0.90,
  WASTE_BASE_KG_CO2_PER_YEAR: {
    low: 300,
    average: 500,
    high: 800,
  },
  RECYCLING_OFFSETS: {
    recyclePaper: 40,
    recyclePlastic: 50,
    recycleGlass: 30,
    recycleMetal: 60,
    compostFood: 70,
  },
  ANNUAL_TARGET_LIMIT_KG: 2000,
  AVERAGE_ELECTRICITY_PRICE_PER_KWH: 0.16,
};
