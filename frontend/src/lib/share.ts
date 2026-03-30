export function encodeShareData(text: string, timestamp: number): string {
  const json = JSON.stringify({ t: text, ts: timestamp });
  const bytes = new TextEncoder().encode(json);
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShareData(encoded: string): { text: string; timestamp: number } | null {
  try {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const data = JSON.parse(json);
    if (typeof data.t === "string" && typeof data.ts === "number") {
      return { text: data.t, timestamp: data.ts };
    }
    return null;
  } catch {
    return null;
  }
}

export function generateShareUrl(text: string, timestamp: number): string | null {
  const encoded = encodeShareData(text, timestamp);
  const url = `${window.location.origin}/share#${encoded}`;
  if (url.length > 8000) return null;
  return url;
}
