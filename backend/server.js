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
    console.error("[Backend Error]", error);
    res.write(JSON.stringify({ 
      type: "error", 
      message: error.message || "An error occurred during agent execution." 
    }) + "\n");
    res.end();
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`[Server] Express Backend running on http://localhost:${PORT}`);
});
