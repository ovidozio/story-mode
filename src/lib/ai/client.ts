import type { Scene } from './schema';

export type PathStep = {
  sceneId: string;
  beatId: string;
  choiceLabel?: string;
  excerpt?: string;
};

export async function requestNextScene(args: {
  history: PathStep[];
  user_hint?: string;
  newSceneId?: string;
}): Promise<{ scene: Scene; remaining: number }> {
  const res = await fetch('/api/next-scene', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      history: args.history ?? [],
      user_hint: args.user_hint ?? '',
      newSceneId: args.newSceneId || `scene${Date.now()}`
    })
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`next-scene failed (${res.status}): ${msg}`);
  }
  return res.json();
}

