import { UsageData } from "../types";

// --- Dictation persistence API ---

export interface DictationPayload {
  id: string;
  rawText: string;
  polishedText: string;
  metadata: {
    duration: number;
    wpm: number;
    language: string;
    profileId: string | null;
    formatAs: string;
  };
}

export interface DictationRow {
  id: string;
  raw_text: string;
  raw_word_count: number;
  duration: number;
  wpm: number;
  language: string;
  profile_id: string | null;
  format_as: string;
  created_at: string;
  polished_text: string;
  polished_word_count: number;
}

export async function saveDictation(payload: DictationPayload): Promise<void> {
  try {
    await fetch("/api/dictations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Fire-and-forget — don't block UI
  }
}

export async function fetchDictations(limit = 500): Promise<DictationRow[]> {
  const res = await fetch(`/api/dictations?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch dictations");
  const json = await res.json();
  return json.data ?? [];
}

export async function clearDictations(): Promise<void> {
  const res = await fetch("/api/dictations", { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to clear dictations");
}

export async function polishStream(
  prompt: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  onUsage?: (usage: UsageData) => void
): Promise<void> {
  const res = await fetch("/api/polish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    onError(`Polish failed (${res.status}): ${body}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError("No response stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.token) onToken(data.token);
        if (data.usage && onUsage) onUsage(data.usage);
        if (data.error) onError(data.error);
        if (data.done) {
          onDone();
          return;
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim()?.startsWith("data: ")) {
    try {
      const data = JSON.parse(buffer.trim().slice(6));
      if (data.token) onToken(data.token);
      if (data.usage && onUsage) onUsage(data.usage);
      if (data.error) onError(data.error);
      if (data.done) { onDone(); return; }
    } catch {}
  }

  onDone();
}
