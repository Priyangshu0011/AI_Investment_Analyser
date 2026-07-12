const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

const FinancialsInputSchema = z.object({
  symbol: z.string().describe("The stock ticker symbol of the company (e.g., AAPL, MSFT, TSLA)."),
});

const getFinancialFundamentals = tool(
  async ({ symbol }) => {
    console.log(`[Tool] Fetching financials for ${symbol}...`);
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey) {
      throw new Error("ALPHA_VANTAGE_API_KEY is not configured.");
    }

    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`
      );
      const data = await response.json();

      if (!data || Object.keys(data).length === 0 || data.Information || data.Note || data["Note"]) {
        return `Could not find financial data for ${symbol}. It might not be a valid ticker or we hit a rate limit.`;
      }

      return JSON.stringify({
        symbol: data.Symbol,
        name: data.Name,
        sector: data.Sector,
        marketCap: data.MarketCapitalization,
        ebitda: data.EBITDA,
        peRatio: data.PERatio,
        pegRatio: data.PEGRatio,
        profitMargin: data.ProfitMargin,
        operatingMarginTTM: data.OperatingMarginTTM,
        revenueTTM: data.RevenueTTM,
        grossProfitTTM: data.GrossProfitTTM,
        debtToEquity: data.DebtToEquity,
        quarterlyRevenueGrowthYOY: data.QuarterlyRevenueGrowthYOY,
      });
    } catch (error) {
      return `Error fetching financials: ${error.message}`;
    }
  },
  {
    name: "get_financial_fundamentals",
    description: "Fetches core financial metrics (revenue, profit margins, debt, growth) for a given stock ticker symbol.",
    schema: FinancialsInputSchema,
  }
);

module.exports = { getFinancialFundamentals };
