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

export interface UsageData {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface SupportedLanguage {
  code: string;
  label: string;
  native: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en-US", label: "English", native: "English" },
  { code: "es-ES", label: "Spanish", native: "Espa\u00f1ol" },
  { code: "fr-FR", label: "French", native: "Fran\u00e7ais" },
  { code: "de-DE", label: "German", native: "Deutsch" },
  { code: "ar-SA", label: "Arabic", native: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
  { code: "zh-CN", label: "Chinese", native: "\u4e2d\u6587" },
  { code: "ja-JP", label: "Japanese", native: "\u65e5\u672c\u8a9e" },
  { code: "hi-IN", label: "Hindi", native: "\u0939\u093f\u0928\u094d\u0926\u0940" },
  { code: "pt-BR", label: "Portuguese", native: "Portugu\u00eas" },
  { code: "bn-BD", label: "Bengali", native: "\u09ac\u09be\u0982\u09b2\u09be" },
];
