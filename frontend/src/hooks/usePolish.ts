import { useState, useRef, useCallback } from "react";
import { polishStream } from "../services/api";
import { HistoryEntry } from "../types";

const MAX_HISTORY = 10;

export function usePolish() {
  const [isPolishing, setIsPolishing] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const accumulatorRef = useRef("");

  const polish = useCallback(async (prompt: string, profileId: string | null) => {
    if (!prompt.trim()) return;
    setIsPolishing(true);
    setError(null);
    setStreamedText("");
    accumulatorRef.current = "";

    try {
      await polishStream(
        prompt,
        (token) => {
          accumulatorRef.current += token;
          setStreamedText(accumulatorRef.current);
        },
        () => {
          const finalText = accumulatorRef.current;
          setHistory((prev) => {
            const entry: HistoryEntry = {
              raw: prompt,
              polished: finalText,
              profileId,
              timestamp: Date.now(),
            };
            return [entry, ...prev].slice(0, MAX_HISTORY);
          });
          setHistoryIndex(-1);
          setIsPolishing(false);
        },
        (err) => {
          setError(err);
          setIsPolishing(false);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsPolishing(false);
    }
  }, []);

  const undo = useCallback(() => {
    setHistoryIndex((idx) => {
      setHistory((hist) => {
        if (hist.length < 2) return hist;
        const next = Math.min(idx + 1, hist.length - 1);
        setStreamedText(hist[next].polished);
        return hist;
      });
      return Math.min(idx + 1, MAX_HISTORY - 1);
    });
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex((idx) => {
      const next = Math.max(idx - 1, -1);
      setHistory((hist) => {
        const entry = next === -1 ? hist[0] : hist[next];
        if (entry) setStreamedText(entry.polished);
        return hist;
      });
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setStreamedText("");
    setError(null);
    setHistoryIndex(-1);
  }, []);

  const setEditedText = useCallback((text: string) => {
    setStreamedText(text);
  }, []);

  return {
    isPolishing,
    polishedText: streamedText,
    error,
    polish,
    reset,
    undo,
    redo,
    history,
    setEditedText,
    canUndo: history.length > 1 && historyIndex < history.length - 1,
    canRedo: historyIndex > -1,
  };
}
