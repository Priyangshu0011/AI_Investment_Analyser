# AI Investment Research Agent (JavaScript + React JSX)

A classic full-stack AI stock analysis agent that performs deep due diligence on a company. It gathers financial fundamentals, crawls recent news/sentiment, scrapes Wall Street analyst recommendations, and processes this data through a custom-weighted scoring rubric using **LangGraph.js**, **LangChain.js**, and **Google Gemini 2.5 Flash**.

This project consists of:
1. **Frontend:** React + JavaScript (Vite)
2. **Backend:** Express.js (Node.js) with LangGraph orchestration (Pure JavaScript, no compilation required)

---

## Overview

The AI Investment Research Agent allows users to input any company name, triggers a multi-stage workflow, and streams live progress logs to a beautiful, modern React UI. The agent concludes with an explicit **INVEST** or **PASS** decision, supported by a weighted rubric and raw data inspection panels.

### Key Features
- **Deterministic Multi-Stage Agentic Workflow:** Built using a LangGraph state machine.
- **Real Data Sources:** Powered by Alpha Vantage, Finnhub, and Tavily search.
- **Structured Scoring Rubric:** Applies weighted metrics (30% Financial Health, 25% Growth, 20% News, 25% Valuation vs Peers) via Gemini Structured Outputs.
- **Event-Driven Progress Streaming:** Streams active execution status from the Express backend to the React frontend in real-time.
- **Smart In-Memory Caching:** Automatically caches company queries for 10 minutes to protect free-tier API quotas.

---

## How to Run It

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) installed on your machine.

### 2. Environment Variables
Create a `.env` file in the `/backend` folder with the following variables:
```env
GOOGLE_API_KEY=your_google_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
FINNHUB_API_KEY=your_finnhub_api_key
TAVILY_API_KEY=your_tavily_api_key
```

#### Where to get keys for free (No Credit Card required):
1. **Gemini API Key (GOOGLE_API_KEY):** Visit [Google AI Studio](https://aistudio.google.com/) and click "Get API Key".
2. **Alpha Vantage API Key:** Register at [Alpha Vantage Support](https://www.alphavantage.co/support/#api-key).
3. **Finnhub API Key:** Create a free account at [Finnhub](https://finnhub.io/register).
4. **Tavily API Key:** Register at [Tavily](https://app.tavily.com/sign-in) (provides 1,000 free searches/month).

---

### 3. Run the Backend (Express Server)

Open a terminal window and navigate to the `backend` folder:
```bash
cd backend
npm install
npm run dev
```
The server runs natively using standard Node and nodemon on **`http://localhost:5050`**.

---

### 4. Run the Frontend (React Client)

Open a second terminal window and navigate to the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser to view the website.

---

## How It Works (Architecture Explanation)

To explain this in a job interview, use this clear, plain-English summary of the tech stack and workflow:

### Key AI Agent Concepts
- **State (Memory):** In LangGraph, the agent's memory is stored in a central "State" object (`AgentState`). Instead of nested, hard-to-maintain function arguments, every node in our graph receives the State, updates a piece of it (e.g., updates `newsData`), and returns the update. LangGraph automatically merges these updates.
- **Nodes (Thought Steps):** A Node is a distinct function representing a single step of the agent. We have 6 nodes: Input Ticker Resolution, Financials Fetching, Analyst Recommendations Fetching, News Scraping, Data Synthesis, and Final Decision.
- **Edges (Workflow Flow):** Edges define how the agent transitions from node to node. Our graph uses a strict, sequential pipeline:
  `START` ➔ `Input` ➔ `Financials` ➔ `Analyst` ➔ `News` ➔ `SynthesisStep` ➔ `Decision` ➔ `END`.
- **Tools vs Direct API Call:** In typical apps, developers write code to call APIs. In AI Agent frameworks, we wrap APIs as "Tools" by defining their input schemas (using Zod) and describing what they do in plain English. The LLM can read this schema and decide when and how to call the tool. For safety and predictability, our graph calls the tools programmatically inside designated nodes.

---

## Key Decisions & Trade-offs

1. **React + Express Split Architecture**
   - **Decision:** Built as a separated React frontend (Vite) and Express backend.
   - **Trade-off:** Standard full-stack separation of concerns. The backend manages LangGraph state, LLM API communication, and credentials securely. The React frontend focuses entirely on rendering state, handling layouts, and making fetch requests. We enabled CORS on the backend using the Express `cors` middleware to allow safe cross-origin communication.
2. **Line-Separated JSON Stream via Event-Stream**
   - **Decision:** Used Node `Response.write()` stream on Express to write JSON lines as each LangGraph node completes execution.
   - **Trade-off:** Standard API calls block the UI for 10–15 seconds, creating a bad user experience. Streaming updates live from `agentGraph.stream()` keeps the user engaged by showing exactly what step is currently running.
3. **Pure JavaScript Stack**
   - **Decision:** Exclusively used standard JavaScript (`.js` and `.jsx`) for both frontend and backend.
   - **Trade-off:** TypeScript introduces compilation complexity (tsconfig, ts-node build steps) which can cause runtime crashes on different local Node environments. Standard JavaScript runs instantly and natively, making it extremely lightweight (< 100MB) and very easy to explain in interviews.
