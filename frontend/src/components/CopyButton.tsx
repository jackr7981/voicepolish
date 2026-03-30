import { useState, useRef, useEffect } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
      className={`text-xs px-2 py-1 rounded transition ${
        copied
          ? "bg-green-600/30 text-green-400"
          : "bg-slate-700 hover:bg-slate-600 text-slate-300"
      }`}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
