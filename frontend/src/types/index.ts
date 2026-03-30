export interface DictionaryEntry {
  term: string;
  preferred_spelling: string;
  category: string;
}

export interface PromptProfile {
  id: string;
  name: string;
  description: string;
  rules: string[];
  is_default?: boolean;
}

export interface HistoryEntry {
  raw: string;
  polished: string;
  profileId: string | null;
  timestamp: number;
}
