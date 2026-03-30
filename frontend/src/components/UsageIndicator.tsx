import { useState, useEffect, useCallback } from "react";
import { getTodayUsage, getLifetimeUsage, estimateCost } from "../lib/usage";

export function UsageIndicator() {
  const [expanded, setExpanded] = useState(false);
  const [today, setToday] = useState(getTodayUsage());
  const [lifetime, setLifetime] = useState(getLifetimeUsage());

  const refresh = useCallback(() => {
    setToday(getTodayUsage());
    setLifetime(getLifetimeUsage());
  }, []);

  useEffect(() => {
    window.addEventListener("vp_usage_updated", refresh);
    return () => window.removeEventListener("vp_usage_updated", refresh);
  }, [refresh]);

  const todayTokens = today?.total_tokens ?? 0;
  const todayCost = today ? estimateCost(today.prompt_tokens, today.completion_tokens) : 0;

  return (
    <div className="w-full text-center mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-slate-500 hover:text-slate-400 transition"
      >
        Today: {todayTokens.toLocaleString()} tokens (~${todayCost.toFixed(4)})
      </button>

      {expanded && (
        <div className="mt-2 bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-xs text-slate-400 space-y-1 max-w-xs mx-auto">
          <div className="flex justify-between">
            <span>Today's requests</span>
            <span className="text-slate-300">{today?.requests ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Input tokens</span>
            <span className="text-slate-300">{(today?.prompt_tokens ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Output tokens</span>
            <span className="text-slate-300">{(today?.completion_tokens ?? 0).toLocaleString()}</span>
          </div>
          <div className="border-t border-slate-700 pt-1 mt-1 flex justify-between">
            <span>Lifetime tokens</span>
            <span className="text-slate-300">{lifetime.tokens.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Lifetime requests</span>
            <span className="text-slate-300">{lifetime.requests}</span>
          </div>
        </div>
      )}
    </div>
  );
}
