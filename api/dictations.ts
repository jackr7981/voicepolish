export const config = { runtime: "edge" };

import { getDb } from "./db";

export default async function handler(req: Request) {
  const sql = getDb();

  // POST — save a dictation pair
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { id, rawText, polishedText, metadata } = body;

      if (!id || !rawText || !polishedText || !metadata) {
        return new Response("Missing fields", { status: 400 });
      }

      const rawWordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
      const polishedWordCount = polishedText.trim() ? polishedText.trim().split(/\s+/).length : 0;

      await sql`
        INSERT INTO raw_dictations (id, raw_text, word_count, duration, wpm, language, profile_id, format_as)
        VALUES (${id}, ${rawText}, ${rawWordCount}, ${metadata.duration}, ${metadata.wpm}, ${metadata.language}, ${metadata.profileId}, ${metadata.formatAs})
      `;

      await sql`
        INSERT INTO polished_dictations (id, dictation_id, polished_text, word_count, profile_id)
        VALUES (${id}, ${id}, ${polishedText}, ${polishedWordCount}, ${metadata.profileId})
      `;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("Save dictation error:", err);
      return new Response(
        JSON.stringify({ ok: false, error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // GET — fetch all dictations (joined)
  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "500"), 500);

      const rows = await sql`
        SELECT
          r.id,
          r.raw_text,
          r.word_count AS raw_word_count,
          r.duration,
          r.wpm,
          r.language,
          r.profile_id,
          r.format_as,
          r.created_at,
          p.polished_text,
          p.word_count AS polished_word_count
        FROM raw_dictations r
        LEFT JOIN polished_dictations p ON r.id = p.dictation_id
        ORDER BY r.created_at DESC
        LIMIT ${limit}
      `;

      return new Response(JSON.stringify({ ok: true, data: rows }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ ok: false, error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // DELETE — clear all dictation data
  if (req.method === "DELETE") {
    try {
      await sql`DELETE FROM polished_dictations`;
      await sql`DELETE FROM raw_dictations`;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ ok: false, error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return new Response("Method not allowed", { status: 405 });
}
