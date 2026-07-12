import React, { useState, useRef, useEffect } from "react";
import { 
  Search, 
  TrendingUp, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  PieChart, 
  Users, 
  Newspaper,
  Loader2,
  ShieldCheck,
  Percent
} from "lucide-react";

export default function App() {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  
  const [expandedPanels, setExpandedPanels] = useState({
    financials: false,
    analyst: false,
    news: false,
  });

  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const togglePanel = (panel) => {
    setExpandedPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  const handleResearch = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setLoading(true);
    setError(null);
    setLogs([]);
    setResult(null);

    try {
      // Connect to Express backend (fallback to localhost for local development)
      const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5050";
      const response = await fetch(`${backendUrl}/api/research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyName }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to Express backend API.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable.");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            
            if (parsed.type === "log") {
              setLogs((prev) => [...prev, parsed.message]);
            } else if (parsed.type === "result") {
              setResult(parsed.data);
            } else if (parsed.type === "error") {
              setError(parsed.message);
            }
          } catch (err) {
            console.error("Error parsing stream line:", line);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const safeJsonParse = (str) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  };

  const financialMetrics = result ? safeJsonParse(result.financialData) : null;
  const analystMetrics = result ? safeJsonParse(result.analystData) : null;
  const decision = result?.finalDecision;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-emerald-400 to-teal-500 p-2 rounded-xl text-[#0b0f19] font-bold">
            <TrendingUp size={22} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Antigravity Capital
            </h1>
            <p className="text-xs text-slate-400 font-mono">AI INVESTMENT RESEARCH AGENT</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs text-slate-300 font-mono">Express Node Backend Live</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto px-4 py-8 flex-1 flex flex-col gap-8">
        
        {/* Intro Hero Section */}
        <section className="text-center max-w-2xl mx-auto mt-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Intelligent Stock Due Diligence
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Input any company name. Our multi-step LangGraph agent running on Express will pull fundamentals, 
            analyse Wall Street consensus, crawl recent news, and apply a strict, weighted scoring rubric.
          </p>
        </section>

        {/* Input Form */}
        <section className="max-w-2xl w-full mx-auto bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
          <form onSubmit={handleResearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name (e.g., Apple, Tesla, Nvidia)"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-200 placeholder-slate-500 transition disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !companyName.trim()}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Researching...</span>
                </>
              ) : (
                <span>Analyze Stock</span>
              )}
            </button>
          </form>
        </section>

        {/* Logs and Progress Section */}
        {loading && (
          <section className="max-w-2xl w-full mx-auto bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 shadow-inner">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Loader2 className="animate-spin text-emerald-400" size={12} />
              Agent Workflow Progress
            </h3>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2.5 text-xs text-slate-300 font-mono transition-opacity duration-300">
                  <span className="text-emerald-400">✓</span>
                  <span>{log}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </section>
        )}

        {/* Error Handling */}
        {error && (
          <div className="max-w-2xl w-full mx-auto bg-red-950/30 border border-red-800/50 p-4 rounded-xl flex gap-3 text-red-200 text-sm">
            <AlertCircle className="shrink-0 text-red-400" size={20} />
            <div>
              <h4 className="font-semibold mb-0.5">Research Failed</h4>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Results Screen */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-2 animate-fadeIn">
            
            {/* Left/Main Column: Verdict, Score Breakdown, and Synthesis */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Verdict Card */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 relative overflow-hidden backdrop-blur-sm">
                
                <div className={`absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-[100px] opacity-10 pointer-events-none ${
                  decision?.verdict === "INVEST" ? "bg-emerald-400" : "bg-rose-400"
                }`} />

                <div className="shrink-0 text-center">
                  <div className={`w-32 h-32 rounded-full border-4 flex flex-col justify-center items-center font-black text-2xl tracking-wider shadow-2xl transition duration-500 ${
                    decision?.verdict === "INVEST"
                      ? "border-emerald-500 bg-emerald-950/40 text-emerald-400 shadow-emerald-500/10"
                      : "border-rose-500 bg-rose-950/40 text-rose-400 shadow-rose-500/10"
                  }`}>
                    <span className="text-xs uppercase tracking-widest opacity-70 font-bold mb-1">VERDICT</span>
                    {decision?.verdict}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 justify-center md:justify-start mb-2">
                    <h3 className="text-2xl font-bold text-white">
                      {financialMetrics?.name || result.ticker} Analysis
                    </h3>
                    <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs rounded-full">
                      {result.ticker}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    {decision?.reasoning}
                  </p>
                  
                  <div>
                    <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1.5">
                      <span>Model Confidence</span>
                      <span className="font-bold text-slate-200">{decision?.confidence}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          decision?.verdict === "INVEST" ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${decision?.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rubric Score Breakdown */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <ShieldCheck className="text-emerald-400" size={20} />
                  Rubric Score Card
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Financial Health (30%)</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">{decision?.financialScore}/10</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(decision?.financialScore || 0) * 10}%` }} />
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Growth Trajectory (25%)</span>
                      <span className="text-base font-bold text-teal-400 font-mono">{decision?.growthScore}/10</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: `${(decision?.growthScore || 0) * 10}%` }} />
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">News & Sentiment (20%)</span>
                      <span className="text-base font-bold text-sky-400 font-mono">{decision?.newsScore}/10</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500" style={{ width: `${(decision?.newsScore || 0) * 10}%` }} />
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Valuation vs Peers (25%)</span>
                      <span className="text-base font-bold text-indigo-400 font-mono">{decision?.valuationScore}/10</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${(decision?.valuationScore || 0) * 10}%` }} />
                    </div>
                  </div>
                </div>

                {decision && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span>Formula: (Fin * 0.3) + (Growth * 0.25) + (News * 0.2) + (Val * 0.25)</span>
                    <span className="text-sm font-bold text-slate-200">
                      Weighted Score: {((decision.financialScore * 0.3) + (decision.growthScore * 0.25) + (decision.newsScore * 0.2) + (decision.valuationScore * 0.25)).toFixed(2)} / 10
                    </span>
                  </div>
                )}
              </div>

              {/* Plain English Summary */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                <h3 className="text-base uppercase tracking-wider font-bold text-slate-400 mb-3 font-mono">
                  Synthesized Due Diligence
                </h3>
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                  {result.synthesis}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm flex flex-col gap-4">
                <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Key Metrics
                </h3>
                
                <div className="bg-slate-950/50 border border-slate-800/60 p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-mono block">REVENUE (TTM)</span>
                    <span className="text-sm font-bold text-slate-200">
                      {financialMetrics?.revenueTTM 
                        ? `$${(Number(financialMetrics.revenueTTM) / 1e9).toFixed(2)}B` 
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/50 border border-slate-800/60 p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl">
                    <PieChart size={20} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-mono block">PROFIT MARGIN</span>
                    <span className="text-sm font-bold text-slate-200">
                      {financialMetrics?.profitMargin 
                        ? `${(Number(financialMetrics.profitMargin) * 100).toFixed(2)}%` 
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/50 border border-slate-800/60 p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
                    <Percent size={20} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-mono block">PE RATIO</span>
                    <span className="text-sm font-bold text-slate-200">
                      {financialMetrics?.peRatio || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/50 border border-slate-800/60 p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <Users size={20} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-mono block">DEBT TO EQUITY</span>
                    <span className="text-sm font-bold text-slate-200">
                      {financialMetrics?.debtToEquity || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {analystMetrics && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                  <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-3">
                    Wall Street Consensus
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-emerald-400">Buy / Strong Buy</span>
                      <span className="text-slate-200">{(analystMetrics.buy || 0) + (analystMetrics.strongBuy || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Hold</span>
                      <span className="text-slate-200">{analystMetrics.hold || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-rose-400">Sell / Strong Sell</span>
                      <span className="text-slate-200">{(analystMetrics.sell || 0) + (analystMetrics.strongSell || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Accordions */}
        {result && (
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 max-w-6xl w-full mx-auto mt-4 backdrop-blur-sm">
            <h3 className="text-base font-bold text-white mb-4">Raw Node Extraction Details</h3>
            
            <div className="space-y-3">
              <div className="border border-slate-800 rounded-2xl bg-slate-950/40 overflow-hidden">
                <button
                  onClick={() => togglePanel("financials")}
                  className="w-full px-5 py-4 flex items-center justify-between text-sm font-semibold hover:bg-slate-900/50 transition"
                >
                  <span className="flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-400" />
                    Alpha Vantage Fundamentals Node Output
                  </span>
                  {expandedPanels.financials ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedPanels.financials && (
                  <div className="px-5 pb-5 pt-1 text-xs font-mono text-slate-400 max-h-[300px] overflow-auto border-t border-slate-900">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(safeJsonParse(result.financialData), null, 2)}</pre>
                  </div>
                )}
              </div>

              <div className="border border-slate-800 rounded-2xl bg-slate-950/40 overflow-hidden">
                <button
                  onClick={() => togglePanel("analyst")}
                  className="w-full px-5 py-4 flex items-center justify-between text-sm font-semibold hover:bg-slate-900/50 transition"
                >
                  <span className="flex items-center gap-2">
                    <Users size={16} className="text-teal-400" />
                    Finnhub Analyst Consensus Node Output
                  </span>
                  {expandedPanels.analyst ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedPanels.analyst && (
                  <div className="px-5 pb-5 pt-1 text-xs font-mono text-slate-400 max-h-[300px] overflow-auto border-t border-slate-900">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(safeJsonParse(result.analystData), null, 2)}</pre>
                  </div>
                )}
              </div>

              <div className="border border-slate-800 rounded-2xl bg-slate-950/40 overflow-hidden">
                <button
                  onClick={() => togglePanel("news")}
                  className="w-full px-5 py-4 flex items-center justify-between text-sm font-semibold hover:bg-slate-900/50 transition"
                >
                  <span className="flex items-center gap-2">
                    <Newspaper size={16} className="text-sky-400" />
                    Tavily AI Search Node Output
                  </span>
                  {expandedPanels.news ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedPanels.news && (
                  <div className="px-5 pb-5 pt-1 text-xs font-mono text-slate-400 max-h-[300px] overflow-auto border-t border-slate-900">
                    <pre className="whitespace-pre-wrap">{result.newsData}</pre>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      <footer className="border-t border-slate-800/80 bg-slate-950/40 text-center py-6 text-xs text-slate-500 font-mono mt-auto">
        <p>© {new Date().getFullYear()} Antigravity Capital. All rights reserved.</p>
        <p className="mt-1">Powered by LangGraph, LangChain, Express, and Gemini 2.5 Flash.</p>
      </footer>
    </div>
  );
}
