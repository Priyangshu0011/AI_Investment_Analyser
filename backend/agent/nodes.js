const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { getFinancialFundamentals } = require("../tools/alphaVantage");
const { getAnalystRecommendations } = require("../tools/finnhub");
const { getRecentNews } = require("../tools/tavily");
const { z } = require("zod");

// Gemini Model Initialization (plain JS)
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-flash-latest",
  temperature: 0,
});

// 1. INPUT NODE
const inputNode = async (state) => {
  console.log(`[Node] Input Node running for: ${state.companyName}`);
  const response = await llm.invoke([
    ["system", "You are a helpful financial assistant. The user will give you a company name. You must respond with ONLY the stock ticker symbol in uppercase. If you do not know it, respond with 'UNKNOWN'."],
    ["human", `What is the stock ticker for: ${state.companyName}?`]
  ]);

  const ticker = response.content.toString().trim().replace(/[^A-Z]/g, "");

  return {
    ticker,
    logs: [`Resolved company "${state.companyName}" to ticker: ${ticker}`]
  };
};

// 2. FINANCIAL FUNDAMENTALS NODE
const financialsNode = async (state) => {
  console.log(`[Node] Financials Node running for: ${state.ticker}`);
  if (state.ticker === "UNKNOWN" || !state.ticker) {
    return { financialData: "No ticker available to fetch financials.", logs: ["Skipped financials (No ticker)."] };
  }

  const financialData = await getFinancialFundamentals.invoke({ symbol: state.ticker });

  return {
    financialData,
    logs: [`Fetched financial fundamentals for ${state.ticker}`]
  };
};

// 3. ANALYST RECOMMENDATIONS NODE
const analystNode = async (state) => {
  console.log(`[Node] Analyst Node running for: ${state.ticker}`);
  if (state.ticker === "UNKNOWN" || !state.ticker) {
    return { analystData: "No ticker available to fetch analyst data.", logs: ["Skipped analyst data (No ticker)."] };
  }

  const analystData = await getAnalystRecommendations.invoke({ symbol: state.ticker });

  return {
    analystData,
    logs: [`Fetched analyst recommendations for ${state.ticker}`]
  };
};

// 4. NEWS & SENTIMENT NODE
const newsNode = async (state) => {
  console.log(`[Node] News Node running for: ${state.companyName}`);
  const query = `Recent news, controversies, and general sentiment regarding ${state.companyName} stock`;
  const newsData = await getRecentNews.invoke({ query });

  return {
    newsData,
    logs: [`Searched recent news and sentiment for ${state.companyName}`]
  };
};

// 5. SYNTHESIS NODE
const synthesisNode = async (state) => {
  console.log(`[Node] Synthesis Node running...`);
  const prompt = `
    You are an expert financial analyst. Synthesize the following raw data about ${state.companyName} (${state.ticker}) 
    into a cohesive, 3-5 sentence plain-English summary of the company's current status.
    
    FINANCIALS:
    ${state.financialData}
    
    ANALYST RATINGS:
    ${state.analystData}
    
    RECENT NEWS:
    ${state.newsData}
  `;

  const response = await llm.invoke(prompt);

  return {
    synthesis: response.content.toString(),
    logs: ["Synthesized all data into a cohesive summary."]
  };
};

// 6. DECISION NODE (Structured Output in JS)
const decisionNode = async (state) => {
  console.log(`[Node] Decision Node running...`);
  
  const decisionSchema = z.object({
    verdict: z.enum(["INVEST", "PASS"]).describe("The final verdict."),
    confidence: z.number().min(0).max(100).describe("Confidence percentage from 0 to 100."),
    financialScore: z.number().min(0).max(10).describe("Score out of 10 for Financial Health (30% weight)."),
    growthScore: z.number().min(0).max(10).describe("Score out of 10 for Growth Trajectory (25% weight)."),
    newsScore: z.number().min(0).max(10).describe("Score out of 10 for News/Sentiment (20% weight)."),
    valuationScore: z.number().min(0).max(10).describe("Score out of 10 for Valuation vs Peers (25% weight)."),
    reasoning: z.string().describe("A 1-2 sentence justification for the final verdict based on the sub-scores."),
  });

  const structuredLlm = llm.withStructuredOutput(decisionSchema);

  const prompt = `
    Based on the following data for ${state.companyName} (${state.ticker}), make a final INVEST or PASS decision.
    
    Data Summary:
    ${state.synthesis}
    
    Apply this explicit weighted scoring rubric:
    - Financial health: 30%
    - Growth trajectory: 25%
    - News/sentiment: 20%
    - Valuation vs peers: 25%
    
    Evaluate each category out of 10, then determine the final verdict.
  `;

  const finalDecision = await structuredLlm.invoke(prompt);

  return {
    finalDecision: finalDecision,
    logs: [`Final decision reached: ${finalDecision.verdict} with ${finalDecision.confidence}% confidence.`]
  };
};

module.exports = {
  inputNode,
  financialsNode,
  analystNode,
  newsNode,
  synthesisNode,
  decisionNode,
};
