import { useState, useEffect, useRef, useCallback } from "react";
import { VoiceRecorder } from "./components/VoiceRecorder";
import { UnifiedTextDisplay } from "./components/TextDisplay";
import { SettingsPanel } from "./components/SettingsPanel";
import { DictionaryManager } from "./components/DictionaryManager";
import { ProfileManager } from "./components/ProfileManager";
import { HistoryPanel } from "./components/HistoryPanel";
import { DataInsights } from "./components/DataInsights";
import { DictationSidebar } from "./components/DictationSidebar";
import { UsageIndicator } from "./components/UsageIndicator";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { usePolish } from "./hooks/usePolish";
import { buildPolishPrompt } from "./lib/prompt";
import { loadProfiles, saveProfiles, loadDictionary, saveDictionary } from "./lib/storage";
import { PromptProfile, DictionaryEntry } from "./types";

type FormatAs = "auto" | "paragraph" | "bullets" | "numbered";

function App() {
  const [language, setLanguage] = useState<string>(() => localStorage.getItem("vp_language") || "en-US");

  const {
    isListening, transcript, startListening, stopListening,
    resetTranscript, isSupported, duration,
  } = useSpeechRecognition(language);

  const {
    isPolishing, polishedText, error, polish, reset,
    undo, redo, canUndo, canRedo, setEditedText, history,
  } = usePolish();

  const [profiles, setProfiles] = useState<PromptProfile[]>(() => loadProfiles());
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>(() => loadDictionary());
  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => {
    const p = loadProfiles();
    const def = p.find((x) => x.is_default);
    return def?.id ?? p[0]?.id ?? null;
  });
  const [formatAs, setFormatAs] = useState<FormatAs>("auto");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);

  // Persist to localStorage on change
  useEffect(() => { saveProfiles(profiles); }, [profiles]);
  useEffect(() => { saveDictionary(dictionary); }, [dictionary]);
  useEffect(() => { localStorage.setItem("vp_language", language); }, [language]);

  // Dictionary callbacks
  const addDictEntry = useCallback((entry: DictionaryEntry) => {
    setDictionary((prev) => {
      const exists = prev.findIndex((e) => e.term === entry.term);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = entry;
        return updated;
      }
      return [...prev, entry];
    });
  }, []);

  const deleteDictEntry = useCallback((term: string) => {
    setDictionary((prev) => prev.filter((e) => e.term !== term));
  }, []);

  // Profile callbacks
  const addProfile = useCallback((profile: Omit<PromptProfile, "id">) => {
    const newProfile: PromptProfile = { ...profile, id: crypto.randomUUID() };
    setProfiles((prev) => [...prev, newProfile]);
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id || p.is_default));
    setActiveProfileId((prev) => (prev === id ? profiles.find((p) => p.is_default)?.id ?? null : prev));
  }, [profiles]);

  // WPM: word count / duration in minutes
  const wpm = duration > 0
    ? Math.round((transcript.trim().split(/\s+/).filter(Boolean).length / duration) * 60)
    : 0;

  // Build prompt and polish
  const doPolish = useCallback((rawText: string) => {
    const profile = profiles.find((p) => p.id === activeProfileId) ?? null;
    const prompt = buildPolishPrompt(rawText, profile, dictionary, formatAs, language);
    polish(prompt, activeProfileId, {
      rawTranscript: rawText,
      duration: durationRef.current,
      wpm: wpmRef.current,
      language,
      formatAs,
    });
  }, [profiles, activeProfileId, dictionary, formatAs, language, polish]);

  // Use refs to avoid stale closures in auto-polish
  const transcriptRef = useRef(transcript);
  const doPolishRef = useRef(doPolish);
  const durationRef = useRef(duration);
  const wpmRef = useRef(wpm);
  transcriptRef.current = transcript;
  doPolishRef.current = doPolish;
  durationRef.current = duration;
  wpmRef.current = wpm;

  // Auto-polish when mic stops
  const prevListeningRef = useRef(isListening);
  useEffect(() => {
    if (prevListeningRef.current && !isListening && transcriptRef.current.trim()) {
      doPolishRef.current(transcriptRef.current);
    }
    prevListeningRef.current = isListening;
  }, [isListening]);

  // Refresh sidebar when polish completes
  const prevPolishingRef = useRef(isPolishing);
  useEffect(() => {
    if (prevPolishingRef.current && !isPolishing && polishedText) {
      setSidebarRefresh((n) => n + 1);
    }
    prevPolishingRef.current = isPolishing;
  }, [isPolishing, polishedText]);

  // Keyboard shortcut: Space to toggle recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (target.isContentEditable) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (isListening) stopListening();
        else startListening();
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
    <>
    <DictationSidebar
      isOpen={sidebarOpen}
      onToggle={() => setSidebarOpen(!sidebarOpen)}
      refreshTrigger={sidebarRefresh}
    />

    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <header className="text-center mb-8 pt-6 relative">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-6 p-2 text-slate-400 hover:text-sky-400 transition"
          aria-label="Toggle history sidebar"
          title="Dictation History"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
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
          wpm={wpm}
        />

        <SettingsPanel
          profiles={profiles}
          activeProfileId={activeProfileId}
          setActiveProfileId={setActiveProfileId}
          formatAs={formatAs}
          setFormatAs={setFormatAs}
          language={language}
          setLanguage={setLanguage}
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
          wpm={wpm}
        />

        {error && (
          <div className="w-full text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => doPolish(transcript)}
              className="text-xs text-sky-400 hover:text-sky-300 underline mt-1"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex gap-2 justify-center">
          {polishedText && !isListening && !isPolishing && (
            <button onClick={handleNewDictation} className="bg-sky-500 hover:bg-sky-400 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
              New Dictation
            </button>
          )}
          {(transcript || polishedText) && !isListening && (
            <button onClick={handleReset} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
              Clear
            </button>
          )}
          {polishedText && !isListening && !isPolishing && (
            <button onClick={() => doPolish(transcript)} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
              Re-polish
            </button>
          )}
        </div>

        <UsageIndicator />

        <div className="w-full space-y-2 mt-4">
          <HistoryPanel history={history} />
          <DataInsights profiles={profiles} />
          <ProfileManager
            profiles={profiles}
            onAdd={addProfile}
            onDelete={deleteProfile}
          />
          <DictionaryManager
            entries={dictionary}
            onAdd={addDictEntry}
            onDelete={deleteDictEntry}
          />
        </div>
      </div>
    </div>
    </>
  );
}

export default App;
