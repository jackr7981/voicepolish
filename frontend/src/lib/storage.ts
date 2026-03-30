import { PromptProfile, DictionaryEntry } from "../types";
import { DEFAULT_PROFILES } from "../data/defaults";

const PROFILES_KEY = "voicepolish_profiles";
const DICTIONARY_KEY = "voicepolish_dictionary";

export function loadProfiles(): PromptProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // First load — seed defaults
  saveProfiles(DEFAULT_PROFILES);
  return DEFAULT_PROFILES;
}

export function saveProfiles(profiles: PromptProfile[]): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function loadDictionary(): DictionaryEntry[] {
  try {
    const raw = localStorage.getItem(DICTIONARY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveDictionary(entries: DictionaryEntry[]): void {
  localStorage.setItem(DICTIONARY_KEY, JSON.stringify(entries));
}
