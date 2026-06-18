import { CarbonService } from "./src/services/carbonService";
import { validateCarbonInput } from "./src/validators/carbonValidator";

// Basic assertion helpers
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertDeepEqual(a: any, b: any, message: string) {
  const strA = JSON.stringify(a);
  const strB = JSON.stringify(b);
  if (strA !== strB) {
    throw new Error(`Assertion failed: ${message} (Expected ${strB}, got ${strA})`);
  }
}

// Global active test counter
let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => void | Promise<void>) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Reason: ${err.message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log("\n==============================================");
  console.log("🏃 STARTING CARBONLEAF TRACKER TEST SUITE");
  console.log("==============================================\n");

  // -------------------------------------------------------------
  // SECTION 1: UNIT TESTS & SERVICE TESTS (Carbon Calculations)
  // -------------------------------------------------------------
  console.log("📋 [Category: Carbon Service Calculations]");
  
  test("Basic footprint calculation matching EPA factors", () => {
    const energy = {
      electricityKwh: 350,
      electricityCost: 56,
      useCost: false,
      gasTherms: 15,
      hasSolarOnGrid: false,
      cleanEnergyMix: 0
    };
    const transport = {
      carMiles: 600,
      carType: "gasoline" as const,
      publicTransitMiles: 100,
      shortFlights: 2,
      longFlights: 1
    };
    const diet = {
      dietType: "vegan" as const,
      foodWaste: "low" as const,
      buyLocal: true
    };
    const waste = {
      wasteLevel: "low" as const,
      recyclePaper: true, 
      recyclePlastic: true,
      recycleGlass: true,
      recycleMetal: true,
      compostFood: true
    };

    const footprint = CarbonService.calculateFootprint(energy, transport, diet, waste);
    
    // Check non-negative and sane ranges
    assert(footprint.homeEnergy > 0, "Home Energy emissions should be positive");
    assert(footprint.transport > 0, "Transport emissions should be positive");
    assert(footprint.diet > 0, "Diet emissions should be positive");
    assert(footprint.waste > 0, "Waste emissions should be positive");
    assert(footprint.total === (footprint.homeEnergy + footprint.transport + footprint.diet + footprint.waste), "Toal sums up matches");
  });

  test("Solar reduction discounts home electricity load by 80%", () => {
    const energyBase = {
      electricityKwh: 500,
      electricityCost: 80,
      useCost: false,
      gasTherms: 0,
      hasSolarOnGrid: false,
      cleanEnergyMix: 0
    };
    const transport = { carMiles: 0, carType: "none" as const, publicTransitMiles: 0, shortFlights: 0, longFlights: 0 };
    const diet = { dietType: "vegan" as const, foodWaste: "low" as const, buyLocal: true };
    const waste = { wasteLevel: "low" as const, recyclePaper: false, recyclePlastic: false, recycleGlass: false, recycleMetal: false, compostFood: false };

    const baseline = CarbonService.calculateFootprint(energyBase, transport, diet, waste);
    
    const energySolar = { ...energyBase, hasSolarOnGrid: true };
    const withSolar = CarbonService.calculateFootprint(energySolar, transport, diet, waste);

    assert(withSolar.homeEnergy < baseline.homeEnergy, "Solar option should lower emissions");
    assert(Math.abs((withSolar.homeEnergy / baseline.homeEnergy) - 0.20) < 0.05, "Solar emissions should be reduced to 20% of baseline electricity");
  });

  // -------------------------------------------------------------
  // SECTION 2: RECOMMENDATION ENGINE TESTS (Local Fallback Advisor)
  // -------------------------------------------------------------
  console.log("\n📋 [Category: Real Estate Recommendation Engine]");

  test("Local advisor evaluates carbon status correctly based on tons caps", () => {
    const energy = { electricityKwh: 100, electricityCost: 15, useCost: false, gasTherms: 0, hasSolarOnGrid: true, cleanEnergyMix: 100 };
    const transport = { carMiles: 0, carType: "none" as const, publicTransitMiles: 0, shortFlights: 0, longFlights: 0 };
    const diet = { dietType: "vegan" as const, foodWaste: "low" as const, buyLocal: true };
    const waste = { wasteLevel: "low" as const, recyclePaper: true, recyclePlastic: true, recycleGlass: true, recycleMetal: true, compostFood: true };

    const lowFootprint = CarbonService.calculateFootprint(energy, transport, diet, waste);
    const lowAnalysis = CarbonService.calculateLocalAnalysis(energy, transport, diet, waste, lowFootprint);

    assert(lowAnalysis.carbonStatus.grade === "A", "Low carbon total should receive grade A");
    assert(lowAnalysis.recommendations.length >= 2, "Should return dynamic actions list");
  });

  // -------------------------------------------------------------
  // SECTION 3: VALIDATION ENGINE & SECURITY MITIGATION TESTS
  // -------------------------------------------------------------
  console.log("\n📋 [Category: Input Request Validators]");

  test("Carbon Request Validator handles bounds and filters rogue inputs", () => {
    const mockReq = {
      body: {
        energy: { electricityKwh: -50, cleanEnergyMix: 120, hasSolarOnGrid: "yes" },
        transport: { carMiles: 1000, carType: "rogue-class" },
        diet: { dietType: "meat-heavy", foodWaste: "ultra-high" },
        waste: { wasteLevel: "low" }
      }
    };
    
    let nextCalled = false;
    const mockRes = {
      status: (code: number) => {
        return { json: (obj: any) => {} };
      }
    };

    validateCarbonInput(mockReq as any, mockRes as any, () => {
      nextCalled = true;
    });

    assert(nextCalled, "Validator next transition should be triggerable");
    assert(mockReq.body.energy.electricityKwh === 0, "Negative kilowatt inputs should be bounded to 0");
    assert(mockReq.body.energy.cleanEnergyMix === 100, "Clean energy cap percentage should not exceed 100%");
    assert(mockReq.body.transport.carType === "gasoline", "Unsupported vehicle class should fallback safely to gasoline baseline");
  });

  // -------------------------------------------------------------
  // SECTION 4: EXCEPTION HANDLER & MIDDLEWARE ROBUSTNESS TESTS
  // -------------------------------------------------------------
  console.log("\n📋 [Category: Exceptional Error Handling & Robustness]");

  test("Secure AI advisor handles quota exceptions and switches smoothly to offline engine", async () => {
    const energy = { electricityKwh: 1000, electricityCost: 160, useCost: false, gasTherms: 10, hasSolarOnGrid: false, cleanEnergyMix: 0 };
    const transport = { carMiles: 2000, carType: "gasoline" as const, publicTransitMiles: 0, shortFlights: 10, longFlights: 5 };
    const diet = { dietType: "meat-heavy" as const, foodWaste: "high" as const, buyLocal: false };
    const waste = { wasteLevel: "high" as const, recyclePaper: false, recyclePlastic: false, recycleGlass: false, recycleMetal: false, compostFood: false };

    const result = CarbonService.calculateFootprint(energy, transport, diet, waste);
    
    // Test execution with a forcing endpoint name
    const reportResponse = await CarbonService.generateSecureRecommendations(
      energy, transport, diet, waste, result, "recommendations"
    );

    assert(reportResponse !== null, "Advisor response should never be null during network failures");
    assert(reportResponse.hotspots.length > 0, "Fallback analyzer must contain valid actionable checkpoints");
  });

  console.log("\n==============================================");
  console.log("🏁 TEST SUITE RUN COMPLETED");
  console.log(`📊 Result: ${passedTests} Passed | ${failedTests} Failed`);
  console.log("==============================================\n");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
