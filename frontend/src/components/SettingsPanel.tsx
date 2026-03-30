import { PromptProfile, SUPPORTED_LANGUAGES } from "../types";

type FormatAs = "auto" | "paragraph" | "bullets" | "numbered";

interface SettingsPanelProps {
  profiles: PromptProfile[];
  activeProfileId: string | null;
  setActiveProfileId: (id: string | null) => void;
  formatAs: FormatAs;
  setFormatAs: (f: FormatAs) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

export function SettingsPanel({ profiles, activeProfileId, setActiveProfileId, formatAs, setFormatAs, language, setLanguage }: SettingsPanelProps) {
  return (
    <div className="flex gap-4 flex-wrap w-full justify-center">
      <div>
        <label className="text-xs text-slate-400 block mb-1">Profile</label>
        <select
          value={activeProfileId ?? ""}
          onChange={(e) => setActiveProfileId(e.target.value || null)}
          className="bg-slate-700 text-sm rounded px-3 py-2 text-white"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.is_default ? "(default)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-slate-700 text-sm rounded px-3 py-2 text-white"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">Format</label>
        <select
          value={formatAs}
          onChange={(e) => setFormatAs(e.target.value as FormatAs)}
          className="bg-slate-700 text-sm rounded px-3 py-2 text-white"
        >
          <option value="auto">Auto-detect</option>
          <option value="paragraph">Paragraph</option>
          <option value="bullets">Bullet Points</option>
          <option value="numbered">Numbered List</option>
        </select>
      </div>
    </div>
  );
}
