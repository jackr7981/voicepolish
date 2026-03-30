import { useState } from "react";
import { CopyButton } from "./CopyButton";
import { HistoryEntry } from "../types";
import { formatAsMarkdown } from "../lib/markdown";
import { generateShareUrl } from "../lib/share";

interface HistoryPanelProps {
  history: HistoryEntry[];
}

function timeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "...";
}

function ExportButton({ label, onClick }: { label: string; onClick: () => Promise<string | null> }) {
  const [status, setStatus] = useState<string | null>(null);

  const handleClick = async () => {
    const result = await onClick();
    setStatus(result);
    if (result) setTimeout(() => setStatus(null), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className={`text-xs px-2 py-1 rounded transition ${
        status === "Copied!" || status === "Link copied!"
          ? "bg-green-600/30 text-green-400"
          : status
          ? "bg-red-600/30 text-red-400"
          : "bg-slate-700 hover:bg-slate-600 text-slate-300"
      }`}
    >
      {status ?? label}
    </button>
  );
}

export function HistoryPanel({ history }: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

  const handleCopyMarkdown = async (entry: HistoryEntry): Promise<string | null> => {
    try {
      const md = formatAsMarkdown(entry.polished, entry.timestamp);
      await navigator.clipboard.writeText(md);
      return "Copied!";
    } catch {
      return "Failed";
    }
  };

  const handleShare = async (entry: HistoryEntry): Promise<string | null> => {
    const url = generateShareUrl(entry.polished, entry.timestamp);
    if (!url) return "Too long";
    try {
      await navigator.clipboard.writeText(url);
      return "Link copied!";
    } catch {
      return "Failed";
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-sky-400 hover:text-sky-300 underline"
      >
        {isOpen ? "Hide History" : `History (${history.length})`}
      </button>

      {isOpen && (
        <div className="mt-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-3 max-h-80 overflow-y-auto">
          {history.map((entry) => (
            <div
              key={entry.timestamp}
              className="border border-slate-700/50 rounded-lg p-3 space-y-1"
            >
              <div className="flex justify-between items-start gap-2">
                <p dir="auto" className="text-sm text-slate-200 leading-relaxed flex-1 whitespace-pre-wrap">
                  {truncate(entry.polished, 200)}
                </p>
                <div className="flex gap-1 shrink-0">
                  <CopyButton text={entry.polished} />
                  <ExportButton label="MD" onClick={() => handleCopyMarkdown(entry)} />
                  <ExportButton label="Share" onClick={() => handleShare(entry)} />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {timeAgo(entry.timestamp)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
