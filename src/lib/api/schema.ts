export type PathStep = { sceneId: string; beatId: string };

export type NextSceneRequest = {
  history: PathStep[];          // chronological path, last is current
  user_hint?: string;           // short guidance from textbox
  max_chars?: number;           // server-side clamp, e.g. 1200
};

export type GeneratedBeat = { id: string; text: string; choices?: { label: string; to: string }[] };

export type GeneratedScene = {
  id: string;
  title?: string;
  start: string;                // usually "root"
  beats: Record<string, GeneratedBeat>;
};

export type NextSceneResponse =
  | { kind: "scene"; scene: GeneratedScene }
  | { kind: "append"; text: string };  // if you choose stream/append mode later

