export interface PolishRequest {
  raw_text: string;
  profile_id: number | null;
  format_as: "auto" | "paragraph" | "bullets" | "numbered";
}

export interface PolishResponse {
  polished_text: string;
  changes_summary: string;
}

export interface DictionaryEntry {
  term: string;
  preferred_spelling: string;
  category: string;
}

export interface PromptProfile {
  id?: number;
  name: string;
  description: string;
  rules: string[];
  is_default?: boolean;
}

export interface HistoryEntry {
  raw: string;
  polished: string;
  profileId: number | null;
  timestamp: number;
}
