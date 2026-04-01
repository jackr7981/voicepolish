import { useState, useEffect, useCallback } from "react";
import { fetchDictations, DictationRow } from "../services/api";
import { CopyButton } from "./CopyButton";
import {
  exportRowsAsJson,
  exportRowsAsCsv,
  downloadFile,
} from "../lib/dataBuckets";

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatAsMarkdownEntry(row: DictationRow): string {
  const date = new Date(row.created_at).toLocaleString();
  return `## ${date}\n\n**Raw:** ${row.raw_text}\n\n**Polished:** ${row.polished_text}\n\n---\n`;
}

interface DictationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  refreshTrigger: number;
}

export function DictationSidebar({ isOpen, onToggle, refreshTrigger }: DictationSidebarProps) {
  const [rows, setRows] = useState<DictationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDictations();
      setRows(data);
    } catch {
      // silent fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load, refreshTrigger]);

  const filtered = searchQuery.trim()
    ? rows.filter(
        (r) =>
          r.raw_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.polished_text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rows;

  const handleExportJson = () => {
    downloadFile(exportRowsAsJson(rows), "voicepolish-data.json", "application/json");
  };

  const handleExportCsv = () => {
    downloadFile(exportRowsAsCsv(rows), "voicepolish-data.csv", "text/csv");
  };

  const handleExportMd = () => {
    const md = `# VoicePolish Dictation History\n\nExported: ${new Date().toLocaleString()}\n\n---\n\n` +
      rows.map(formatAsMarkdownEntry).join("\n");
    downloadFile(md, "voicepolish-history.md", "text/markdown");
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 bg-slate-900 border-r border-slate-700 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-80`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-sky-400">Dictation History</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{rows.length}</span>
            <button
              onClick={onToggle}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dictations..."
            className="w-full bg-slate-800 text-sm rounded px-3 py-2 text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-slate-500 text-sm animate-pulse">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-slate-500 text-sm italic">
              {searchQuery ? "No matches" : "No dictations yet. Start speaking!"}
            </div>
          ) : (
            filtered.map((row) => (
              <div
                key={row.id}
                className="border-b border-slate-800 hover:bg-slate-800/50 transition"
              >
                <button
                  onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                  className="w-full text-left p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">{timeAgo(row.created_at)}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      {row.wpm > 0 && <span>{row.wpm} wpm</span>}
                      <span>{row.raw_word_count}w</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2">
                    {row.polished_text || row.raw_text}
                  </p>
                </button>

                {expandedId === row.id && (
                  <div className="px-3 pb-3 space-y-3">
                    {/* Polished text */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-sky-400 uppercase tracking-wider">Polished</span>
                        <CopyButton text={row.polished_text} />
                      </div>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap bg-slate-800 rounded p-2 max-h-48 overflow-y-auto">
                        {row.polished_text}
                      </p>
                    </div>
                    {/* Raw text */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Raw</span>
                        <CopyButton text={row.raw_text} />
                      </div>
                      <p className="text-xs text-slate-400 whitespace-pre-wrap bg-slate-800/50 rounded p-2 max-h-32 overflow-y-auto">
                        {row.raw_text}
                      </p>
                    </div>
                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{row.language}</span>
                      <span>·</span>
                      <span>{row.duration}s</span>
                      {row.wpm > 0 && <><span>·</span><span>{row.wpm} wpm</span></>}
                      <span>·</span>
                      <span>{row.raw_word_count} → {row.polished_word_count} words</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer: export buttons */}
        <div className="p-3 border-t border-slate-700 flex gap-2">
          <button
            onClick={handleExportJson}
            disabled={rows.length === 0}
            className="flex-1 text-xs px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition disabled:opacity-30"
          >
            JSON
          </button>
          <button
            onClick={handleExportCsv}
            disabled={rows.length === 0}
            className="flex-1 text-xs px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition disabled:opacity-30"
          >
            CSV
          </button>
          <button
            onClick={handleExportMd}
            disabled={rows.length === 0}
            className="flex-1 text-xs px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition disabled:opacity-30"
          >
            Markdown
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="text-xs px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition disabled:opacity-30"
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </aside>
    </>
  );
}
