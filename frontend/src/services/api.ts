import { PolishRequest, DictionaryEntry, PromptProfile } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function polishTextStream(
  request: PolishRequest,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/polish/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    onError(`Polish request failed (${res.status})`);
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

  // Flush remaining buffer after stream ends
  if (buffer.trim()) {
    const remaining = buffer.trim();
    if (remaining.startsWith("data: ")) {
      try {
        const data = JSON.parse(remaining.slice(6));
        if (data.token) onToken(data.token);
        if (data.error) onError(data.error);
        if (data.done) {
          onDone();
          return;
        }
      } catch {
        // skip
      }
    }
  }

  // If we reach here without onDone being called, call it
  onDone();
}

// ── Dictionary ──

async function checkResponse(res: Response, action: string): Promise<Response> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${action} failed (${res.status}): ${body}`);
  }
  return res;
}

export async function getDictionary(): Promise<DictionaryEntry[]> {
  const res = await fetch(`${API_BASE}/api/dictionary`);
  await checkResponse(res, "Load dictionary");
  const data = await res.json();
  return data.entries;
}

export async function addDictionaryEntry(entry: DictionaryEntry): Promise<void> {
  const res = await fetch(`${API_BASE}/api/dictionary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  await checkResponse(res, "Add dictionary entry");
}

export async function deleteDictionaryEntry(term: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/dictionary/${encodeURIComponent(term)}`, {
    method: "DELETE",
  });
  await checkResponse(res, "Delete dictionary entry");
}

// ── Profiles ──

export async function getProfiles(): Promise<PromptProfile[]> {
  const res = await fetch(`${API_BASE}/api/profiles`);
  await checkResponse(res, "Load profiles");
  const data = await res.json();
  return data.profiles;
}

export async function createProfile(profile: PromptProfile): Promise<void> {
  const res = await fetch(`${API_BASE}/api/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  await checkResponse(res, "Create profile");
}

export async function deleteProfile(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/profiles/${id}`, {
    method: "DELETE",
  });
  await checkResponse(res, "Delete profile");
}
