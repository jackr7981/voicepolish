import aiosqlite
import os
import json
import logging

logger = logging.getLogger(__name__)

DB_PATH = os.getenv("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "..", "dictionary.db"))

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS dictionary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                term TEXT NOT NULL UNIQUE,
                preferred_spelling TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS prompt_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT NOT NULL,
                rules TEXT NOT NULL,
                is_default BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()
        await seed_default_profiles(db)

async def seed_default_profiles(db):
    """Insert built-in profiles if they don't exist yet."""
    cursor = await db.execute("SELECT COUNT(*) FROM prompt_profiles")
    count = (await cursor.fetchone())[0]
    if count > 0:
        return

    defaults = [
        {
            "name": "general",
            "description": "Everyday writing — emails, notes, messages",
            "rules": json.dumps([
                "Clean up grammar, punctuation, and capitalization",
                "Remove filler words: um, uh, like, you know, basically, so yeah",
                "Keep the speaker's natural voice and tone",
                "Use professional but approachable language",
                "Break long run-on sentences into readable ones"
            ]),
            "is_default": True
        },
        {
            "name": "coding",
            "description": "Vibe coding — prompts, docs, technical writing",
            "rules": json.dumps([
                "Preserve ALL technical terms exactly: JSX, TSX, Node.js, npm, FastAPI, PostgreSQL, Supabase, React, useState, useEffect, async/await, API, REST, GraphQL, Docker, Redis, Celery, WebSocket, OAuth, JWT, CORS, env, CLI, SDK, IDE, VSCode, Cursor, Windsurf",
                "Never autocorrect code terms: 'component' stays 'component' not 'compartment', 'hook' stays 'hook', 'state' stays 'state'",
                "Format code references in backticks when they appear inline: `useState`, `npm install`, `docker-compose`",
                "Preserve file extensions exactly: .jsx, .tsx, .py, .json, .env, .md, .yaml",
                "Keep command-like phrases intact: 'npm run dev', 'pip install', 'git push'",
                "If the speaker says 'dot' in a technical context, render it as a period: 'Node dot js' → 'Node.js'",
                "Preserve camelCase and PascalCase: useState, onClick, FastAPI, NextAuth"
            ]),
            "is_default": False
        },
        {
            "name": "maritime",
            "description": "Maritime/FSRU operations — reports, logs, procedures",
            "rules": json.dumps([
                "Use IMO standard maritime terminology throughout",
                "Always capitalize: FSRU, LNG, BOG, CTMS, IAS, ISM, SOLAS, MARPOL, BMS, ESD, GVU, HP, LP, MSDS, PPE, SCBA, P&ID",
                "Preserve vessel-specific terms: regasification, send-out, boil-off gas, cargo containment, membrane tank, moss type, heel quantity, sloshing",
                "Use nautical conventions: port/starboard (not left/right), fore/aft, draft not draught",
                "Format tank references consistently: Tank 1, Tank 2 (capitalized with number)",
                "Preserve pressure/temperature units as spoken: barg, psig, °C, °F",
                "Keep procedure reference numbers intact: SSM 04.24.00, FMM 06.07.01",
                "Use 24-hour time format for log entries"
            ]),
            "is_default": False
        },
        {
            "name": "email",
            "description": "Professional emails — formal, structured, polite",
            "rules": json.dumps([
                "Structure as a proper email: greeting, body paragraphs, sign-off",
                "Use professional tone — no slang or contractions",
                "If the speaker mentions a subject line, format it separately at the top",
                "Keep paragraphs concise — max 3-4 sentences each",
                "Add appropriate transitions between ideas",
                "If the speaker rambles, distill to the core message while preserving intent"
            ]),
            "is_default": False
        },
        {
            "name": "casual",
            "description": "Casual chat — texts, DMs, social media",
            "rules": json.dumps([
                "Keep it relaxed and conversational",
                "Contractions are fine: don't, can't, won't, I'm, it's",
                "Don't over-formalize — match how people actually text",
                "Light punctuation — no need for perfect semicolons or em-dashes",
                "Keep sentences short and punchy",
                "Preserve humor, slang, and informal expressions"
            ]),
            "is_default": False
        }
    ]

    for profile in defaults:
        await db.execute(
            "INSERT INTO prompt_profiles (name, description, rules, is_default) VALUES (?, ?, ?, ?)",
            (profile["name"], profile["description"], profile["rules"], profile["is_default"])
        )
    await db.commit()

# ── Dictionary functions ──

async def get_all_dictionary_entries():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT term, preferred_spelling, category FROM dictionary ORDER BY category, term")
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

async def add_dictionary_entry(term: str, preferred_spelling: str, category: str = "general"):
    async with aiosqlite.connect(DB_PATH) as db:
        try:
            await db.execute(
                "INSERT INTO dictionary (term, preferred_spelling, category) VALUES (?, ?, ?)",
                (term, preferred_spelling, category)
            )
            await db.commit()
            return True
        except aiosqlite.IntegrityError:
            # Term already exists — update it
            await db.execute(
                "UPDATE dictionary SET preferred_spelling = ?, category = ? WHERE term = ?",
                (preferred_spelling, category, term)
            )
            await db.commit()
            return False

async def delete_dictionary_entry(term: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("DELETE FROM dictionary WHERE term = ?", (term,))
        await db.commit()
        return cursor.rowcount > 0

async def get_dictionary_as_context() -> str:
    """Format dictionary entries as context string for the LLM prompt."""
    entries = await get_all_dictionary_entries()
    if not entries:
        return ""
    lines = ["## Personal Dictionary — Always use these exact spellings:"]
    for entry in entries:
        lines.append(f"- \"{entry['term']}\" → \"{entry['preferred_spelling']}\" ({entry['category']})")
    return "\n".join(lines)

# ── Prompt Profile functions ──

async def get_all_profiles():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT id, name, description, rules, is_default FROM prompt_profiles ORDER BY is_default DESC, name")
        rows = await cursor.fetchall()
        result = []
        for row in rows:
            r = dict(row)
            try:
                r["rules"] = json.loads(r["rules"])
            except (json.JSONDecodeError, TypeError):
                r["rules"] = []
            result.append(r)
        return result

async def get_profile_by_id(profile_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT id, name, description, rules, is_default FROM prompt_profiles WHERE id = ?", (profile_id,))
        row = await cursor.fetchone()
        if row:
            r = dict(row)
            try:
                r["rules"] = json.loads(r["rules"])
            except (json.JSONDecodeError, TypeError):
                r["rules"] = []
            return r
        return None

async def get_default_profile():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT id, name, description, rules, is_default FROM prompt_profiles WHERE is_default = 1 LIMIT 1")
        row = await cursor.fetchone()
        if row:
            r = dict(row)
            try:
                r["rules"] = json.loads(r["rules"])
            except (json.JSONDecodeError, TypeError):
                r["rules"] = []
            return r
        return None

async def add_profile(name: str, description: str, rules: list[str], is_default: bool = False) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO prompt_profiles (name, description, rules, is_default) VALUES (?, ?, ?, ?)",
            (name, description, json.dumps(rules), is_default)
        )
        await db.commit()
        return cursor.lastrowid

async def update_profile(profile_id: int, name: str, description: str, rules: list[str]) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "UPDATE prompt_profiles SET name = ?, description = ?, rules = ? WHERE id = ?",
            (name, description, json.dumps(rules), profile_id)
        )
        await db.commit()
        return cursor.rowcount > 0

async def delete_profile(profile_id: int) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("DELETE FROM prompt_profiles WHERE id = ? AND is_default = 0", (profile_id,))
        await db.commit()
        return cursor.rowcount > 0

async def get_profile_as_context(profile_id: int = None) -> str:
    """Format profile rules as context string for the LLM prompt."""
    if profile_id is not None:
        profile = await get_profile_by_id(profile_id)
    else:
        profile = await get_default_profile()

    if not profile:
        return ""

    lines = [f"## Active Profile: {profile['name']}", f"Context: {profile['description']}", "", "Follow these rules strictly:"]
    for i, rule in enumerate(profile["rules"], 1):
        lines.append(f"{i}. {rule}")
    return "\n".join(lines)
