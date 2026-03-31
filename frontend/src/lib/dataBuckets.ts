// Persistent data buckets for raw dictation input and polished output.
// Dual-write: localStorage (fast cache) + Vercel Postgres via API (source of truth).

import { saveDictation, fetchDictations, clearDictations, DictationRow } from "../services/api";

const RAW_KEY = "vp_raw_bucket";
const POLISHED_KEY = "vp_polished_bucket";
const MAX_ENTRIES = 500;
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export interface RawBucketEntry {
  id: string;
  rawText: string;
  wordCount: number;
  timestamp: number;
  duration: number;
  wpm: number;
  language: string;
  profileId: string | null;
  formatAs: string;
}

export interface PolishedBucketEntry {
  id: string;
  polishedText: string;
  wordCount: number;
  timestamp: number;
  rawId: string;
  profileId: string | null;
}

export interface DictationMetadata {
  rawTranscript: string;
  duration: number;
  wpm: number;
  language: string;
  formatAs: string;
}

export interface BucketStats {
  totalDictations: number;
  avgWpm: number;
  avgRawWordCount: number;
  avgPolishedWordCount: number;
  totalRawWords: number;
  totalPolishedWords: number;
  avgDuration: number;
  mostUsedProfileId: string | null;
  mostUsedLanguage: string;
  oldestEntry: number | null;
  newestEntry: number | null;
}

function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function readBucket<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeBucket<T>(key: string, entries: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(entries));
  } catch (e) {
    console.warn("Data bucket write failed (storage full?):", e);
  }
}

function prune<T extends { timestamp: number }>(entries: T[]): T[] {
  const cutoff = Date.now() - RETENTION_MS;
  const fresh = entries.filter((e) => e.timestamp >= cutoff);
  return fresh.length > MAX_ENTRIES ? fresh.slice(-MAX_ENTRIES) : fresh;
}

export function recordDictation(
  polishedText: string,
  metadata: DictationMetadata,
  profileId: string | null
): void {
  const id = crypto.randomUUID();
  const now = Date.now();

  const rawEntry: RawBucketEntry = {
    id,
    rawText: metadata.rawTranscript,
    wordCount: countWords(metadata.rawTranscript),
    timestamp: now,
    duration: metadata.duration,
    wpm: metadata.wpm,
    language: metadata.language,
    profileId,
    formatAs: metadata.formatAs,
  };

  const polishedEntry: PolishedBucketEntry = {
    id,
    polishedText,
    wordCount: countWords(polishedText),
    timestamp: now,
    rawId: id,
    profileId,
  };

  const rawBucket = readBucket<RawBucketEntry>(RAW_KEY);
  const polishedBucket = readBucket<PolishedBucketEntry>(POLISHED_KEY);

  rawBucket.push(rawEntry);
  polishedBucket.push(polishedEntry);

  writeBucket(RAW_KEY, prune(rawBucket));
  writeBucket(POLISHED_KEY, prune(polishedBucket));

  // Dual-write to Postgres (fire-and-forget)
  saveDictation({
    id,
    rawText: metadata.rawTranscript,
    polishedText,
    metadata: {
      duration: metadata.duration,
      wpm: metadata.wpm,
      language: metadata.language,
      profileId,
      formatAs: metadata.formatAs,
    },
  });
}

function mode<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  const counts = new Map<T, number>();
  let best: T = items[0];
  let bestCount = 0;
  for (const item of items) {
    const c = (counts.get(item) ?? 0) + 1;
    counts.set(item, c);
    if (c > bestCount) {
      best = item;
      bestCount = c;
    }
  }
  return best;
}

export function getStats(): BucketStats {
  const raw = readBucket<RawBucketEntry>(RAW_KEY);
  const polished = readBucket<PolishedBucketEntry>(POLISHED_KEY);
  const n = raw.length;

  if (n === 0) {
    return {
      totalDictations: 0, avgWpm: 0, avgRawWordCount: 0,
      avgPolishedWordCount: 0, totalRawWords: 0, totalPolishedWords: 0,
      avgDuration: 0, mostUsedProfileId: null,
      mostUsedLanguage: "en-US", oldestEntry: null, newestEntry: null,
    };
  }

  const totalRawWords = raw.reduce((s, e) => s + e.wordCount, 0);
  const totalPolishedWords = polished.reduce((s, e) => s + e.wordCount, 0);
  const totalDuration = raw.reduce((s, e) => s + e.duration, 0);
  const wpmEntries = raw.filter((e) => e.wpm > 0);
  const totalWpm = wpmEntries.reduce((s, e) => s + e.wpm, 0);

  return {
    totalDictations: n,
    avgWpm: wpmEntries.length > 0 ? Math.round(totalWpm / wpmEntries.length) : 0,
    avgRawWordCount: Math.round(totalRawWords / n),
    avgPolishedWordCount: polished.length > 0 ? Math.round(totalPolishedWords / polished.length) : 0,
    totalRawWords,
    totalPolishedWords,
    avgDuration: Math.round(totalDuration / n),
    mostUsedProfileId: mode(raw.map((e) => e.profileId)),
    mostUsedLanguage: mode(raw.map((e) => e.language)) ?? "en-US",
    oldestEntry: raw[0]?.timestamp ?? null,
    newestEntry: raw[raw.length - 1]?.timestamp ?? null,
  };
}

export function getBucketSizes(): { raw: number; polished: number } {
  return {
    raw: readBucket<RawBucketEntry>(RAW_KEY).length,
    polished: readBucket<PolishedBucketEntry>(POLISHED_KEY).length,
  };
}

// --- Export ---

function escapeCsv(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function exportAsJson(): string {
  return JSON.stringify(
    { raw: readBucket<RawBucketEntry>(RAW_KEY), polished: readBucket<PolishedBucketEntry>(POLISHED_KEY) },
    null,
    2
  );
}

export function exportJoinedCsv(): string {
  const raw = readBucket<RawBucketEntry>(RAW_KEY);
  const polishedMap = new Map(
    readBucket<PolishedBucketEntry>(POLISHED_KEY).map((e) => [e.id, e])
  );

  const headers = "id,rawText,rawWordCount,polishedText,polishedWordCount,timestamp,duration,wpm,language,profileId,formatAs";
  const rows = raw.map((r) => {
    const p = polishedMap.get(r.id);
    return [
      r.id,
      escapeCsv(r.rawText),
      r.wordCount,
      escapeCsv(p?.polishedText ?? ""),
      p?.wordCount ?? 0,
      new Date(r.timestamp).toISOString(),
      r.duration,
      r.wpm,
      r.language,
      r.profileId ?? "",
      r.formatAs,
    ].join(",");
  });

  return [headers, ...rows].join("\n");
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function clearBuckets(): void {
  localStorage.removeItem(RAW_KEY);
  localStorage.removeItem(POLISHED_KEY);
  clearDictations().catch(() => {});
}

// --- API-backed functions (Postgres as source of truth) ---

export function computeStatsFromRows(rows: DictationRow[]): BucketStats {
  const n = rows.length;
  if (n === 0) {
    return {
      totalDictations: 0, avgWpm: 0, avgRawWordCount: 0,
      avgPolishedWordCount: 0, totalRawWords: 0, totalPolishedWords: 0,
      avgDuration: 0, mostUsedProfileId: null,
      mostUsedLanguage: "en-US", oldestEntry: null, newestEntry: null,
    };
  }

  const totalRawWords = rows.reduce((s, r) => s + r.raw_word_count, 0);
  const totalPolishedWords = rows.reduce((s, r) => s + r.polished_word_count, 0);
  const totalDuration = rows.reduce((s, r) => s + r.duration, 0);
  const wpmRows = rows.filter((r) => r.wpm > 0);
  const totalWpm = wpmRows.reduce((s, r) => s + r.wpm, 0);

  return {
    totalDictations: n,
    avgWpm: wpmRows.length > 0 ? Math.round(totalWpm / wpmRows.length) : 0,
    avgRawWordCount: Math.round(totalRawWords / n),
    avgPolishedWordCount: Math.round(totalPolishedWords / n),
    totalRawWords,
    totalPolishedWords,
    avgDuration: Math.round(totalDuration / n),
    mostUsedProfileId: mode(rows.map((r) => r.profile_id)),
    mostUsedLanguage: mode(rows.map((r) => r.language)) ?? "en-US",
    oldestEntry: rows.length > 0 ? new Date(rows[rows.length - 1].created_at).getTime() : null,
    newestEntry: rows.length > 0 ? new Date(rows[0].created_at).getTime() : null,
  };
}

export function exportRowsAsJson(rows: DictationRow[]): string {
  return JSON.stringify(rows, null, 2);
}

export function exportRowsAsCsv(rows: DictationRow[]): string {
  const headers = "id,rawText,rawWordCount,polishedText,polishedWordCount,timestamp,duration,wpm,language,profileId,formatAs";
  const csvRows = rows.map((r) =>
    [
      r.id,
      escapeCsv(r.raw_text),
      r.raw_word_count,
      escapeCsv(r.polished_text),
      r.polished_word_count,
      r.created_at,
      r.duration,
      r.wpm,
      r.language,
      r.profile_id ?? "",
      r.format_as,
    ].join(",")
  );
  return [headers, ...csvRows].join("\n");
}

export async function fetchAndComputeStats(): Promise<{ stats: BucketStats; rows: DictationRow[] }> {
  const rows = await fetchDictations();
  return { stats: computeStatsFromRows(rows), rows };
}
