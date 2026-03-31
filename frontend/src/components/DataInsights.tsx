import { useState, useEffect, useRef } from "react";
import { PromptProfile } from "../types";
import { DictationRow } from "../services/api";
import {
  fetchAndComputeStats,
  exportRowsAsJson,
  exportRowsAsCsv,
  downloadFile,
  clearBuckets,
  BucketStats,
} from "../lib/dataBuckets";

interface DataInsightsProps {
  profiles: PromptProfile[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function DataInsights({ profiles }: DataInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<BucketStats | null>(null);
  const [rows, setRows] = useState<DictationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fetched = useRef(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const result = await fetchAndComputeStats();
      setStats(result.stats);
      setRows(result.rows);
    } catch {
      // API failed — stats stay null
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && !fetched.current) {
      fetched.current = true;
      refresh();
    }
  }, [isOpen]);

  const profileName = (id: string | null) =>
    profiles.find((p) => p.id === id)?.name ?? "None";

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-sky-400 hover:text-sky-300 underline"
      >
        Data Insights {stats ? `(${stats.totalDictations})` : ""}
      </button>
    );
  }

  const handleExportJson = () => {
    downloadFile(exportRowsAsJson(rows), "voicepolish-data.json", "application/json");
  };

  const handleExportCsv = () => {
    downloadFile(exportRowsAsCsv(rows), "voicepolish-data.csv", "text/csv");
  };

  const handleClear = async () => {
    clearBuckets();
    setStats(null);
    setRows([]);
    setShowClearConfirm(false);
    fetched.current = false;
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(false)}
        className="text-sm text-sky-400 hover:text-sky-300 underline"
      >
        Hide Data Insights
      </button>

      <div className="mt-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        {loading ? (
          <p className="text-slate-500 text-sm animate-pulse">Loading data...</p>
        ) : !stats || stats.totalDictations === 0 ? (
          <p className="text-slate-500 text-sm italic">
            No data recorded yet. Start dictating to see insights.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <StatCard label="Dictations" value={stats.totalDictations} />
              <StatCard label="Avg WPM" value={stats.avgWpm} />
              <StatCard label="Avg Duration" value={formatDuration(stats.avgDuration)} />
              <StatCard
                label="Avg Words"
                value={`${stats.avgRawWordCount} → ${stats.avgPolishedWordCount}`}
                sub="raw → polished"
              />
              <StatCard label="Top Profile" value={profileName(stats.mostUsedProfileId)} small />
              <StatCard label="Top Language" value={stats.mostUsedLanguage} small />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <span>{stats.totalDictations} entries</span>
              <span>·</span>
              <span>{stats.totalRawWords.toLocaleString()} raw words total</span>
              <span>·</span>
              <span>{stats.totalPolishedWords.toLocaleString()} polished words total</span>
            </div>
          </>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportJson}
            disabled={!stats || stats.totalDictations === 0}
            className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Export JSON
          </button>
          <button
            onClick={handleExportCsv}
            disabled={!stats || stats.totalDictations === 0}
            className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
          <button
            onClick={() => { fetched.current = false; refresh(); }}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition disabled:opacity-30"
          >
            Refresh
          </button>
          <div className="ml-auto">
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Delete all data?</span>
                <button
                  onClick={handleClear}
                  className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white transition"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={!stats || stats.totalDictations === 0}
                className="text-xs text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Clear Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  small,
}: {
  label: string;
  value: string | number;
  sub?: string;
  small?: boolean;
}) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-3">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`font-semibold text-sky-300 ${small ? "text-sm" : "text-lg"}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
