# 🍃 CarbonLeaf Tracker & Sustainability Advisor

> High-fidelity Carbon Footprint Calculator & Fail-safe intelligent AI Counselor. Deployed as a modern React front-end and a secure modular Node/Express/TypeScript backend.

[![Test Suite Status](https://img.shields.io/badge/Tests-5%20Passed-emerald?style=flat-square)](https://github.com/tharsigamanivathanan/CarbonLeaf-Tracker)
[![Framework](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-blue?style=flat-square)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node%20%2B%20Express%20%2B%20TS-darkgreen?style=flat-square)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 📅 Project Overview

**CarbonLeaf Tracker** is a production-grade, full-stack application designed to track personal greenhouse gas emissions and formulate direct offset action plans. It implements strict **EPA (Environmental Protection Agency)** and **IPCC** carbon formulation factors, matching residential grid metrics, fuel engine classes, and agricultural supply chains.

The platform includes **Carbon Leaf AI Advisor**, a secure chat counselor proxy. Crucially, the system features a **Climate Logic Engine (Offline Fallback)** which automatically intercepts API quota limits (429s, missing keys, network timeouts) to deliver high-fidelity, customized sustainability guides locally without showing ugly raw errors or breaking the chat flow.

---

## 🎨 System Architecture Diagram

```
                 +---------------------------------------+
                 |            CLIENT BROWSER            |
                 |      (Host: Vercel / Client SPA)      |
                 +-------------------+-------------------+
                                     |
                                     |  HTTP POST
                                     v
                 +-------------------+-------------------+
                 |      SECURED NODE/EXPRESS PROXY       |
                 |      (Host: Render / API Engine)      |
                 +----+-----------------------------+----+
                      |                             |
                      |  If API Key Valid           |  If Quota Throttled / Offline
                      v                             v
       +--------------+--------------+     +--------+--------------------+
       |      GEMINI NEURAL API      |     | LOCAL SUSTAINABILITY ENGINE |
       |     (gemini-2.0-flash)      |     |  (Contextual Heuristics)    |
       +-----------------------------+     +-----------------------------+
```

---

## ✨ Features

* **Real-time EPA Footprint Calculator:** Interactive sliders mapping Electricity (Kwh vs Spends), Solar grids, Clean utility mix, Travel engine classes (gasoline, diesel, hybrid, EV), flight frequencies, dietary waste, and paper/glass/cardboard recycling streams.
* **Consistent Twilight Dark Palette:** A beautiful, fully accessible, high-contrast dark visual theme leveraging negative space, glowing emerald accents, and responsive layout transitions.
* **Bulletproof Quota Protection:** A robust dual-track recommendation router (Cloud Gemini AI + local heuristic generator) ensuring zero connection errors or system blockages.
* **Input Validation & Sanitization:** Strict request payload sanitization bounding values (e.g. clean mix capped at 100%) and defaulting rogue parameters gracefully.
* **Sliding Window Rate Limiter:** Built-in in-memory DOS/DDoS mitigation restricting traffic vectors automatically.

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, Tailwind CSS, Motion (Animations), Lucide React (Icons).
* **Backend:** Node.js, Express, TypeScript, Google Gen AI SDK (`@google/genai`).
* **Testing:** Standalone TS-driven unit, service, validation, and exceptional mock fallback test suite.

---

## ⚙️ Environment Variables

Copy `.env.example` in both target repository targets:

```env
# Google Developer Console API credentials
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Selected Gemini model runner (defaults to gemini-2.0-flash)
GEMINI_MODEL=gemini-2.0-flash

# Backend Proxy URL (used by Vercel Frontend Client)
VITE_BACKEND_URL=https://carbonleaf-backend.onrender.com
```

---

## 📘 Secure API Documentation

All request payloads contain standard client inputs mapped directly to the `CalculationInput` schema:

### 1. Unified Schema Payload Structure (`CalculationInput`)
```json
{
  "energy": {
    "electricityKwh": 450,
    "electricityCost": 75,
    "useCost": false,
    "gasTherms": 22,
    "hasSolarOnGrid": false,
    "cleanEnergyMix": 25
  },
  "transport": {
    "carMiles": 600,
    "carType": "gasoline",
    "publicTransitMiles": 120,
    "shortFlights": 2,
    "longFlights": 1
  },
  "diet": {
    "dietType": "average",
    "foodWaste": "average",
    "buyLocal": true
  },
  "waste": {
    "wasteLevel": "average",
    "recyclePaper": true,
    "recyclePlastic": true,
    "recycleGlass": false,
    "recycleMetal": true,
    "compostFood": false
  }
}
```

### 2. Endpoints Reference

#### `GET /api/health`
Check backend server status.
* **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Modular secured CarbonLeaf Tracker Backend is fully active!",
    "timestamp": "2026-06-18T14:15:20Z"
  }
  ```

#### `POST /api/carbon/calculate`
Calculates annual carbon footprint (CO2 equivalent in kg).
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "result": {
      "homeEnergy": 2106,
      "transport": 3968,
      "diet": 1980,
      "waste": 350,
      "total": 8404
    }
  }
  ```

#### `POST /api/carbon/analyze`
Generates comprehensive analysis including localized status category, letter grade, and active carbon hotspots.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "analysis": {
      "carbonStatus": { "label": "Elevated Emissions", "grade": "D" },
      "hotspots": [
        { "category": "Transport Tailpipes", "description": "Driving a non-hybrid highway commute contributes heavily...", "impactPercent": 48 }
      ],
      "recommendations": [
        { "title": "Transition to EV Commuting", "description": "Electric vehicle commutes...", "expectedSavingsKg": 2100, "difficulty": "hard" }
      ],
      "goalPlan": {
        "timeframe": "3 Months",
        "milestones": [
          { "action": "Month 1: Opt-in to community solar mix", "expectedEmissionsAfter": 7200 }
        ]
      },
      "isAiGenerated": true
    }
  }
  ```

#### `POST /api/carbon/recommendations`
Return focused reduction actions sorted by carbon weight savings.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "recommendations": [ ... ],
    "isAiGenerated": false
  }
  ```

#### `POST /api/carbon/goal-plan`
Returns a 3-month reduction milestones guide.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "goalPlan": { ... },
    "isAiGenerated": true
  }
  ```

---

## 🚀 Deployment Instructions

### Back-end on Render
1. Register/Log in to **Render.com** and click **New + > Web Service**.
2. Connect your GitHub repository.
3. Configure the following service defaults:
   * **Root Directory:** `backend`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
4. Under **Environment Variables**, add:
   * `GEMINI_API_KEY` = `your_secret_api_key`
5. Click **Deploy Web Service** and note your deployment URL (e.g. `https://carbonleaf-srv.onrender.com`).

### Front-end on Vercel
1. Log in to **Vercel.com** and click **Add New > Project**.
2. Select your cloned repository.
3. Keep the Root Directory as standard `./`.
4. Under **Environment Variables**, configure:
   * `VITE_BACKEND_URL` = `https://carbonleaf-srv.onrender.com`
5. Click **Deploy**!

---

## 🧪 Testing Instructions

Execute backend test suites covering unit assertions, services, validators, and exception fallbacks instantly.

```bash
# Navigate to backend and initiate test suite runner
cd backend
npm run test
```

---

## 📌 Climate Core Assumptions

1. **Grid Electricity Pricing:** Average energy spending conversion rates default to **$0.16/kWh** (US grid mean). Clean Energy Mix slider applies a direct proportion subtraction modifier from residual baseline grids.
2. **Solar Panel Grid Offset:** Active solar arrays discount the calculated consumer residential energy weight by **80%** (20% power multipliers offset).
3. **Food Freight Weight Reduction:** Local farm source flags discount overall dietary agricultural outputs by **10%** representing transit delivery carbon savings.
