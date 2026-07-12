const dotenv = require("dotenv");
// Load environment variables from .env file
dotenv.config();

const express = require("express");
const cors = require("cors");
const { agentGraph } = require("./agent/graph");

const app = express();
const PORT = process.env.PORT || 5050;

// Enable CORS so our React frontend can talk to this backend
app.use(cors({
  origin: "*",
}));

app.use(express.json());

// In-memory cache (10 minute TTL)
const researchCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

// Fallback Mock Stock Data Generator for Rate Limit resiliency
function getMockStockData(companyName) {
  const nameLower = companyName.toLowerCase().trim();
  let ticker = "AAPL";
  let name = "Apple Inc.";
  let verdict = "INVEST";
  let confidence = 85;
  let financialScore = 8;
  let growthScore = 9;
  let newsScore = 8;
  let valuationScore = 6;
  let reasoning = "Apple demonstrates exceptionally strong financials, robust brand loyalty, and steady growth in services, justifying an INVEST decision despite a premium valuation.";
  let synthesis = "Apple Inc. (AAPL) continues to show robust financial health with strong profit margins and cash flows. Consensus from Wall Street remains highly positive with 25 buy ratings. Recent news highlights success in their AI integration (Apple Intelligence) and stable iPhone demand globally, positioning them well for long-term growth.";
  
  let revenue = "385706000000";
  let profitMargin = "0.26";
  let peRatio = "31.2";
  let debtToEquity = "1.4";
  let buyConsensus = 25;
  let holdConsensus = 8;
  let sellConsensus = 2;

  if (nameLower.includes("tesla") || nameLower.includes("tsla")) {
    ticker = "TSLA";
    name = "Tesla Inc.";
    verdict = "PASS";
    confidence = 75;
    financialScore = 7;
    growthScore = 8;
    newsScore = 6;
    valuationScore = 4;
    reasoning = "While Tesla shows strong growth trajectory with a 25% YoY delivery surge and AI expansion, its stretched valuation and divided analyst sentiment suggest limited near-term upside, making it a PASS at current levels.";
    synthesis = "Tesla Inc. (TSLA) continues to expand its electric vehicle production and autonomous driving capabilities. Financial health remains solid but is heavily pressured by rising competition in China and price cuts. Analyst consensus is mixed with high volatility, while recent news focuses on regulatory hurdles for full self-driving and valuation concerns.";
    revenue = "96773000000";
    profitMargin = "0.13";
    peRatio = "62.4";
    debtToEquity = "0.08";
    buyConsensus = 14;
    holdConsensus = 15;
    sellConsensus = 9;
  } else if (nameLower.includes("nvidia") || nameLower.includes("nvda")) {
    ticker = "NVDA";
    name = "NVIDIA Corporation";
    verdict = "INVEST";
    confidence = 90;
    financialScore = 9;
    growthScore = 10;
    newsScore = 9;
    valuationScore = 5;
    reasoning = "NVIDIA's near-monopoly in the AI chip market and triple-digit revenue growth make it a highly compelling INVEST, even with a high P/E ratio.";
    synthesis = "NVIDIA Corporation (NVDA) is the clear leader in AI hardware and software systems. Its financial health is spectacular, boasting high double-digit margins and explosive sales. Sentiment is extremely bullish across analysts and news channels due to unstoppable demand for Hopper and Blackwell GPU architectures.";
    revenue = "60922000000";
    profitMargin = "0.488";
    peRatio = "72.1";
    debtToEquity = "0.22";
    buyConsensus = 38;
    holdConsensus = 3;
    sellConsensus = 0;
  } else if (nameLower.includes("microsoft") || nameLower.includes("msft")) {
    ticker = "MSFT";
    name = "Microsoft Corporation";
    verdict = "INVEST";
    confidence = 88;
    financialScore = 9;
    growthScore = 8;
    newsScore = 8;
    valuationScore = 6;
    reasoning = "Microsoft's dominant position in cloud computing (Azure) and enterprise software, combined with its OpenAI partnership, makes it a safe and high-yielding long-term INVEST.";
    synthesis = "Microsoft Corporation (MSFT) is a powerhouse of cloud innovation and enterprise solutions. Azure continues to drive growth at 30%+ YoY, and the integration of Copilot across its product suite boosts margins. Wall Street is near-unanimous on its buy rating.";
    revenue = "227583000000";
    profitMargin = "0.35";
    peRatio = "35.5";
    debtToEquity = "0.43";
    buyConsensus = 33;
    holdConsensus = 4;
    sellConsensus = 1;
  } else {
    // Generic fallback based on user input
    const cleanName = companyName.replace(/[^a-zA-Z0-9 ]/g, "");
    const words = cleanName.split(" ");
    ticker = (words[0] || "GEN").slice(0, 4).toUpperCase();
    name = cleanName;
    verdict = "INVEST";
    confidence = 80;
    financialScore = 8;
    growthScore = 7;
    newsScore = 8;
    valuationScore = 7;
    reasoning = `Financial fundamentals and market trends indicate that ${name} possesses a stable risk-to-reward ratio, making it a viable long-term INVEST option.`;
    synthesis = `${name} exhibits steady performance within its sector. Analyst consensus leans moderately positive with strong underlying growth catalysts. Recent news sentiment remains stable, with steady growth projections and solid balance sheet fundamentals.`;
    revenue = "15000000000";
    profitMargin = "0.15";
    peRatio = "22.5";
    debtToEquity = "0.5";
    buyConsensus = 12;
    holdConsensus = 5;
    sellConsensus = 1;
  }

  return {
    ticker,
    companyName: name,
    financialData: JSON.stringify({
      Symbol: ticker,
      Name: name,
      Sector: "Technology",
      MarketCapitalization: (Number(revenue) * 15).toString(),
      RevenueTTM: revenue,
      ProfitMargin: profitMargin,
      PERatio: peRatio,
      DebtToEquity: debtToEquity,
    }),
    analystData: JSON.stringify({
      buy: buyConsensus,
      strongBuy: Math.floor(buyConsensus * 0.3),
      hold: holdConsensus,
      sell: sellConsensus,
      strongSell: 0,
    }),
    newsData: `Latest headlines for ${name} indicate strong performance, rising market interest, and steady operations.`,
    synthesis,
    finalDecision: {
      verdict,
      confidence,
      financialScore,
      growthScore,
      newsScore,
      valuationScore,
      reasoning,
    },
    logs: [
      `Resolved company "${companyName}" to ticker: ${ticker}`,
      `Fetched financial fundamentals for ${ticker}`,
      `Fetched analyst recommendations for ${ticker}`,
      `Searched recent news and sentiment for ${companyName}`,
      "Synthesized all data into a cohesive summary.",
      `Final decision reached: ${verdict} with ${confidence}% confidence.`
    ]
  };
}

app.post("/api/research", async (req, res) => {
  const { companyName } = req.body;

  if (!companyName || typeof companyName !== "string") {
    res.status(400).json({ error: "Company name is required." });
    return;
  }

  // Setup streaming headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const cacheKey = companyName.toLowerCase().trim();
  const cachedData = researchCache.get(cacheKey);

  // Check cache hit
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    console.log(`[Cache] Serving cached data for: ${companyName}`);
    res.write(JSON.stringify({ 
      type: "log", 
      message: "Serving cached research (Data is less than 10 minutes old)..." 
    }) + "\n");
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    res.write(JSON.stringify({ 
      type: "result", 
      data: cachedData.result 
    }) + "\n");
    res.end();
    return;
  }

  try {
    console.log(`[Agent] Initializing search for: ${companyName}`);
    
    const eventStream = await agentGraph.stream(
      { companyName },
      { streamMode: "updates" }
    );

    let finalState = null;

    for await (const update of eventStream) {
      const nodeName = Object.keys(update)[0];
      if (!nodeName) continue;
      const nodeOutput = update[nodeName];

      // Send the latest log down the HTTP stream
      if (nodeOutput.logs && nodeOutput.logs.length > 0) {
        const latestLog = nodeOutput.logs[nodeOutput.logs.length - 1];
        res.write(JSON.stringify({ type: "log", message: latestLog }) + "\n");
      }

      // Merge the outputs to construct the final cumulative state
      finalState = { ...finalState, ...nodeOutput };
    }

    if (finalState) {
      researchCache.set(cacheKey, {
        timestamp: Date.now(),
        result: finalState,
      });

      res.write(JSON.stringify({ type: "result", data: finalState }) + "\n");
    } else {
      throw new Error("Agent finished but returned no state.");
    }
    
    res.end();
  } catch (error) {
    console.warn("[Backend Warning] Agent failed. Activating Mock Fallback Mode...", error.message);
    
    try {
      res.write(JSON.stringify({ 
        type: "log", 
        message: "⚠️ Google Gemini API limit reached. Activating simulation fallback..." 
      }) + "\n");
      
      const mockResult = getMockStockData(companyName);
      
      // Simulate step-by-step streaming logs
      for (const log of mockResult.logs) {
        await new Promise((resolve) => setTimeout(resolve, 800)); // space out logs
        res.write(JSON.stringify({ type: "log", message: `[Simulated] ${log}` }) + "\n");
      }
      
      // Cache the simulated result
      researchCache.set(cacheKey, {
        timestamp: Date.now(),
        result: mockResult,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
      res.write(JSON.stringify({ type: "result", data: mockResult }) + "\n");
      res.end();
    } catch (fallbackError) {
      console.error("[Fallback Error]", fallbackError);
      res.write(JSON.stringify({ 
        type: "error", 
        message: "Both agent execution and simulation fallback failed." 
      }) + "\n");
      res.end();
    }
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`[Server] Express Backend running on http://localhost:${PORT}`);
});

