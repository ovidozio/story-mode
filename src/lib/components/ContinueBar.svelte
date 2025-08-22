<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { fetchNextScene } from "$lib/ai/fetch";
  import type { PathStep, Scene } from "$lib/ai/schema";

  export let history: PathStep[] = [];
  export let disabled = false;
  export let maxChars = 1400;
  export let newSceneId = "sceneX";
  export let resetSeq = 0; // optional: for cancellation from parent
  export let epoch = 0;

  const HINT_LIMIT = 280;
  const MAX_AUTO_PX = 280;   // auto-grow up to this height

  let hint = "";
  let busy = false;
  let error = "";

  let ta: HTMLTextAreaElement | null = null;
  let controller: AbortController | null = null;
  let lastResetSeq = resetSeq;

  const dispatch = createEventDispatcher<{ generated: { scene: Scene; epoch: number } }>();

  function autosize() {
    if (!ta) return;
    ta.style.height = "auto";
    const h = Math.min(ta.scrollHeight, MAX_AUTO_PX);
    ta.style.height = `${h}px`;
    // show scrollbar only if exceeding max height
    ta.style.overflowY = ta.scrollHeight > MAX_AUTO_PX ? "auto" : "hidden";
  }

  $: if (resetSeq !== lastResetSeq) {
    lastResetSeq = resetSeq;
    if (controller) controller.abort();
    controller = null;
    busy = false;
    error = "";
    hint = "";
    // reset size
    queueMicrotask(autosize);
  }

  onMount(() => autosize());

  async function onContinue() {
    if (busy || disabled) return;
    error = "";
    busy = true;

    controller = new AbortController();
    const myEpoch = epoch;
    try {
      const scene = await fetchNextScene({
        history,
        user_hint: hint.slice(0, HINT_LIMIT),
        max_chars: maxChars,
        newSceneId
      }, controller.signal);
      dispatch("generated", { scene, epoch: myEpoch });
      hint = "";
      autosize();
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        error = e?.message || "Failed to generate scene";
      }
    } finally {
      busy = false;
      controller = null;
    }
  }
</script>

<div class="continue">
  <textarea
    bind:this={ta}
    placeholder="(optional) tell the story where to go…"
    bind:value={hint}
    maxlength={HINT_LIMIT}
    rows="2"
    {disabled}
    on:input={autosize}
  ></textarea>

  <div class="row">
    <div class="meta">
      <span class="count">{hint.length}/{HINT_LIMIT}</span>
      {#if error}<span class="err">{error}</span>{/if}
    </div>
    <button class="go" on:click={onContinue} disabled={disabled || busy}>
      {busy ? "Generating…" : "Continue"}
    </button>
  </div>
</div>

<style>
  .continue { display: grid; gap: 10px; margin-top: 14px; }

  textarea {
    width: 100%;
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 14px;      /* more rounded */
    padding: 12px 14px;
    font: inherit;

    resize: none;             /* remove manual drag handle */
    overflow: hidden;         /* hide scrollbar until we exceed MAX_AUTO_PX */
    line-height: 1.6;
    transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
  }
  textarea:focus {
    outline: none;
    border-color: color-mix(in oklab, var(--accent), white 15%);
    box-shadow: 0 0 0 3px rgba(110,168,254,0.18);
  }

  .row { display: flex; align-items: center; gap: 10px; justify-content: space-between; }
  .meta { display: flex; gap: 12px; align-items: center; color: var(--text-dim); font-size: .9em; }
  .err { color: #ff8a8a; }
  .go {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    padding: 9px 16px;
    border-radius: 12px;
    cursor: pointer;
    transition: background .2s ease, border-color .2s ease, transform .05s ease;
  }
  .go:hover { background: var(--hover); }
  .go:active { transform: translateY(1px); }
  .go:disabled { opacity: .6; cursor: default; }
</style>

