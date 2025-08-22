export type Choice = { label: string; to: string };

export type Beat = {
  id: "root" | "0" | "1" | "00" | "01" | "10" | "11";
  text: string;
  choices?: Choice[]; // only on root/0/1
};

export type Scene = {
  id: string;
  title?: string;
  start: "root";
  beats: Record<Beat["id"], Beat>;
};

export type PathStep = {
  sceneId: string;
  beatId: Beat["id"];
  choiceLabel?: string;
  excerpt?: string;
};

export type NextSceneRequest = {
  history: PathStep[];
  user_hint?: string;
  max_chars?: number;
  newSceneId?: string;
};

export type NextSceneSuccess = { kind: "scene"; scene: Scene };
export type NextSceneError   = { kind: "error"; message: string; details?: string[] };
export type NextSceneResponse = NextSceneSuccess | NextSceneError;

const REQUIRED_BEATS: Beat["id"][] = ["root", "0", "1", "00", "01", "10", "11"];

export function validateScene(scene: any): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!scene || typeof scene !== "object") return { ok: false, errors: ["scene is not an object"] };

  if (typeof scene.id !== "string" || !scene.id) errors.push(`"id" must be non-empty string`);
  if (scene.start !== "root") errors.push(`"start" must be "root"`);

  if (!scene.beats || typeof scene.beats !== "object") {
    errors.push(`"beats" must be an object`);
    return { ok: false, errors };
  }
  for (const k of REQUIRED_BEATS) {
    if (!(k in scene.beats)) errors.push(`beats["${k}"] is missing`);
  }
  if (errors.length) return { ok: false, errors };

  // beat id must match key; text must be string
  for (const k of REQUIRED_BEATS) {
    const b = scene.beats[k];
    if (!b || typeof b !== "object") errors.push(`beats["${k}"] is not an object`);
    if (b.id !== k) errors.push(`beats["${k}"].id must equal "${k}"`);
    if (typeof b.text !== "string" || !b.text.trim()) errors.push(`beats["${k}"].text must be non-empty string`);
  }

  // choices constraints
  const need2 = ["root", "0", "1"] as const;
  for (const k of need2) {
    const ch = scene.beats[k].choices;
    if (!Array.isArray(ch) || ch.length !== 2) errors.push(`beats["${k}"] must have exactly 2 choices`);
    else {
      ch.forEach((c: any, idx: number) => {
        if (!c || typeof c !== "object") errors.push(`beats["${k}"].choices[${idx}] is not an object`);
        if (typeof c.label !== "string" || !c.label.trim()) errors.push(`beats["${k}"].choices[${idx}].label must be non-empty string`);
        if (typeof c.to !== "string" || !c.to.includes(".")) errors.push(`beats["${k}"].choices[${idx}].to must be "sceneId.beatId"`);
      });
    }
  }
  const terminals = ["00","01","10","11"] as const;
  for (const k of terminals) {
    if ("choices" in scene.beats[k] && scene.beats[k].choices) errors.push(`beats["${k}"] must NOT have "choices"`);
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

// Optional: small fixer (does not invent content)
export function normalizeScene(scene: any): any {
  if (!scene || typeof scene !== "object") return scene;
  // enforce start
  scene.start = "root";
  const id = typeof scene.id === "string" && scene.id ? scene.id : "sceneX";

  // qualify all choice "to" with this scene id if missing
  for (const k of ["root","0","1"] as const) {
    const b = scene.beats?.[k];
    if (!b || !Array.isArray(b.choices)) continue;
    b.choices = b.choices.slice(0, 2).map((c: any) => {
      const to = String(c?.to ?? "");
      const qualified = to.includes(".") ? to : `${id}.${to}`;
      return { label: String(c?.label ?? "Continue"), to: qualified };
    });
  }

  // strip choices on terminals if present
  for (const k of ["00","01","10","11"] as const) {
    if (scene.beats?.[k]?.choices) delete scene.beats[k].choices;
  }

  return scene;
}

