import { UsageData } from "../types";

const USAGE_KEY = "vp_usage";
const MAX_DAYS = 30;

// Claude 3.5 Haiku on OpenRouter (rates may change)
const INPUT_COST_PER_M = 0.80;
const OUTPUT_COST_PER_M = 4.00;

interface DailyUsage {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  requests: number;
}

interface UsageStore {
  daily: DailyUsage[];
  lifetime_tokens: number;
  lifetime_requests: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function load(): UsageStore {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { daily: [], lifetime_tokens: 0, lifetime_requests: 0 };
}

function save(store: UsageStore): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(store));
}

export function recordUsage(usage: UsageData): void {
  const store = load();
  const d = today();

  let entry = store.daily.find((e) => e.date === d);
  if (!entry) {
    entry = { date: d, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, requests: 0 };
    store.daily.push(entry);
  }

  entry.prompt_tokens += usage.prompt_tokens;
  entry.completion_tokens += usage.completion_tokens;
  entry.total_tokens += usage.total_tokens;
  entry.requests += 1;

  store.lifetime_tokens += usage.total_tokens;
  store.lifetime_requests += 1;

  // Prune entries older than 30 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  store.daily = store.daily.filter((e) => e.date >= cutoffStr);

  save(store);
  window.dispatchEvent(new Event("vp_usage_updated"));
}

export function getTodayUsage(): DailyUsage | null {
  const store = load();
  return store.daily.find((e) => e.date === today()) ?? null;
}

export function getLifetimeUsage(): { tokens: number; requests: number } {
  const store = load();
  return { tokens: store.lifetime_tokens, requests: store.lifetime_requests };
}

export function estimateCost(promptTokens: number, completionTokens: number): number {
  return (promptTokens / 1_000_000) * INPUT_COST_PER_M + (completionTokens / 1_000_000) * OUTPUT_COST_PER_M;
}
