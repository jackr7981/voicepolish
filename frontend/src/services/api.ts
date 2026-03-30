export async function polishStream(
  prompt: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (error: string) => void
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
      if (data.error) onError(data.error);
      if (data.done) { onDone(); return; }
    } catch {}
  }

  onDone();
}
