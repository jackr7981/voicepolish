import { useState } from "react";
import { PromptProfile } from "../types";

interface ProfileManagerProps {
  profiles: PromptProfile[];
  onAdd: (profile: Omit<PromptProfile, "id">) => void;
  onDelete: (id: string) => void;
}

export function ProfileManager({ profiles, onAdd, onDelete }: ProfileManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRules, setNewRules] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName || !newDescription || !newRules) return;
    const rules = newRules.split("\n").map((r) => r.trim()).filter(Boolean);
    onAdd({ name: newName, description: newDescription, rules });
    setNewName("");
    setNewDescription("");
    setNewRules("");
    setShowAdd(false);
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-sky-400 hover:text-sky-300 underline"
      >
        {isOpen ? "Hide Prompt Profiles" : "Manage Prompt Profiles"}
      </button>

      {isOpen && (
        <div className="mt-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {profiles.map((profile) => (
              <div key={profile.id} className="border border-slate-700/50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div
                    className="cursor-pointer flex-1"
                    onClick={() => setExpandedId(expandedId === profile.id ? null : profile.id)}
                  >
                    <span className="text-sm font-medium text-sky-300">{profile.name}</span>
                    {profile.is_default && (
                      <span className="text-xs ml-2 px-1.5 py-0.5 bg-sky-500/20 text-sky-400 rounded">default</span>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">{profile.description}</p>
                  </div>
                  {!profile.is_default && (
                    <button
                      onClick={() => onDelete(profile.id)}
                      className="text-red-400 hover:text-red-300 text-xs ml-2 px-2 py-1 min-h-[32px]"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {expandedId === profile.id && (
                  <div className="mt-2 pl-2 border-l-2 border-slate-600">
                    {profile.rules.map((rule, i) => (
                      <p key={i} className="text-xs text-slate-400 py-0.5">
                        {i + 1}. {rule}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {showAdd ? (
            <div className="space-y-2 border-t border-slate-700 pt-3">
              <input type="text" placeholder="Profile name (e.g. vibe-coding)" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-slate-700 text-sm rounded px-3 py-2 text-white placeholder-slate-400" />
              <input type="text" placeholder="Short description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full bg-slate-700 text-sm rounded px-3 py-2 text-white placeholder-slate-400" />
              <textarea placeholder={"Rules (one per line):\nPreserve JSX and TSX exactly\nFormat code in backticks\n..."} value={newRules} onChange={(e) => setNewRules(e.target.value)} rows={4} className="w-full bg-slate-700 text-sm rounded px-3 py-2 text-white placeholder-slate-400 resize-none" />
              <div className="flex gap-2">
                <button onClick={handleAdd} className="bg-sky-500 hover:bg-sky-400 text-white text-sm px-4 py-2 rounded">Save Profile</button>
                <button onClick={() => setShowAdd(false)} className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)} className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded">+ Add Custom Profile</button>
          )}
        </div>
      )}
    </div>
  );
}
