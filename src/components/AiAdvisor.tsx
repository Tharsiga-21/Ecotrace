import React, { useState, useRef, useEffect } from "react";
import { Send, Leaf, Sparkles, User, AlertCircle, RefreshCw, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage, FootprintResult, HomeEnergyState, TransportState, DietState, WasteState } from "../types";
import { compileAdvisorPrompt } from "../utils";
import { CarbonService } from "../services/carbonService";
import { CARBON_FACTORS } from "../constants/carbonFactors";

interface AiAdvisorProps {
  energy: HomeEnergyState;
  transport: TransportState;
  diet: DietState;
  waste: WasteState;
  calculationResult: FootprintResult;
}

export default function AiAdvisor({
  energy,
  transport,
  diet,
  waste,
  calculationResult,
}: AiAdvisorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      parts: [
        {
          text: `🌱 **Welcome to your Carbon AI Advisor!** 

I am your climate assistant, ready to help you analyze your footprint and make concrete, eco-friendly plans.

Here's how I can assist you:
* **Footprint Audit:** Click the **"✨ Analyze My Footprint"** button below to auto-compile your calculator inputs into a clean report.
* **Green Transit Guidance:** Ask me questions like *"How do hybrid and electric vehicles compare in terms of life-cycle carbon?"*
* **Home Energy Savings:** Ask *"What are the most cost-effective ways to insulate my home and lower gas consumption?"*
* **Climate Action:** Ask *"How can I start composting at home easily?"*

How can I help you live count-carbon lighter today?`
        },
      ],
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatically scroll messages to the bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Sends message to the secure Express proxy
  async function sendMessage(textToSend: string) {
    if (!textToSend.trim() || isSending) return;

    setErrorStatus(null);
    setIsSending(true);

    // 1. Create client-side message representation
    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ text: textToSend }],
    };

    // Update message log immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    try {
      // Choose target URL: Reads VITE_BACKEND_URL for their direct Render deployment, or falls back to local /api/chat in AI Studio
      const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || "";
      const endpointUrl = `${backendBaseUrl}/api/chat`;

      console.log(`[AI Advisor] Posting prompt to: ${endpointUrl}`);

      // We maintain the conversational history to feed Gemini for continuity
      const queryHistory = messages.map((m) => ({
        role: m.role,
        parts: m.parts,
      }));

      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          history: queryHistory,
          currentProfile: {
            input: { energy, transport, diet, waste },
            result: calculationResult
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON html content");
      }

      const data = await response.json();

      // 2. Append the model raw text response to chat logs
      if (data.text) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            parts: [{ text: data.text }],
          },
        ]);
      } else {
        throw new Error("Invalid response keys from the proxy.");
      }
    } catch (error: any) {
      console.warn("[Communications fallback] Running local-first Client Climate Engine due to server error:", error?.message || error);
      
      const promptLower = textToSend.toLowerCase();
      let fallbackText = "";

      // Check if it's an auto-analysis request
      if (promptLower.includes("personalized carbon profile") || promptLower.includes("carbon profile") || promptLower.includes("analyze my footprint") || promptLower.includes("sustainability report")) {
        const localAnalysis = CarbonService.generateLocalAnalysis(energy, transport, diet, waste, calculationResult);
        fallbackText = CarbonService.compileLocalAdvisorMarkdown(localAnalysis, calculationResult);
      } else {
        // Run a simple, highly customized client-side responder matching the backend one
        fallbackText = generateLocalClientAdvisorResponse(textToSend, energy, transport, diet, waste, calculationResult);
      }

      // Append client-side fallback response to conversation logs
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          parts: [{ text: fallbackText }],
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  // Pre-compile the user's questionnaire results and submit as a prompt
  const handleAutoAnalysis = () => {
    const compiledPrompt = compileAdvisorPrompt(energy, transport, diet, waste, calculationResult);
    sendMessage(compiledPrompt);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  return (
    <div className="flex flex-col h-[600px] border border-[#2a2a2c] rounded-2xl bg-[#161618] shadow-xs overflow-hidden" id="advisor-panel">
      {/* Advisor Header */}
      <div className="p-4 bg-[#1e1e21] border-b border-[#2a2a2c] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#10b981]/10 rounded-lg border border-[#10b981]/20">
            <Sparkles className="w-5 h-5 text-[#10b981]" />
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-wide text-neutral-100">Carbon AI Advisor</h3>
            <span className="text-xs text-[#71717a] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
              Secure Express Proxy
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm("Reset current chat conversation history?")) {
              setMessages([
                {
                  role: "model",
                  parts: [
                    {
                      text: "🌿 Conversation restarted. Ask me any sustainability or carbon offsetting questions, or tap '✨ Analyze My Footprint' for a review of your scores!"
                    }
                  ],
                },
              ]);
              setErrorStatus(null);
            }
          }}
          className="text-[#71717a] hover:text-white hover:bg-[#2a2a2c] p-2 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
          title="Clear chat history"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#10b981]" />
          Reset Chat
        </button>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0b]/40">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isModel = msg.role === "model";
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 max-w-[85%] ${isModel ? "self-start" : "ml-auto flex-row-reverse"}`}
              >
                {/* Icon Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    isModel ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20" : "bg-[#2a2a2c] text-neutral-300 border-[#3a3a3c]"
                  }`}
                >
                  {isModel ? <Leaf className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble Content */}
                <div
                  className={`rounded-2xl p-3.5 text-sm leading-relaxed ${
                    isModel
                      ? "bg-[#1e1e21] text-[#e4e4e7] border border-[#2a2a2c]"
                      : "bg-[#10b981]/15 text-emerald-400 border border-[#10b981]/25 text-right ml-auto"
                  }`}
                >
                  {/* Markdown or plain rendering */}
                  <div className="whitespace-pre-wrap select-text markdown-rendering text-left">
                    {msg.parts.map((part) => {
                      const lines = part.text.split("\n");
                      return lines.map((line, lIdx) => {
                        if (line.startsWith("### ")) {
                          return <h4 key={lIdx} className="font-bold text-[#10b981] mt-3 mb-1 text-sm uppercase tracking-wide">{line.replace("### ", "")}</h4>;
                        }
                        if (line.startsWith("## ")) {
                          return <h3 key={lIdx} className="font-bold text-neutral-100 mt-4 mb-2 text-base">{line.replace("## ", "")}</h3>;
                        }
                        if (line.startsWith("* ") || line.startsWith("- ")) {
                          return (
                            <div key={lIdx} className="flex gap-2 pl-2 my-0.5">
                              <span className="text-[#10b981]">•</span>
                              <span className="text-[#a1a1aa]">{line.substring(2)}</span>
                            </div>
                          );
                        }
                        // Render bold sections inside line
                        const boldRegex = /\*\*(.*?)\*\*/g;
                        if (boldRegex.test(line)) {
                          const elements = [];
                          let lastIndex = 0;
                          let match;
                          boldRegex.lastIndex = 0;
                          while ((match = boldRegex.exec(line)) !== null) {
                            if (match.index > lastIndex) {
                              elements.push(line.substring(lastIndex, match.index));
                            }
                            elements.push(<strong key={match.index} className="font-semibold text-neutral-100">{match[1]}</strong>);
                            lastIndex = boldRegex.lastIndex;
                          }
                          if (lastIndex < line.length) {
                            elements.push(line.substring(lastIndex));
                          }
                          return <p key={lIdx} className="mb-1 text-[#a1a1aa]">{elements}</p>;
                        }
                        return <p key={lIdx} className="mb-1 text-[#a1a1aa]">{line}</p>;
                      });
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {isSending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 max-w-[85%] self-start"
            >
              <div className="w-8 h-8 rounded-full bg-[#10b981]/15 border border-[#10b981]/25 text-[#10b981] flex items-center justify-center shrink-0">
                <Leaf className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-[#1e1e21] text-[#71717a] border border-[#2a2a2c] rounded-2xl p-4 text-xs font-mono flex items-center gap-2 shadow-xs">
                <span className="flex space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                <span>Advisor is auditing and drafting strategy...</span>
              </div>
            </motion.div>
          )}

          {errorStatus && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-red-950/20 text-rose-400 border border-rose-500/10 rounded-xl flex items-start gap-2.5 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Connection Error</p>
                <p className="opacity-80 mt-0.5">{errorStatus}</p>
                <button
                  onClick={() => setErrorStatus(null)}
                  className="mt-1.5 font-semibold text-rose-300 underline hover:text-rose-100 block"
                >
                  Dismiss error
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Buttons */}
      <div className="px-4 py-2 bg-[#1e1e21] border-t border-[#2a2a2c] flex flex-wrap gap-2 items-center">
        <span className="text-xs text-[#71717a] flex items-center gap-1 font-medium mr-1 select-none">
          <MessageSquare className="w-3 h-3 text-[#10b981]" /> Quick Prompts:
        </span>
        <button
          onClick={handleAutoAnalysis}
          className="text-xs bg-[#10b981] text-[#0a0a0b] hover:bg-[#059669] px-3 py-1.5 rounded-full font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-[#0a0a0b]" />
          ✨ Analyze My Footprint
        </button>
        <button
          onClick={() => sendMessage("What are a few highly effective ways I can offset my residual home emissions?")}
          className="text-xs bg-[#2a2a2c] text-[#e4e4e7] hover:bg-[#343437] border border-[#3e3e42] px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer"
        >
          Offset Residual Emissions
        </button>
        <button
          onClick={() => sendMessage("How does shifting to a vegan or vegetarian diet impact climate emissions?")}
          className="text-xs bg-[#2a2a2c] text-[#e4e4e7] hover:bg-[#343437] border border-[#3e3e42] px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer"
        >
          Diet Impact
        </button>
      </div>

      {/* Chat Form Footer */}
      <form onSubmit={handleFormSubmit} className="p-3 bg-[#1e1e21] border-t border-[#2a2a2c] flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isSending}
          placeholder="Ask your secure Carbon AI Advisor about green living..."
          className="flex-1 bg-[#0a0a0b] border border-[#2a2a2c] focus:border-[#10b981] focus:bg-[#0a0a0b]/80 focus:outline-hidden rounded-xl px-4 py-2.5 text-sm transition-all text-[#e4e4e7] placeholder-[#71717a]"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-3 bg-[#10b981] hover:bg-[#059669] hover:scale-[1.02] active:scale-[0.98] disabled:bg-[#2a2a2c] disabled:scale-100 disabled:text-neutral-500 text-[#0a0a0b] rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center cursor-pointer font-bold"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

/**
 * Client-side premium offline advisor response compiler.
 * Translates active user questionnaire and question parameters into gorgeous, math-perfect sustainability reviews.
 */
function generateLocalClientAdvisorResponse(
  message: string,
  energy: HomeEnergyState,
  transport: TransportState,
  diet: DietState,
  waste: WasteState,
  result: FootprintResult
): string {
  const msg = message.toLowerCase();
  const totalTons = (result.total / 1000).toFixed(2);
  
  // 1. Diet & Food Impact response
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

  // 2. Travel & Transit response
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

  // 3. Residential Utilities response
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

  // 4. Solid Waste response
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

  // 5. Offsets response
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

  // 6. Generic prompt response
  return `### 🍃 CarbonLeaf Sustainability Coaching

Hello! I have reviewed your current carbon parameters:
* **Annual Carbon Load:** **${totalTons} metric tons CO2e / year** (Paris Limit Target: **2.00 tons**)
* **Active Status Class:** **${CarbonService.generateLocalAnalysis(energy, transport, diet, waste, result).carbonStatus.label}**

How would you like to proceed?
* Click **"✨ Analyze My Footprint"** below to compile a full audit scorecard!
* Ask me questions like:
  * *"How can I lower my heating gas consumption?"*
  * *"Is a vegetarian or vegan diet better for the climate?"*
  * *"What are my biggest carbon hotspots?"*
  * *"How do I offset my residual emissions?"*

I am ready to coach you through every step towards clean carbon living!`;
}
