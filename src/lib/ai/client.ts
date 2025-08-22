import OpenAI from "openai";
import { env as priv } from "$env/dynamic/private";

// Uses OPENAI_API_KEY (server-only secret) and optional OPENAI_MODEL
export function getOpenAI() {
  const key = priv.OPENAI_API_KEY; // <-- IMPORTANT
  if (!key) throw new Error("Missing OPENAI_API_KEY in environment");
  return new OpenAI({ apiKey: key });
}

export function getModel(defaultModel = "gpt-4o-mini") {
  return (priv.OPENAI_MODEL?.trim() || defaultModel);
}

