import { env as pub } from "$env/dynamic/public";
import type { NextSceneRequest, NextSceneResponse, Scene } from "./schema";

export async function fetchNextScene(req: NextSceneRequest, signal?: AbortSignal): Promise<Scene> {
  if (pub.PUBLIC_AI_ENABLED === "0") {
    throw new Error("AI is disabled (PUBLIC_AI_ENABLED=0).");
  }

  const base = (pub.PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
  const res = await fetch(`${base}/next-scene`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
    signal   // ← allows AbortController to cancel this request
  });

  const data = (await res.json()) as NextSceneResponse;
  if (data.kind === "scene") return data.scene;
  throw new Error(data.message || `Generation failed with status ${res.status}`);
}

