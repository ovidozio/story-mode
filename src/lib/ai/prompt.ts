// src/lib/ai/prompt.ts
import type { PathStep } from "./schema";

// ———————————————————————————————————————————————————————————————
// System prompt: strict contract + pacing + JSON hardening
// ———————————————————————————————————————————————————————————————
export function buildSystemPrompt(): string {
  return [
`You must output ONLY a single JSON object describing ONE interactive scene.`,

`SCHEMA (exact keys, exact beats, no extras):
{
  "id": string,
  "title": string (optional),
  "start": "root",
  "beats": {
    "root": { "id": "root", "text": string, "choices": [ { "label": string, "to": string }, { "label": string, "to": string } ] },
    "0":    { "id": "0",    "text": string, "choices": [ { "label": string, "to": string }, { "label": string, "to": string } ] },
    "1":    { "id": "1",    "text": string, "choices": [ { "label": string, "to": string }, { "label": string, "to": string } ] },
    "00":   { "id": "00",   "text": string },
    "01":   { "id": "01",   "text": string },
    "10":   { "id": "10",   "text": string },
    "11":   { "id": "11",   "text": string }
  }
}`,

`LINKS:
- All "to" values MUST be fully-qualified and use the SAME scene id (NEW_SCENE_ID):
  "NEW_SCENE_ID.0" | "NEW_SCENE_ID.1" | "NEW_SCENE_ID.00" | "NEW_SCENE_ID.01" | "NEW_SCENE_ID.10" | "NEW_SCENE_ID.11".`,

`STYLE (longer beats):
- Each beat's "text" must be 5–7 sentences (~120–220 words).
- Paragraphs allowed via "\\n\\n" only (no markdown, no code fences).
- Safe inline HTML permitted: <em>, <strong>, <span class="dotted">…</span>, <span class="veil">…</span>.
- Choice labels short and evocative (≤48 chars), no trailing punctuation.`,

`OUTER-SPACE ARC (mandatory):
- Foreshadow space/flight throughout, and by EACH terminal beat ("00","01","10","11") the protagonist is in outer space (e.g., launch, orbit, transfer, or aboard a vehicle en route).
- The path to space can differ by branch, but arrival in space must be explicit in every terminal beat.`,

`CONSTRAINTS:
- Do not contradict HISTORY. Maintain continuity of characters, objects, tone, and facts.
- Respect USER_HINT if present; weave it naturally.
- Keep total characters under MAX_CHARS. Shorten prose while keeping 5 sentences if needed.
- Non-terminals ("root","0","1") MUST have exactly 2 choices.
- Terminals ("00","01","10","11") MUST have NO "choices" field at all.
- Beat "id" must equal its key ("id":"00" under key "00", etc.).`,

`STRICT JSON RULES (no exceptions):
- Return pure JSON parseable by JSON.parse().
- Use standard double quotes for all keys/strings.
- Escape any inner quotes inside "text" like \\"this\\".
- No trailing commas, no comments, no undefined, no NaN/Infinity.
- ASCII is fine; if you use newlines, encode as "\\n" inside strings.
- Do NOT wrap the JSON in code fences or prose. Output ONLY the object.`,

`FAIL-SAFE:
- If you cannot satisfy all stylistic preferences within MAX_CHARS, prefer concise sentences that preserve continuity, the outer-space requirement, and the schema.
- Never omit required beats or keys. Never add extra keys.`
  ].join("\n");
}

// ———————————————————————————————————————————————————————————————
// User prompt: context + explicit budgets
// ———————————————————————————————————————————————————————————————
export function buildUserPrompt(args: {
  history: PathStep[];
  user_hint?: string;
  max_chars: number;
  newSceneId: string;
}) {
  const { history, user_hint, max_chars, newSceneId } = args;

  const path = history
    .map(h => `${h.sceneId}.${h.beatId}${h.choiceLabel ? `→${h.choiceLabel}` : ""}`)
    .join("  |  ");

  const last = history[history.length - 1];
  const lastExcerpt = last?.excerpt ? sanitize(last.excerpt).slice(0, 400) : "";

  // pacing hint for the model to distribute length
  const perBeatBudget = Math.max(300, Math.floor(max_chars / 7)); // chars per beat (min 300)

  return [
    `NEW_SCENE_ID: ${newSceneId}`,
    `MAX_CHARS: ${max_chars}`,
    `PER_BEAT_CHAR_BUDGET: ~${perBeatBudget}`,
    `TARGET_BEAT_LENGTH: 5–7 sentences (~120–220 words) per beat.`,
    `USER_HINT: ${user_hint ? sanitize(user_hint).slice(0, 280) : "(none)"}`,
    `HISTORY_PATH: ${path || "(start)"}`,
    `LAST_EXCERPT: ${lastExcerpt || "(none)"}`,
    ``,
    `TASK: Continue coherently after the history. Use NEW_SCENE_ID in EVERY "to".`,
    `Emit exactly these beats: root, 0, 1, 00, 01, 10, 11.`,
    `Ensure every terminal beat places the protagonist in OUTER SPACE explicitly.`,
    `Return ONLY the scene JSON object, matching the SCHEMA precisely.`
  ].join("\n");
}

function sanitize(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

