import { useState } from "react";
import { CopyButton } from "./CopyButton";

interface UnifiedTextDisplayProps {
  isListening: boolean;
  isPolishing: boolean;
  rawText: string;
  polishedText: string;
  onEditPolished: (text: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function UnifiedTextDisplay({
  isListening,
  isPolishing,
  rawText,
  polishedText,
  onEditPolished,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: UnifiedTextDisplayProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Determine what to show
  const hasPolished = polishedText.length > 0;
  const showingPolished = hasPolished && !showRaw;
  const displayText = showingPolished ? polishedText : rawText;
  const isEmpty = !displayText && !isListening && !isPolishing;

  return (
    <div className="w-full">
      {/* Header bar */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          {hasPolished && !isListening && (
            <button
              onClick={() => { setShowRaw(!showRaw); setIsEditing(false); }}
              className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
            >
              {showRaw ? "Show polished" : "Show raw"}
            </button>
          )}
          {showingPolished && !isEditing && !isPolishing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
            >
              Edit
            </button>
          )}
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white transition"
            >
              Done
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          {hasPolished && !isListening && (
            <div className="flex gap-1">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="text-xs px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition disabled:opacity-30 disabled:cursor-not-allowed min-w-[32px] min-h-[32px]"
                title="Undo"
                aria-label="Undo"
              >
                &#8630;
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="text-xs px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition disabled:opacity-30 disabled:cursor-not-allowed min-w-[32px] min-h-[32px]"
                title="Redo"
                aria-label="Redo"
              >
                &#8631;
              </button>
            </div>
          )}
          {/* Word count */}
          {displayText && (
            <span className="text-xs text-slate-500">{wordCount(displayText)} words</span>
          )}
          {/* Copy */}
          {displayText && !isEditing && <CopyButton text={displayText} />}
        </div>
      </div>

      {/* Main text area */}
      <div
        className={`rounded-xl p-4 min-h-[160px] transition-all duration-500 ${
          isListening
            ? "bg-slate-800/50 border border-red-500/30 shadow-inner shadow-red-500/5"
            : isPolishing
            ? "bg-slate-800/50 border border-sky-500/20"
            : hasPolished && !showRaw
            ? "bg-slate-800 border border-sky-500/30 shadow-lg shadow-sky-500/5"
            : "bg-slate-800/50 border border-slate-700"
        }`}
      >
        {/* Status label */}
        <div className="mb-2">
          <span className={`text-xs uppercase tracking-wider ${
            isListening ? "text-red-400" : isPolishing ? "text-sky-400" : showRaw ? "text-slate-500" : "text-slate-400"
          }`}>
            {isListening
              ? "Listening..."
              : isPolishing
              ? "Polishing"
              : showRaw
              ? "Raw dictation"
              : hasPolished
              ? "Polished"
              : ""}
          </span>
        </div>

        {/* Shimmer loading */}
        {isPolishing && !polishedText && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-700/60 rounded w-full" />
            <div className="h-4 bg-slate-700/60 rounded w-5/6" />
            <div className="h-4 bg-slate-700/60 rounded w-4/6" />
          </div>
        )}

        {/* Editable mode */}
        {isEditing && showingPolished ? (
          <textarea
            value={polishedText}
            onChange={(e) => onEditPolished(e.target.value)}
            className="w-full bg-transparent text-sm leading-relaxed text-slate-100 resize-none outline-none min-h-[120px] max-h-[400px] overflow-y-auto"
            dir="auto"
            autoFocus
          />
        ) : (
          <p dir="auto" className={`text-sm leading-relaxed whitespace-pre-wrap transition-opacity duration-300 ${
            isPolishing && polishedText ? "text-slate-200" : ""
          }`}>
            {displayText || (
              isEmpty && <span className="text-slate-500 italic">Tap the mic to start dictating...</span>
            )}
            {/* Streaming cursor */}
            {isPolishing && polishedText && (
              <span className="inline-block w-0.5 h-4 bg-sky-400 ml-0.5 animate-pulse align-text-bottom" />
            )}
          </p>
        )}
      </div>
    </div>
  );
}
