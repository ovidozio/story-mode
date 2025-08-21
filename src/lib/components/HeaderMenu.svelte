<script lang="ts">
  import { createEventDispatcher, tick, onDestroy } from "svelte";
  const dispatch = createEventDispatcher<{ reset: void; speed: number }>();

  export let speedCPS = 36;

  let open = false;
  let panelRef: HTMLDivElement | null = null;

  function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }

  function setMenuHeight(px: number) {
    // push reading content down by this many pixels
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--menu-open-height", `${px}px`);
    }
  }

  async function openPanel() {
    open = true;
    await tick();
    measurePanel();
  }
  function close() {
    open = false;
    setMenuHeight(0);
  }
  function toggle() { open ? close() : openPanel(); }

  function measurePanel() {
    if (!open) return;
    const h = panelRef?.offsetHeight ?? 0;
    setMenuHeight(h);
  }

  function reset()  { dispatch("reset"); close(); }
  function onSpeedInput(e: Event) {
    const val = Number((e.currentTarget as HTMLInputElement).value);
    speedCPS = val;
    dispatch("speed", val);
  }

  onDestroy(() => setMenuHeight(0));
</script>

<svelte:window on:keydown={onKey} on:resize={measurePanel} />

<!-- trigger -->
<button
  class="hamburger"
  on:click={toggle}
  aria-label={open ? "close menu" : "open menu"}
  aria-expanded={open}
>
  <span class="line"></span>
  <span class="line"></span>
  <span class="line"></span>
</button>

{#if open}
  <div class="panel" role="dialog" aria-label="story controls" bind:this={panelRef}>
    <div class="panel-inner">
      <div class="title">night train</div>

      <label class="speed">
        <span>speed</span>
        <input
          type="range"
          min="10" max="100" step="1"
          value={speedCPS}
          on:input={onSpeedInput}
          aria-label="characters per second"
        />
        <span class="value">{speedCPS} cps</span>
      </label>

      <button class="reset" on:click={reset}>reset story</button>
      <button class="close" on:click={close} aria-label="close">×</button>
    </div>
  </div>
{/if}

<style>
  :global(:root) {
    --read-max: 95ch;
    --read-vw: 96vw;

    /* comfort */
    --menu-gutter: clamp(14px, 3.5vw, 22px);
    --menu-overscan: 6ch;

    /* palette */
    --bg: #0B0F19;
    --surface: rgba(255,255,255,0.04);
    --overlay: rgba(10,14,22,0.66);
    --border: rgba(255,255,255,0.12);
    --hover: rgba(255,255,255,0.08);
    --text: #C8D0E0;
    --text-dim: #A3ABBE;
    --accent: #6EA8FE;

    --gutter: clamp(10px, 2.4vw, 18px);
  }

  /* hamburger aligned to reading column */
  .hamburger {
    position: fixed;
    top: calc(env(safe-area-inset-top, 0px) + 16px);
    left: calc((100vw - min(var(--read-max), var(--read-vw))) / 2 + var(--gutter));
    z-index: 50;
    width: 38px; height: 34px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    cursor: pointer;
    transition: background .2s ease, border-color .2s ease, transform .2s ease, opacity .2s ease;
  }
  .hamburger:hover { background: var(--hover); }
  .hamburger:active { transform: scale(0.98); }

  .hamburger .line { display:block; width:22px; height:2px; margin:5px auto; background:var(--text); opacity:.9; }

  @media (max-width: 640px) {
    .hamburger {
      top: calc(env(safe-area-inset-top, 0px) + 12px);
      left: calc(env(safe-area-inset-left, 0px) + 4vw);
      width: 44px; height: 44px;
    }
    .hamburger .line { width: 24px; margin: 6px auto; }
  }

  /* panel never causes horizontal scroll; we push content via --menu-open-height */
  .panel {
    position: fixed; inset: 0 0 auto 0;
    z-index: 60;
    backdrop-filter: blur(6px);
    background: var(--overlay);
    border-bottom: 1px solid var(--border);
    overflow-x: hidden;
  }

  /* responsive grid + permanent side padding */
  .panel-inner {
    width: 100%;
    max-width: calc(min(var(--read-max), var(--read-vw)) + var(--menu-overscan));
    margin: 0 auto;
    padding: 14px var(--menu-gutter);
    display: grid; align-items: center; gap: 12px; color: var(--text);
    grid-template-columns: 1fr minmax(160px, 420px) auto auto;
    grid-template-areas: "title speed reset close";
    box-sizing: border-box;
  }

  .title { grid-area: title; text-transform: lowercase; font-weight: 600; letter-spacing: .02em; }

  .speed { grid-area: speed; display:flex; align-items:center; gap:10px; color: var(--text-dim); font-size:.92em; min-width: 0; }
  .speed span:first-child { text-transform: lowercase; }
  .speed .value { color: var(--text); min-width: 64px; text-align: right; }
  .speed input[type="range"] {
    flex: 1 1 auto; width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;
    -webkit-appearance: none; appearance: none; background: transparent; height: 22px;
  }
  .speed input[type="range"]::-webkit-slider-runnable-track { height: 4px; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--text-dim)); }
  .speed input[type="range"]::-moz-range-track { height: 4px; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--text-dim)); }
  .speed input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--text); border: 1px solid var(--border); margin-top: -6px; }
  .speed input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--text); border: 1px solid var(--border); }

  .reset {
    grid-area: reset;
    background: var(--surface); color: var(--text);
    border: 1px solid var(--border); padding: 10px 14px; border-radius: 10px;
    cursor: pointer; text-transform: lowercase; font-size: clamp(14px, 1.5vw, 16px); line-height: 1.6;
    transition: background .2s ease, border-color .2s ease;
    justify-self: end;
  }
  .reset:hover { background: var(--hover); }

  .close {
    grid-area: close;
    justify-self: end;
    width: 36px; height: 36px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-size: 18px; line-height: 1;
    display: grid; place-items: center;
    cursor: pointer;
    transition: background .2s ease, border-color .2s ease, transform .08s ease;
  }
  .close:hover { background: var(--hover); }
  .close:active { transform: scale(0.98); }

  /* 421–720px: speed drops below; keep close/right */
  @media (max-width: 720px) {
    .panel-inner {
      grid-template-columns: 1fr auto auto;
      grid-template-areas:
        "title reset close"
        "speed speed speed";
      padding: 16px var(--menu-gutter);
      gap: 10px 12px;
    }
  }

  /* ≤420px: fully vertical; close button right-aligned on its own row */
  @media (max-width: 420px) {
    .panel-inner {
      grid-template-columns: 1fr;
      grid-template-areas:
        "close"
        "title"
        "speed"
        "reset";
    }
    .close { justify-self: end; }
    .reset { width: 100%; justify-self: stretch; text-align: center; }
  }
</style>

