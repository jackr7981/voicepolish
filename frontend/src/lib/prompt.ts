import { PromptProfile, DictionaryEntry } from "../types";

export function buildPolishPrompt(
  rawText: string,
  profile: PromptProfile | null,
  dictionary: DictionaryEntry[],
  formatAs: string
): string {
  const formatInstruction = getFormatInstruction(formatAs);
  const profileContext = profile ? buildProfileContext(profile) : "";
  const dictionaryContext = dictionary.length > 0 ? buildDictionaryContext(dictionary) : "";

  return `You are an expert voice-to-text polishing engine, similar to Wispr Flow. You transform raw voice dictation into clean, natural, publication-ready text.

## Core Principles:
- Preserve the speaker's EXACT intent, voice, and personality
- The output should read as if the speaker typed it perfectly — not as if an AI rewrote it
- Be invisible: the best polish is one the speaker wouldn't even notice

## Polishing Rules:
1. REMOVE all filler words and verbal tics: um, uh, like, you know, basically, actually, so yeah, I mean, kind of, sort of, right, okay so, well, literally, honestly, obviously
2. REMOVE false starts and self-corrections: "I want to — no wait — I need to" → "I need to"
3. REMOVE verbal repetitions: "the the", "I I think", "so so"
4. FIX grammar, punctuation, and capitalization naturally
5. ADD proper punctuation where the speaker clearly intended it (pauses = commas/periods, rising tone = question marks)
6. BREAK run-on sentences into clean, readable ones — but keep short punchy sentences short
7. PRESERVE contractions if the speaker uses them — don't formalize "don't" into "do not"
8. PRESERVE the speaker's vocabulary level — don't upgrade simple words to fancy ones
9. NEVER add information, opinions, or content the speaker didn't say
10. NEVER add greetings, sign-offs, or structure the speaker didn't indicate

## Format:
${formatInstruction}

${profileContext}

${dictionaryContext}

## Output:
Return ONLY the polished text. No preamble, no explanation, no quotes, no markdown formatting unless the profile specifically requests it.

---

RAW DICTATION:
${rawText}

---

POLISHED TEXT:`;
}

function getFormatInstruction(formatAs: string): string {
  switch (formatAs) {
    case "auto":
      return (
        "Automatically detect the best format based on the content:\n" +
        "- If the speaker is listing items or steps → use bullet points or numbered list\n" +
        "- If the speaker is giving instructions in sequence → use numbered list\n" +
        "- Otherwise → use flowing paragraphs\n" +
        "- Short messages (under 2 sentences) → keep as a single line, no bullet points"
      );
    case "bullets":
      return "Format as bullet points. Each distinct idea gets its own bullet.";
    case "numbered":
      return "Format as a numbered list. Each step or point gets a number.";
    default:
      return "Format as flowing paragraph(s). Use natural paragraph breaks for topic changes.";
  }
}

function buildProfileContext(profile: PromptProfile): string {
  const lines = [
    `## Active Profile: ${profile.name}`,
    `Context: ${profile.description}`,
    "",
    "Follow these rules strictly:",
  ];
  profile.rules.forEach((rule, i) => lines.push(`${i + 1}. ${rule}`));
  return lines.join("\n");
}

function buildDictionaryContext(entries: DictionaryEntry[]): string {
  const lines = ["## Personal Dictionary — Always use these exact spellings:"];
  entries.forEach((e) => lines.push(`- "${e.term}" → "${e.preferred_spelling}" (${e.category})`));
  return lines.join("\n");
}
