<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import type { Scene } from '$lib/ai/schema';

  // Props from page
  export let history: { sceneId: string; beatId: string; choiceLabel?: string; excerpt?: string }[] = [];
  export let resetSeq: number = 0;   // when parent increments, abort in-flight
  export let epoch: number = 0;      // echo back so parent can ignore stale

  const dispatch = createEventDispatcher<{ generated: { scene: Scene; epoch: number } }>();

  let hint = '';
  let loading = false;
  let error = '';
  let remaining: number | null = null;

  let controller: AbortController | null = null;
  let lastResetSeq = resetSeq;

  async function generate() {
    error = '';
    loading = true;
    controller?.abort();
    controller = new AbortController();

    try {
      const res = await fetch('/api/next-scene', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          history,
          user_hint: hint,
          newSceneId: `scene${Date.now()}`
        })
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        remaining = 0;
        error = data?.message || 'Limit reached for this IP.';
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error = data?.message || `Request failed (${res.status})`;
        return;
      }

      const data = await res.json();
      remaining = typeof data?.remaining === 'number' ? data.remaining : remaining;
      if (data?.scene) {
        dispatch('generated', { scene: data.scene as Scene, epoch });
        hint = '';
      } else {
        error = 'Server returned no scene.';
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      error = e?.message || 'Network error';
    } finally {
      loading = false;
    }
  }

  // Abort if parent resets
  $: if (resetSeq !== lastResetSeq) {
    lastResetSeq = resetSeq;
    controller?.abort();
    loading = false;
  }

  onDestroy(() => controller?.abort());
</script>

<div class="continue">
  <textarea
    class="hint"
    placeholder="(optional) how should the story evolve?"
    bind:value={hint}
    rows="2"
  />
  <button class="go" on:click={generate} disabled={loading}>
    {#if loading}…generating…{:else}continue{/if}
  </button>

  {#if typeof remaining === 'number'}
    <div class="quota">remaining: {remaining}</div>
  {/if}

  {#if error}
    <div class="err">{error}</div>
  {/if}
</div>

<style>
  .continue {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: start;
    margin-top: 14px;
  }

  .hint {
    grid-column: 1 / 2;
    resize: none;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    padding: 10px 12px;
    line-height: 1.5;
    min-height: 44px;
  }

  .go {
    grid-column: 2 / 3;
    height: 44px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    padding: 0 14px;
    cursor: pointer;
    white-space: nowrap;
  }
  .go:disabled { opacity: .6; cursor: default; }

  .quota {
    grid-column: 1 / -1;
    font-size: .9em;
    color: var(--text-dim);
  }

  .err {
    grid-column: 1 / -1;
    color: #ff9d9d;
  }

  @media (max-width: 720px) {
    .continue {
      grid-template-columns: 1fr;
    }
    .go {
      grid-column: 1 / -1;
      width: 100%;
    }
  }
</style>

