import type { RequestHandler } from "@sveltejs/kit";
import { env as priv } from "$env/dynamic/private";
import { getOpenAI, getModel } from "$lib/ai/client";
import { buildSystemPrompt, buildUserPrompt } from "$lib/ai/prompt";
import type { NextSceneRequest, NextSceneResponse, Scene } from "$lib/ai/schema";
import { validateScene, normalizeScene } from "$lib/ai/schema";

export const POST: RequestHandler = async ({ request }) => {
  if (priv.DEMO_DISABLED === "1") {
    const disabled: NextSceneResponse = { kind: "error", message: "Generation is disabled (DEMO_DISABLED=1)." };
    return new Response(JSON.stringify(disabled), { status: 503 });
  }

  let body: NextSceneRequest;
  try { body = await request.json(); }
  catch { return jsonErr(400, "Invalid JSON body."); }

  const history   = Array.isArray(body.history) ? body.history : [];
  const user_hint = (body.user_hint ?? "").slice(0, 280);
  const max_chars = Math.max(600, Math.min(body.max_chars ?? 1400, 2200));
  const newSceneId = (body.newSceneId || "sceneX").trim() || "sceneX";

  // Basic env guard
  if (!priv.OPENAI_API_KEY) return jsonErr(500, "Missing OPENAI_API_KEY on server.");

  const system = buildSystemPrompt();
  const user   = buildUserPrompt({ history, user_hint, max_chars, newSceneId });

  try {
    const openai = getOpenAI();
    const model  = getModel("gpt-4o-mini");

    const resp = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      max_tokens: 1100
    });

    const raw = resp.choices[0]?.message?.content?.trim() || "";
    let parsed: any;
    try { parsed = JSON.parse(raw); }
    catch {
      // Log server-side only (safe), but don’t echo raw back to client
      console.error("LLM non-JSON:", raw);
      return jsonErr(502, "Model did not return valid JSON.");
    }

    const scene: any = (parsed as any).scene ?? parsed;

    // Normalize small issues, then validate with detailed errors
    const normalized = normalizeScene(scene);
    const check = validateScene(normalized);
    if (check.ok) {
      (normalized as Scene).start = "root";
      const ok: NextSceneResponse = { kind: "scene", scene: normalized };
      return new Response(JSON.stringify(ok), { headers: { "content-type": "application/json" } });
    } else {
      // Helpful details back to client
      const err: NextSceneResponse = { kind: "error", message: "Response failed schema validation.", details: check.errors.slice(0, 12) };
      return new Response(JSON.stringify(err), { status: 422, headers: { "content-type": "application/json" } });
    }
  } catch (e: any) {
    console.error(e);
    return jsonErr(500, e?.message ?? "Generation failed.");
  }
};

function jsonErr(status: number, message: string): Response {
  const payload: NextSceneResponse = { kind: "error", message };
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
}

