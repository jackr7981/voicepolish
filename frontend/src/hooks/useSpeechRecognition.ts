import { useState, useRef, useCallback, useEffect } from "react";

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  duration: number; // seconds recording
}

const SILENCE_TIMEOUT_MS = 3000; // auto-stop after 3s silence

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const isSupported = !!SpeechRecognitionAPI;

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // Auto-stop on silence
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer]);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const recognition = new SpeechRecognitionAPI!();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
      // Reset silence timer on every speech result
      resetSilenceTimer();
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      clearSilenceTimer();
    };

    recognition.onend = () => {
      setIsListening(false);
      clearSilenceTimer();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setDuration(0);
    startTimeRef.current = Date.now();

    // Start duration counter
    durationIntervalRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Start initial silence timer
    resetSilenceTimer();
  }, [isSupported, resetSilenceTimer, clearSilenceTimer]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      clearSilenceTimer();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, [clearSilenceTimer]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setDuration(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [clearSilenceTimer]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    duration,
  };
}
