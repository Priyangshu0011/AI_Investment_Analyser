const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

const TavilyInputSchema = z.object({
  query: z.string().describe("The search query to look up (e.g., 'Recent news and controversies about Apple Inc')."),
});

const getRecentNews = tool(
  async ({ query }) => {
    console.log(`[Tool] Searching web for: "${query}"...`);
    const apiKey = process.env.TAVILY_API_KEY;
    
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY is not configured.");
    }

    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: query,
          search_depth: "basic",
          include_answer: true,
          days: 30,
          max_results: 3,
        }),
      });

      const data = await response.json();
      
      if (!data || !data.results) {
        return "No relevant news found.";
      }

      const formattedResults = data.results.map((r) => 
        `Title: ${r.title}\nSource: ${r.url}\nSummary: ${r.content}`
      ).join("\n\n");

      return `AI Search Summary: ${data.answer || "N/A"}\n\nTop Articles:\n${formattedResults}`;
    } catch (error) {
      return `Error searching news: ${error.message}`;
    }
  },
  {
    name: "get_recent_news",
    description: "Searches the web for recent news, controversies, and general sentiment about a company.",
    schema: TavilyInputSchema,
  }
);

module.exports = { getRecentNews };
