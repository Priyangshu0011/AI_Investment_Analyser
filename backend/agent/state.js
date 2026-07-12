const { Annotation } = require("@langchain/langgraph");

const AgentState = Annotation.Root({
  companyName: Annotation(),
  ticker: Annotation(),
  financialData: Annotation(),
  analystData: Annotation(),
  newsData: Annotation(),
  synthesis: Annotation(),
  finalDecision: Annotation(),
  logs: Annotation({
    reducer: (currentState, newLogs) => currentState.concat(newLogs),
    default: () => [],
  }),
});

module.exports = { AgentState };
