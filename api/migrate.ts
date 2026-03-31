export const config = { runtime: "edge" };

import { getDb } from "./db";

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("POST to run migration", { status: 405 });
  }

  const sql = getDb();

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS raw_dictations (
        id TEXT PRIMARY KEY,
        raw_text TEXT NOT NULL,
        word_count INT NOT NULL DEFAULT 0,
        duration INT NOT NULL DEFAULT 0,
        wpm INT NOT NULL DEFAULT 0,
        language TEXT NOT NULL DEFAULT 'en-US',
        profile_id TEXT,
        format_as TEXT NOT NULL DEFAULT 'auto',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS polished_dictations (
        id TEXT PRIMARY KEY,
        dictation_id TEXT NOT NULL REFERENCES raw_dictations(id) ON DELETE CASCADE,
        polished_text TEXT NOT NULL,
        word_count INT NOT NULL DEFAULT 0,
        profile_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_raw_created ON raw_dictations(created_at DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_polished_dictation ON polished_dictations(dictation_id)
    `;

    return new Response(JSON.stringify({ ok: true, message: "Migration complete" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
