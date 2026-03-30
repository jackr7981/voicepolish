import { decodeShareData } from "../lib/share";
import { CopyButton } from "./CopyButton";

export function ShareView() {
  const hash = window.location.hash.slice(1);
  const data = hash ? decodeShareData(hash) : null;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-sky-400 mb-2">VoicePolish</h1>
          <p className="text-slate-400 text-sm">This share link is invalid or expired.</p>
          <a href="/" className="text-sky-400 hover:text-sky-300 text-sm underline mt-4 inline-block">
            Go to VoicePolish
          </a>
        </div>
      </div>
    );
  }

  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(data.timestamp));

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <header className="text-center mb-6 pt-6">
        <h1 className="text-xl font-bold text-sky-400">VoicePolish</h1>
        <p className="text-slate-500 text-xs mt-1">Shared dictation</p>
      </header>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-slate-500">{date}</span>
          <CopyButton text={data.text} />
        </div>
        <p dir="auto" className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
          {data.text}
        </p>
      </div>

      <div className="text-center mt-6">
        <a
          href="/"
          className="text-sky-400 hover:text-sky-300 text-sm underline"
        >
          Create your own with VoicePolish
        </a>
      </div>
    </div>
  );
}
