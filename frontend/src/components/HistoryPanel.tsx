import { useState } from "react";
import { CopyButton } from "./CopyButton";
import { HistoryEntry } from "../types";

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

export function HistoryPanel({ history }: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

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
          {history.map((entry, i) => (
            <div
              key={entry.timestamp}
              className="border border-slate-700/50 rounded-lg p-3 space-y-1"
            >
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm text-slate-200 leading-relaxed flex-1 whitespace-pre-wrap">
                  {truncate(entry.polished, 200)}
                </p>
                <CopyButton text={entry.polished} />
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
