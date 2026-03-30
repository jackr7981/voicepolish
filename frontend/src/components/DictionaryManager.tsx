import { useState } from "react";
import { DictionaryEntry } from "../types";

interface DictionaryManagerProps {
  entries: DictionaryEntry[];
  onAdd: (entry: DictionaryEntry) => void;
  onDelete: (term: string) => void;
}

export function DictionaryManager({ entries, onAdd, onDelete }: DictionaryManagerProps) {
  const [term, setTerm] = useState("");
  const [spelling, setSpelling] = useState("");
  const [category, setCategory] = useState("general");
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    if (!term || !spelling) return;
    onAdd({ term, preferred_spelling: spelling, category });
    setTerm("");
    setSpelling("");
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-sky-400 hover:text-sky-300 underline"
      >
        {isOpen ? "Hide Dictionary" : "Manage Dictionary"}
      </button>

      {isOpen && (
        <div className="mt-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex gap-2 mb-4 flex-wrap">
            <input
              type="text"
              placeholder="Term (e.g. fsru)"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="bg-slate-700 text-sm rounded px-3 py-2 text-white placeholder-slate-400 flex-1 min-w-[100px]"
            />
            <input
              type="text"
              placeholder="Correct spelling (e.g. FSRU)"
              value={spelling}
              onChange={(e) => setSpelling(e.target.value)}
              className="bg-slate-700 text-sm rounded px-3 py-2 text-white placeholder-slate-400 flex-1 min-w-[100px]"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-700 text-sm rounded px-3 py-2 text-white"
            >
              <option value="general">General</option>
              <option value="maritime">Maritime</option>
              <option value="technical">Technical</option>
              <option value="names">Names</option>
            </select>
            <button
              onClick={handleAdd}
              className="bg-sky-500 hover:bg-sky-400 text-white text-sm px-4 py-2 rounded min-h-[44px]"
            >
              Add
            </button>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {entries.map((entry) => (
              <div key={entry.term} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-700/50">
                <span>
                  <span className="text-slate-400">{entry.term}</span>
                  <span className="text-slate-500 mx-2">&rarr;</span>
                  <span className="text-sky-300">{entry.preferred_spelling}</span>
                  <span className="text-slate-500 text-xs ml-2">({entry.category})</span>
                </span>
                <button
                  onClick={() => onDelete(entry.term)}
                  className="text-red-400 hover:text-red-300 text-xs px-2 py-1 min-h-[32px]"
                >
                  Remove
                </button>
              </div>
            ))}
            {entries.length === 0 && (
              <p className="text-slate-500 text-sm italic">No dictionary entries yet. Add terms the AI should always spell correctly.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
