interface VoiceRecorderProps {
  isListening: boolean;
  isPolishing: boolean;
  onStart: () => void;
  onStop: () => void;
  isSupported: boolean;
  duration: number;
  wpm: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({
  isListening,
  isPolishing,
  onStart,
  onStop,
  isSupported,
  duration,
  wpm,
}: VoiceRecorderProps) {
  if (!isSupported) {
    return (
      <div className="text-red-400 text-center p-4 text-sm">
        Speech recognition is not supported in this browser. Use Chrome or Safari.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={isListening ? onStop : onStart}
        disabled={isPolishing}
        aria-label={isPolishing ? "Polishing in progress" : isListening ? "Stop recording" : "Start recording"}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
          isPolishing
            ? "bg-slate-600 cursor-not-allowed"
            : isListening
            ? "bg-red-500 shadow-lg shadow-red-500/50 mic-pulse"
            : "bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/30 hover:scale-105"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {isListening ? (
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
            />
          )}
        </svg>
      </button>

      <div className="text-center">
        {isListening ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-400 font-mono">{formatDuration(duration)}</span>
            {wpm > 0 && (
              <span className="text-xs text-slate-400 font-mono">{wpm} wpm</span>
            )}
            <span className="text-xs text-slate-500">tap or wait to stop</span>
          </div>
        ) : isPolishing ? (
          <span className="text-xs text-sky-400 animate-pulse">Polishing...</span>
        ) : (
          <span className="text-xs text-slate-500">Tap mic or press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 text-xs">Space</kbd></span>
        )}
      </div>
    </div>
  );
}
