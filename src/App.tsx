import React, { useState, useMemo } from "react";
import { 
  Flame, 
  Car, 
  Utensils, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  ExternalLink, 
  HelpCircle, 
  Info, 
  Globe, 
  Tv, 
  Zap, 
  Plane, 
  CheckCircle,
  Copy,
  Terminal,
  ShieldCheck,
  Server,
  CloudLightning
} from "lucide-react";
import { 
  HomeEnergyState, 
  TransportState, 
  DietState, 
  WasteState,
  FootprintResult 
} from "./types";
import { calculateFootprint } from "./utils";
import AiAdvisor from "./components/AiAdvisor";

export default function App() {
  // 1. Core Calculator inputs configured with standard defaults
  const [energyState, setEnergyState] = useState<HomeEnergyState>({
    electricityKwh: 450,
    electricityCost: 75,
    useCost: false,
    gasTherms: 22,
    hasSolarOnGrid: false,
    cleanEnergyMix: 25,
  });

  const [transportState, setTransportState] = useState<TransportState>({
    carMiles: 600,
    carType: "gasoline",
    publicTransitMiles: 120,
    shortFlights: 2,
    longFlights: 1,
  });

  const [dietState, setDietState] = useState<DietState>({
    dietType: "average",
    foodWaste: "average",
    buyLocal: true,
  });

  const [wasteState, setWasteState] = useState<WasteState>({
    wasteLevel: "average",
    recyclePaper: true,
    recyclePlastic: true,
    recycleGlass: false,
    recycleMetal: true,
    compostFood: false,
  });

  // Calculate the carbon footprint on state change
  const footprintResult = useMemo(() => {
    return calculateFootprint(energyState, transportState, dietState, wasteState);
  }, [energyState, transportState, dietState, wasteState]);

  // Tab systems for input panels
  const [activeTab, setActiveTab] = useState<"energy" | "transport" | "diet" | "waste">("energy");
  
  // UI helpers
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showDeployGuide, setShowDeployGuide] = useState(false);
  const [backendUrlInput, setBackendUrlInput] = useState(import.meta.env.VITE_BACKEND_URL || "");

  // Cumulative annual footprint in metric tons
  const footprintTons = (footprintResult.total / 1000).toFixed(2);
  const targetTons = 2.0; // IPCC goal limit per capita per year
  const variancePercent = Math.round(((footprintResult.total - 2000) / 2000) * 100);

  // Dynamic status evaluation
  const carbonStatus = useMemo(() => {
    const tons = Number(footprintTons);
    if (tons <= 2.0) return { label: "Excellent", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (tons <= 5.0) return { label: "Moderate", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" };
    return { label: "High Impact", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
  }, [footprintTons]);

  // Find the highest contributor
  const primarySource = useMemo(() => {
    const { homeEnergy, transport, diet, waste } = footprintResult;
    const maxVal = Math.max(homeEnergy, transport, diet, waste);
    if (maxVal === homeEnergy) return { name: "Home Utilities", color: "text-amber-400" };
    if (maxVal === transport) return { name: "Transportation", color: "text-sky-400" };
    if (maxVal === diet) return { name: "Dietary Choice", color: "text-emerald-400" };
    return { name: "Household Waste", color: "text-orange-400" };
  }, [footprintResult]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e4e4e7] p-4 md:p-8 flex flex-col justify-between" id="app-root">
      
      {/* 1. Header Area conforming to the exact visual style specs */}
      <header className="flex flex-col sm:flex-row gap-4 justify-between items-center pb-6 mb-6 border-b border-[#2a2a2c]" id="app-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#10b981] rounded-lg flex items-center justify-center text-[#0a0a0b] font-extrabold text-xl">
            C
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              CarbonLeaf <span className="text-[#71717a] font-normal leading-none">Tracker</span>
            </h1>
            <p className="text-xs text-[#71717a] mt-0.5">Active Sustainability Calculator & Secured Advisor Dashboard</p>
          </div>
        </div>

        {/* Live Network & Deployment Tags */}
        <div className="flex flex-wrap gap-2.5 items-center justify-end text-xs">
          <div className="px-3 py-1.5 rounded-full border border-[#2a2a2c] bg-[#161618] flex items-center gap-2 text-[#71717a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
            Vercel Frontend
          </div>

          <div className="px-3 py-1.5 rounded-full border border-[#2a2a2c] bg-[#161618] flex items-center gap-2 text-[#71717a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
            Render Backend
          </div>

          <div className="px-3 py-1.5 rounded-full border border-[#10b981]/25 bg-emerald-900/10 flex items-center gap-2 text-[#10b981] font-mono">
            🎛️ gemini-2.0-flash
          </div>

          <button
            onClick={() => setShowDeployGuide(true)}
            className="px-3 py-1.5 rounded-lg bg-[#2a2a2c] hover:bg-[#343437] text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#10b981]" />
            Deployment Manual
          </button>
        </div>
      </header>

      {/* 2. Top Overview Widgets Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="metric-grid">
        {/* Metric 1: Current Annual Footprint */}
        <div className="bg-[#161618] border border-[#2a2a2c] rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#71717a] font-semibold tracking-wider uppercase block mb-1">
              Annual Footprint
            </span>
            <div className="text-2xl md:text-3xl font-light text-[#e4e4e7] flex items-baseline gap-1.5">
              <span>{footprintTons}</span>
              <span className="text-xs font-medium text-[#71717a]">tons CO2e</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-[#71717a] flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-neutral-500" />
            {(footprintResult.total).toLocaleString()} kg calculated
          </div>
        </div>

        {/* Metric 2: Net Target Variance */}
        <div className="bg-[#161618] border border-[#2a2a2c] rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#71717a] font-semibold tracking-wider uppercase block mb-1">
              Global Safe Target
            </span>
            <div className="text-2xl md:text-3xl font-light text-[#e4e4e7] flex items-baseline gap-1.5">
              <span>{targetTons.toFixed(1)}</span>
              <span className="text-xs font-medium text-[#71717a]">tons CO2e</span>
            </div>
          </div>
          <div className={`mt-3 text-[11px] font-medium flex items-center gap-1`}>
            {variancePercent > 0 ? (
              <span className="text-rose-400">+{variancePercent}% over IPCC standard limit</span>
            ) : (
              <span className="text-emerald-400">{Math.abs(variancePercent)}% lower than baseline limit</span>
            )}
          </div>
        </div>

        {/* Metric 3: Grade Label */}
        <div className="bg-[#161618] border border-[#2a2a2c] rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#71717a] font-semibold tracking-wider uppercase block mb-1">
              Carbon Impact Status
            </span>
            <div className="text-2xl md:text-3xl font-normal text-[#e4e4e7]">
              <span className={`px-2.5 py-0.5 rounded-md text-sm border font-medium ${carbonStatus.color}`}>
                {carbonStatus.label}
              </span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-[#71717a]">
            Based on Paris Climate Accords
          </div>
        </div>

        {/* Metric 4: Primary Component */}
        <div className="bg-[#161618] border border-[#2a2a2c] rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#71717a] font-semibold tracking-wider uppercase block mb-1">
              Primary Contributor
            </span>
            <div className="text-xl md:text-2xl font-semibold text-[#e4e4e7] truncate mt-1">
              {primarySource.name}
            </div>
          </div>
          <div className="mt-3 text-[11px] text-[#71717a] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            Requires targeting adjustments
          </div>
        </div>
      </div>

      {/* 3. Main Split Panel: Form Inputs & Dynamic Chart on Left, Secured AI Coach on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start" id="main-splits">
        
        {/* Left Side: Parameters Tab Form & Dynamic Visual Charts (7 columns) */}
        <div className="xl:col-span-7 flex flex-col gap-6" id="left-workspace">
          
          {/* Carbon Calculator Input Workspace Box */}
          <div className="bg-[#161618] border border-[#2a2a2c] rounded-2xl overflow-hidden shadow-xs">
            
            {/* Form Section Header with Tabs */}
            <div className="p-4 bg-[#1e1e21] border-b border-[#2a2a2c] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-semibold text-sm tracking-wide text-neutral-100 flex items-center gap-2">
                  <CloudLightning className="w-4 h-4 text-[#10b981]" />
                  Household Carbon Parameters
                </h3>
                <p className="text-xs text-[#71717a]">Adjust sliders and toggles below to calculate emissions in real-time</p>
              </div>
              
              {/* Tab Navigation buttons */}
              <div className="flex border border-[#2a2a2c] rounded-lg p-0.5 bg-[#0a0a0b] w-full sm:w-auto overflow-x-auto self-stretch sm:self-auto">
                <button
                  onClick={() => setActiveTab("energy")}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    activeTab === "energy" ? "bg-[#10b981] text-[#0a0a0b]" : "text-[#71717a] hover:text-[#e4e4e7]"
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  Energy
                </button>
                <button
                  onClick={() => setActiveTab("transport")}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    activeTab === "transport" ? "bg-[#10b981] text-[#0a0a0b]" : "text-[#71717a] hover:text-[#e4e4e7]"
                  }`}
                >
                  <Car className="w-3 h-3" />
                  Transit
                </button>
                <button
                  onClick={() => setActiveTab("diet")}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    activeTab === "diet" ? "bg-[#10b981] text-[#0a0a0b]" : "text-[#71717a] hover:text-[#e4e4e7]"
                  }`}
                >
                  <Utensils className="w-3 h-3" />
                  Diet
                </button>
                <button
                  onClick={() => setActiveTab("waste")}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    activeTab === "waste" ? "bg-[#10b981] text-[#0a0a0b]" : "text-[#71717a] hover:text-[#e4e4e7]"
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                  Waste
                </button>
              </div>
            </div>

            {/* Tab Form Areas */}
            <div className="p-6">
              {/* Tab 1: Home Energy Form */}
              {activeTab === "energy" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex justify-between items-center bg-[#0a0a0b]/40 p-3 rounded-xl border border-[#2a2a2c]">
                    <div>
                      <span className="text-xs font-semibold text-[#e4e4e7]">Calculate by Monthly Spend?</span>
                      <p className="text-[11px] text-[#71717a]">Converts currency to carbon weight recursively</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={energyState.useCost} 
                        onChange={(e) => setEnergyState({...energyState, useCost: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-[#2a2a2c] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-[#10b981]"></div>
                    </label>
                  </div>

                  {energyState.useCost ? (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <label className="text-[#71717a] font-medium">Electricity Spend ($ / month)</label>
                        <span className="text-[#10b981] font-semibold">${energyState.electricityCost}</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="400" 
                        step="5"
                        value={energyState.electricityCost} 
                        onChange={(e) => setEnergyState({...energyState, electricityCost: Number(e.target.value)})}
                        className="w-full accent-[#10b981]" 
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <label className="text-[#71717a] font-medium">Electricity Consumption (kWh / month)</label>
                        <span className="text-[#10b981] font-semibold">{energyState.electricityKwh} kWh</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="2000" 
                        step="10"
                        value={energyState.electricityKwh} 
                        onChange={(e) => setEnergyState({...energyState, electricityKwh: Number(e.target.value)})}
                        className="w-full accent-[#10b981]" 
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label className="text-[#71717a] font-medium">Heating Natural Gas (Therms / month)</label>
                      <span className="text-[#10b981] font-semibold">{energyState.gasTherms} therms</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="150" 
                      step="2"
                      value={energyState.gasTherms} 
                      onChange={(e) => setEnergyState({...energyState, gasTherms: Number(e.target.value)})}
                      className="w-full accent-[#10b981]" 
                    />
                  </div>

                  <div className="border-t border-[#2a2a2c]/60 pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-semibold text-[#e4e4e7]">Active Solar Panels (Grid-Tied)</span>
                        <p className="text-[11px] text-[#71717a]">Credits an 80% solar offset on house electricity footprint</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={energyState.hasSolarOnGrid} 
                          onChange={(e) => setEnergyState({...energyState, hasSolarOnGrid: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-[#2a2a2c] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-[#10b981]"></div>
                      </label>
                    </div>

                    {!energyState.hasSolarOnGrid && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <label className="text-[#71717a] font-medium">Community Green Power Mix (%)</label>
                          <span className="text-[#10b981] font-semibold">{energyState.cleanEnergyMix}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          step="5"
                          value={energyState.cleanEnergyMix} 
                          onChange={(e) => setEnergyState({...energyState, cleanEnergyMix: Number(e.target.value)})}
                          className="w-full accent-[#10b981]" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Transport Form */}
              {activeTab === "transport" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#71717a] mb-1.5">Personal Car Engine Type</label>
                      <select 
                        value={transportState.carType} 
                        onChange={(e: any) => setTransportState({...transportState, carType: e.target.value})}
                        className="w-full bg-[#0a0a0b] border border-[#2a2a2c] text-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#10b981]"
                      >
                        <option value="gasoline">Gasoline Engine</option>
                        <option value="diesel">Diesel Engine</option>
                        <option value="hybrid">Hybrid Engine</option>
                        <option value="electric">Electric (EV)</option>
                        <option value="none">No Private Vehicle</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#71717a] mb-1.5">Public Transit (Train / Bus)</label>
                      <select 
                        value={transportState.publicTransitMiles} 
                        onChange={(e: any) => setTransportState({...transportState, publicTransitMiles: Number(e.target.value)})}
                        className="w-full bg-[#0a0a0b] border border-[#2a2a2c] text-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#10b981]"
                      >
                        <option value="0">No Transit Use</option>
                        <option value="50">Minimal (50 mi/mo)</option>
                        <option value="120">Average (120 mi/mo)</option>
                        <option value="300">Moderate Commute (300 mi/mo)</option>
                        <option value="750">Heavy Transit (750 mi/mo)</option>
                      </select>
                    </div>
                  </div>

                  {transportState.carType !== "none" && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <label className="text-[#71717a] font-medium">Monthly Driving Distance (miles)</label>
                        <span className="text-[#10b981] font-semibold">{transportState.carMiles} miles</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="3000" 
                        step="50"
                        value={transportState.carMiles} 
                        onChange={(e) => setTransportState({...transportState, carMiles: Number(e.target.value)})}
                        className="w-full accent-[#10b981]" 
                      />
                    </div>
                  )}

                  <div className="border-t border-[#2a2a2c]/60 pt-4 space-y-4">
                    <span className="text-xs font-semibold text-[#e4e4e7] block mb-2">Annual Flight Frequencies</span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <label className="text-[#71717a] font-medium flex items-center gap-1">
                            <Plane className="w-3 h-3" />
                            Short flights (&lt;3 hours)
                          </label>
                          <span className="text-[#10b981] font-semibold">{transportState.shortFlights}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="15" 
                          step="1"
                          value={transportState.shortFlights} 
                          onChange={(e) => setTransportState({...transportState, shortFlights: Number(e.target.value)})}
                          className="w-full accent-[#10b981]" 
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <label className="text-[#71717a] font-medium flex items-center gap-1">
                            <Plane className="w-3 h-3 text-emerald-400" />
                            Long flights (International)
                          </label>
                          <span className="text-[#10b981] font-semibold">{transportState.longFlights}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="8" 
                          step="1"
                          value={transportState.longFlights} 
                          onChange={(e) => setTransportState({...transportState, longFlights: Number(e.target.value)})}
                          className="w-full accent-[#10b981]" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Diet & Food Form */}
              {activeTab === "diet" && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-medium text-[#71717a] mb-1.5">Dietary Profile Selector</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { key: "meat-heavy", label: "🥩 High Meat", desc: "Constant beef, pork" },
                        { key: "average", label: "🍗 Balanced", desc: "Moderate meat, dairy" },
                        { key: "pescatarian", label: "🐟 Pescatarian", desc: "Fish, dairy, veg" },
                        { key: "vegetarian", label: "🥚 Vegetarian", desc: "Dairy/eggs, no meat" },
                        { key: "vegan", label: "🌱 Full Vegan", desc: "100% plant sourced" }
                      ].map((d) => (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => setDietState({...dietState, dietType: d.key as any})}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            dietState.dietType === d.key 
                              ? "bg-[#10b981]/10 border-[#10b981] text-white" 
                              : "bg-[#0a0a0b] border-[#2a2a2c] text-[#71717a] hover:border-neutral-500 hover:text-[#e4e4e7]"
                          }`}
                        >
                          <span className="font-semibold text-xs block">{d.label}</span>
                          <span className="text-[10px] opacity-75 mt-0.5 block">{d.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#71717a] mb-1.5">Household Food Waste Tendency</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: "low", label: "Low Waste", sub: "Eat all leftovers" },
                        { key: "average", label: "Standard", sub: "Occasional spoilage" },
                        { key: "high", label: "Noticeable", sub: "Frequent trash binning" }
                      ].map((w) => (
                        <button
                          key={w.key}
                          type="button"
                          onClick={() => setDietState({...dietState, foodWaste: w.key as any})}
                          className={`p-3 rounded-xl border text-center cursor-pointer transition-colors ${
                            dietState.foodWaste === w.key 
                              ? "bg-[#10b981]/10 border-[#10b981] text-white font-medium" 
                              : "bg-[#0a0a0b] border-[#2a2a2c] text-[#71717a] hover:text-[#e4e4e7]"
                          }`}
                        >
                          <span className="text-xs block">{w.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-[#0a0a0b]/40 p-4 rounded-xl border border-[#2a2a2c]">
                    <div>
                      <span className="text-xs font-semibold text-[#e4e4e7] block">Prioritize Buying From Local Farms?</span>
                      <p className="text-[11px] text-[#71717a]">Reduces overall commercial food shipping distances (10% discount)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={dietState.buyLocal} 
                        onChange={(e) => setDietState({...dietState, buyLocal: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-[#2a2a2c] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-[#10b981]"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 4: Waste Form */}
              {activeTab === "waste" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-medium text-[#71717a] mb-1.5">Household Waste Volume</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: "low", label: "Minimal (1 bag/week)" },
                        { key: "average", label: "Average (2 bags/week)" },
                        { key: "high", label: "High (3+ bags/week)" }
                      ].map((v) => (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => setWasteState({...wasteState, wasteLevel: v.key as any})}
                          className={`p-3 rounded-xl border text-center cursor-pointer transition-colors ${
                            wasteState.wasteLevel === v.key 
                              ? "bg-[#10b981]/10 border-[#10b981] text-white" 
                              : "bg-[#0a0a0b] border-[#2a2a2c] text-[#71717a] hover:text-[#e4e4e7]"
                          }`}
                        >
                          <span className="text-xs">{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#2a2a2c]/60 pt-4 space-y-3">
                    <span className="text-xs font-semibold text-[#e4e4e7] block mb-2">Recycled Households Materials Checks:</span>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { key: "recyclePaper", label: "📰 Recycle Paper & Cardboard" },
                        { key: "recyclePlastic", label: "🏺 Recycle Plastics" },
                        { key: "recycleGlass", label: "🍷 Recycle Glass Bottles" },
                        { key: "recycleMetal", label: "🥫 Recycle Aluminum/Metals" }
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2.5 bg-[#0a0a0b]/45 p-2.5 rounded-xl border border-[#2a2a2c] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(wasteState as any)[item.key]}
                            onChange={(e) => setWasteState({...wasteState, [item.key]: e.target.checked})}
                            className="w-4 h-4 rounded-sm bg-[#0a0a0b] border-[#2a2a2c] text-[#10b981] focus:ring-0 accent-[#10b981]"
                          />
                          <span className="text-xs text-[#71717a] font-medium leading-none select-none">
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="flex justify-between items-center bg-[#0a0a0b]/40 p-4 rounded-xl border border-[#2a2a2c] mt-2">
                      <div>
                        <span className="text-xs font-semibold text-[#e4e4e7] block">Compost Organic Kitchen Waste?</span>
                        <p className="text-[11px] text-[#71717a]">Redirects fertilizer scraps from rotting in standard landfills</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={wasteState.compostFood} 
                          onChange={(e) => setWasteState({...wasteState, compostFood: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-[#2a2a2c] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-[#10b981]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Footprint Graphical Visual Breakdown Chart */}
          <div className="bg-[#161618] border border-[#2a2a2c] rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs text-[#71717a] font-semibold tracking-wider uppercase mb-4">
              Category Carbon Allocation
            </h3>
            
            {/* Visual Bars conforming directly to layout style */}
            <div className="space-y-4">
              {[
                { 
                  name: "Home utilities & energy", 
                  val: footprintResult.homeEnergy, 
                  pct: Math.round((footprintResult.homeEnergy / (footprintResult.total || 1)) * 100),
                  color: "bg-amber-400"
                },
                { 
                  name: "Transportation & aviation", 
                  val: footprintResult.transport, 
                  pct: Math.round((footprintResult.transport / (footprintResult.total || 1)) * 100),
                  color: "bg-sky-400"
                },
                { 
                  name: "Diet & agricultural footprints", 
                  val: footprintResult.diet, 
                  pct: Math.round((footprintResult.diet / (footprintResult.total || 1)) * 100),
                  color: "bg-emerald-400"
                },
                { 
                  name: "Waste & household landfilling", 
                  val: footprintResult.waste, 
                  pct: Math.round((footprintResult.waste / (footprintResult.total || 1)) * 100),
                  color: "bg-orange-400"
                }
              ].map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-300 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                      {item.name}
                    </span>
                    <span className="text-[#71717a] font-mono">
                      {item.val.toLocaleString()} kg/yr <strong className="text-[#e4e4e7] ml-1.5">{item.pct}%</strong>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#0a0a0b] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${Math.max(3, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-[11px] text-[#71717a] flex gap-2 items-start leading-relaxed">
              <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span>
                <strong>Carbon Reduction Target:</strong> To limit global warming under +1.5°C, climate scientific studies indicate every individual target maximum should stay below <strong>2.0 Tons (2,000 kg) CO2e/year</strong>. Adjust your parameters to discover pathways down to safety.
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Secure AI sustainability advisor calling Gemini securely via Render (5 columns) */}
        <div className="xl:col-span-5" id="right-workspace">
          <AiAdvisor 
            energy={energyState}
            transport={transportState}
            diet={dietState}
            waste={wasteState}
            calculationResult={footprintResult}
          />
        </div>
      </div>

      {/* 5. Production Environment & Interactive Target URLs settings helper */}
      <footer className="mt-8 pt-6 border-t border-[#2a2a2c] flex flex-col md:flex-row gap-4 items-center justify-between text-xs text-[#71717a]" id="app-footer">
        <div>
          &copy; {new Date().getFullYear()} CarbonLeaf Labs. Dedicated to the open climate movement.
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 bg-[#161618] border border-[#2a2a2c] px-3 py-1.5 rounded-lg">
            <span className="font-semibold">Vercel Proxy Target:</span>
            <input 
              type="text" 
              value={backendUrlInput}
              onChange={(e) => {
                setBackendUrlInput(e.target.value);
                // Dynamically support saving local developer testing changes if needed
              }}
              placeholder="e.g. https://your-server.onrender.com"
              className="bg-transparent text-emerald-400 placeholder-[#71717a] border-none outline-none text-[11px] font-mono w-44"
              title="This mirrors 'VITE_BACKEND_URL' variable on your Vercel client!"
            />
          </div>
        </div>
      </footer>

      {/* 6. FULL DEPLOYMENT OVERLAY MANUAL */}
      {showDeployGuide && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0b]/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#161618] border border-[#2a2a2c] rounded-3xl max-w-2xl w-full p-6 md:p-8 relative max-h-[85vh] overflow-y-auto">
            
            <button 
              onClick={() => setShowDeployGuide(false)}
              className="absolute top-5 right-5 text-[#71717a] hover:text-white text-lg p-2 rounded-lg hover:bg-[#2a2a2c] transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#10b981]/15 rounded-xl text-[#10b981]">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">100% Secure Production Deployment Manual</h2>
                <p className="text-xs text-[#71717a] mt-0.5">Step-by-step guideline to host Frontend on Vercel and Backend on Render</p>
              </div>
            </div>

            <div className="space-y-6 text-sm leading-relaxed text-neutral-300">
              
              {/* Architecture Explanation */}
              <div className="bg-[#0a0a0b]/50 p-4 rounded-xl border border-[#2a2a2c]">
                <h4 className="font-semibold text-[#10b981] flex items-center gap-1 text-xs uppercase tracking-wider mb-1.5">
                  🛡️ Secure Architecture Overview
                </h4>
                <p className="text-xs text-[#71717a]">
                  Instead of calling Google Gemini directly from your public Vercel browser client (which would leak your private Gemini API key to visitors), you deploy an Express.js secure backend proxy on Render. Your client browser points directly to Render, which securely intercepts calls, appends your hidden API Key, and responds with results.
                </p>
              </div>

              {/* Step 1: Backend on Render */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-neutral-100">
                  <span className="w-6 h-6 rounded-full bg-[#10b981]/10 text-[#10b981] flex items-center justify-center text-xs">1</span>
                  Deploy Backend: Node / Express to Render
                </div>
                <ol className="list-decimal pl-5 text-xs text-[#71717a] space-y-1.5">
                  <li>Log in to your <strong>Render.com</strong> dashboard and click <strong>"New + &gt; Web Service"</strong>.</li>
                  <li>Link your GitHub repository containing the projects.</li>
                  <li>Set the following values in your Render setup panel:
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-[#e4e4e7]">
                      <li><strong>Root Directory:</strong> <code className="bg-[#0a0a0b] px-1.5 py-0.5 rounded text-rose-400">backend</code> (Points exactly to our Express workspace)</li>
                      <li><strong>Build Command:</strong> <code className="bg-[#0a0a0b] px-1.5 py-0.5 rounded text-[#10b981]">npm install</code></li>
                      <li><strong>Start Command:</strong> <code className="bg-[#0a0a0b] px-1.5 py-0.5 rounded text-[#10b981]">npm start</code></li>
                    </ul>
                  </li>
                  <li>Expand the <strong>"Environment Variables"</strong> section and add:
                    <div className="bg-[#0a0a0b] p-3 rounded-xl border border-[#2a2a2c] mt-2 relative font-mono text-[11px] text-zinc-300 flex justify-between items-center">
                      <div>
                        <span className="text-[#10b981]">GEMINI_API_KEY</span> = <span className="text-amber-300">"your_actual_gemini_api_key"</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard("GEMINI_API_KEY", "render-env")}
                        className="p-1 hover:text-[#10b981] transition-colors"
                        title="Copy environment label"
                      >
                        {copiedText === "render-env" ? <span className="text-emerald-400 text-[10px]">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </li>
                  <li>Click <strong>"Deploy Web Service"</strong>. Copy your live Render URL once complete (e.g., <code className="text-cyan-400">https://your-app.onrender.com</code>).</li>
                </ol>
              </div>

              {/* Step 2: Frontend on Vercel */}
              <div className="space-y-2 border-t border-[#2a2a2c]/60 pt-4">
                <div className="flex items-center gap-2 font-semibold text-neutral-100">
                  <span className="w-6 h-6 rounded-full bg-[#10b981]/10 text-[#10b981] flex items-center justify-center text-xs">2</span>
                  Deploy Frontend: React + Vite to Vercel
                </div>
                <ol className="list-decimal pl-5 text-xs text-[#71717a] space-y-1.5">
                  <li>Log in to your <strong>Vercel.com</strong> account and select <strong>"Add New... &gt; Project"</strong>.</li>
                  <li>Select your linked GitHub repository.</li>
                  <li>Set the following values in your Vercel project panel:
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-[#e4e4e7]">
                      <li><strong>Framework Preset:</strong> <code className="bg-[#0a0a0b] px-1.5 py-0.5 rounded text-[#10b981]">Vite</code></li>
                      <li><strong>Root Directory:</strong> leave as default roof <code className="bg-[#0a0a0b] px-1.5 py-0.5 rounded">./</code></li>
                    </ul>
                  </li>
                  <li>Keep default Build and Output Settings (<code className="text-[#10b981]">npm run build</code> and <code className="text-[#10b981]">dist</code> directory are automatically parsed).</li>
                  <li>Expand the <strong>"Environment Variables"</strong> section in Vercel and add:
                    <div className="bg-[#0a0a0b] p-3 rounded-xl border border-[#2a2a2c] mt-2 relative font-mono text-[11px] text-zinc-300 flex justify-between items-center">
                      <div>
                        <span className="text-[#10b981]">VITE_BACKEND_URL</span> = <span className="text-cyan-400">"https://your-render-url-here.onrender.com"</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard("VITE_BACKEND_URL", "vercel-env")}
                        className="p-1 hover:text-[#10b981] transition-colors"
                        title="Copy variable label"
                      >
                        {copiedText === "vercel-env" ? <span className="text-emerald-400 text-[10px]">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#71717a] mt-1">⚠️ Remember: Do NOT put a trailing slash in the URL! (E.g. use <code className="text-[#e4e4e7]">https://my-api.onrender.com</code>, do NOT write <code className="text-[#e4e4e7]">https://my-api.onrender.com/</code>)</p>
                  </li>
                  <li>Click <strong>"Deploy"</strong>. Your app will build and host beautifully in less than a minute!</li>
                </ol>
              </div>

              {/* Step 3: CORS setup confirmation */}
              <div className="bg-[#0a0a0b]/35 p-3 rounded-xl border border-[#2a2a2c] text-xs text-[#71717a] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  <strong>CORS Fully Pre-configured:</strong> We already integrated the Express <code className="text-neutral-200">cors</code> library in your <code className="text-neutral-200">backend/index.js</code> code to enable Vercel to fetch smoothly without blocks.
                </span>
              </div>

            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDeployGuide(false)}
                className="px-5 py-2 rounded-xl bg-[#10b981] text-[#0a0a0b] font-semibold text-xs transition-colors hover:bg-[#0fd292] cursor-pointer"
              >
                Close Deployment Manual
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
