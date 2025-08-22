import type { RequestHandler } from './$types';
import { canGenerate, clientKeyFrom, consume } from '$lib/server/quota';
import { buildSystemPrompt, buildUserPrompt } from '$lib/ai/prompt';
import type { Scene } from '$lib/ai/schema';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MAX_CHARS = 3000;
const REQUEST_TIMEOUT_MS = 30000;

async function callOpenAI(system: string, user: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${OPENAI_API_KEY}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' }, // force single JSON object
        temperature: 0.8,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      }),
      signal: ctrl.signal
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`OpenAI error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') throw new Error('No content from model');

    let obj: unknown;
    try {
      obj = JSON.parse(text);
    } catch {
      throw new Error('Model did not return valid JSON');
    }
    return obj as Scene;
  } finally {
    clearTimeout(t);
  }
}

export const POST: RequestHandler = async (event) => {
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'server_misconfig', message: 'Missing OPENAI_API_KEY' }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }

  // Per-IP quota
  const clientKey = clientKeyFrom(event.request.headers, event.getClientAddress);
  const { allowed, remaining, limit } = await canGenerate(clientKey);
  if (!allowed) {
    return new Response(JSON.stringify({
      error: 'limit_exceeded',
      message: `You’ve reached the limit of ${limit} story evolutions for this IP.`,
      remaining: 0
    }), { status: 429, headers: { 'content-type': 'application/json' } });
  }

  // Read client payload
  let payload: {
    history?: Array<{ sceneId: string; beatId: string; choiceLabel?: string; excerpt?: string }>;
    user_hint?: string;
    newSceneId?: string;
  } = {};
  try { payload = await event.request.json(); } catch {}

  const history = payload.history ?? [];
  const user_hint = payload.user_hint ?? '';
  const newSceneId = payload.newSceneId || `scene${Date.now()}`;

  // Build prompts
  const system = buildSystemPrompt();
  const user = buildUserPrompt({
    history,
    user_hint,
    max_chars: MAX_CHARS,
    newSceneId
  });

  // Call OpenAI
  let scene: Scene;
  try {
    scene = await callOpenAI(system, user);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'generation_failed', message: String(e?.message || e) }), {
      status: 502, headers: { 'content-type': 'application/json' }
    });
  }

  // Consume one credit
  const used = await consume('generate', clientKey);
  const newRemaining = Math.max(0, limit - used);

  return new Response(JSON.stringify({ scene, remaining: newRemaining }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

