const { StateGraph, START, END } = require("@langchain/langgraph");
const { AgentState } = require("./state");
const { 
  inputNode, 
  financialsNode, 
  analystNode, 
  newsNode, 
  synthesisNode, 
  decisionNode 
} = require("./nodes");

const graphBuilder = new StateGraph(AgentState)
  .addNode("input", inputNode)
  .addNode("financials", financialsNode)
  .addNode("analyst", analystNode)
  .addNode("news", newsNode)
  .addNode("synthesisStep", synthesisNode)
  .addNode("decision", decisionNode)
  
  .addEdge(START, "input")
  .addEdge("input", "financials")
  .addEdge("financials", "analyst")
  .addEdge("analyst", "news")
  .addEdge("news", "synthesisStep")
  .addEdge("synthesisStep", "decision")
  .addEdge("decision", END);

const agentGraph = graphBuilder.compile();

module.exports = { agentGraph };
