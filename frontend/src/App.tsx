import { useState, useEffect, useRef, useCallback } from "react";
import { VoiceRecorder } from "./components/VoiceRecorder";
import { UnifiedTextDisplay } from "./components/TextDisplay";
import { SettingsPanel } from "./components/SettingsPanel";
import { DictionaryManager } from "./components/DictionaryManager";
import { ProfileManager } from "./components/ProfileManager";
import { HistoryPanel } from "./components/HistoryPanel";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { usePolish } from "./hooks/usePolish";
import { getProfiles } from "./services/api";
import { PromptProfile } from "./types";

type FormatAs = "auto" | "paragraph" | "bullets" | "numbered";

function App() {
  const {
    isListening, transcript, startListening, stopListening,
    resetTranscript, isSupported, duration,
  } = useSpeechRecognition();

  const {
    isPolishing, polishedText, error, polish, reset,
    undo, redo, canUndo, canRedo, setEditedText, history,
  } = usePolish();

  const [profiles, setProfiles] = useState<PromptProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [formatAs, setFormatAs] = useState<FormatAs>("auto");

  const loadProfiles = useCallback(async () => {
    try {
      const data = await getProfiles();
      setProfiles(data);
      setActiveProfileId((prev) => {
        if (prev === null && data.length > 0) {
          const defaultProfile = data.find((p) => p.is_default);
          return defaultProfile?.id ?? data[0].id ?? null;
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to load profiles:", err);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Use refs to avoid stale closures in the auto-polish effect
  const transcriptRef = useRef(transcript);
  const activeProfileIdRef = useRef(activeProfileId);
  const formatAsRef = useRef(formatAs);
  transcriptRef.current = transcript;
  activeProfileIdRef.current = activeProfileId;
  formatAsRef.current = formatAs;

  // Auto-polish when mic stops
  const prevListeningRef = useRef(isListening);
  useEffect(() => {
    if (prevListeningRef.current && !isListening && transcriptRef.current.trim()) {
      polish(transcriptRef.current, activeProfileIdRef.current, formatAsRef.current);
    }
    prevListeningRef.current = isListening;
  }, [isListening, polish]);

  // Keyboard shortcut: Space to toggle recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (target.isContentEditable) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isListening, startListening, stopListening]);

  const handleReset = useCallback(() => {
    resetTranscript();
    reset();
  }, [resetTranscript, reset]);

  const handleNewDictation = useCallback(() => {
    handleReset();
    startListening();
  }, [handleReset, startListening]);

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <header className="text-center mb-8 pt-6">
        <h1 className="text-2xl font-bold text-sky-400">VoicePolish</h1>
        <p className="text-slate-400 text-sm mt-1">Speak naturally. Get polished text.</p>
      </header>

      <div className="flex flex-col items-center gap-6">
        <VoiceRecorder
          isListening={isListening}
          isPolishing={isPolishing}
          onStart={startListening}
          onStop={stopListening}
          isSupported={isSupported}
          duration={duration}
        />

        <SettingsPanel
          profiles={profiles}
          activeProfileId={activeProfileId}
          setActiveProfileId={setActiveProfileId}
          formatAs={formatAs}
          setFormatAs={setFormatAs}
        />

        <UnifiedTextDisplay
          isListening={isListening}
          isPolishing={isPolishing}
          rawText={transcript}
          polishedText={polishedText}
          onEditPolished={setEditedText}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
        />

        {error && (
          <div className="w-full text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => polish(transcript, activeProfileId, formatAs)}
              className="text-xs text-sky-400 hover:text-sky-300 underline mt-1"
            >
              Retry
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 justify-center">
          {polishedText && !isListening && !isPolishing && (
            <button
              onClick={handleNewDictation}
              className="bg-sky-500 hover:bg-sky-400 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              New Dictation
            </button>
          )}
          {(transcript || polishedText) && !isListening && (
            <button
              onClick={handleReset}
              className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              Clear
            </button>
          )}
          {polishedText && !isListening && !isPolishing && (
            <button
              onClick={() => polish(transcript, activeProfileId, formatAs)}
              className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              Re-polish
            </button>
          )}
        </div>

        <div className="w-full space-y-2 mt-4">
          <HistoryPanel history={history} />
          <ProfileManager onProfilesChange={loadProfiles} />
          <DictionaryManager />
        </div>
      </div>
    </div>
  );
}

export default App;
