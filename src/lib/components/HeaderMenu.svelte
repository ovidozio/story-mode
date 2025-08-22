<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher<{ reset: void; speed: number }>();

  export let speedCPS = 36;
  let open = false;

  function toggle() { open = !open; }
  function reset()  { dispatch("reset"); open = false; }
  function onSpeedInput(e: Event) {
    const val = Number((e.currentTarget as HTMLInputElement).value);
    speedCPS = val;
    dispatch("speed", val);
  }
</script>

<!-- Normal-flow header; story starts below; header scrolls away -->
<header class="menu" role="region" aria-label="story controls">
  <!-- 2-col on desktop: [toggle] [controls]; 1-col stack on mobile -->
  <button
    class="toggle"
    on:click={toggle}
    aria-expanded={open}
    aria-label={open ? "close menu" : "open menu"}
  >
    {#if open}
      <span class="x">×</span>
    {:else}
      <span class="line"></span>
      <span class="line"></span>
      <span class="line"></span>
    {/if}
  </button>

  <div class="controls" class:open={open} aria-hidden={!open}>
    <div class="speed">
      <span class="speed-label">speed</span>
      <input
        class="speed-range"
        type="range"
        min="10" max="200" step="1"
        bind:value={speedCPS}
        on:input={onSpeedInput}
        aria-label="characters per second"
      />
      <span class="speed-value">{speedCPS} cps</span>
    </div>

    <button class="reset" on:click={reset}>reset story</button>
  </div>
</header>

<style>
  :global(:root) {
    /* keep using your reading column variables from +layout */
    --read-max: 95ch;
    --read-vw: 96vw;

    /* spacing */
    --menu-gutter: clamp(14px, 3.5vw, 22px);
    --row-gap: 12px;
    --y-pad: 12px;

    /* sizes */
    --toggle-w: 44px;
    --toggle-h: 42px;
    --range-max-desktop: 220px;
    --range-max-mobile: 280px;

    /* theme (matches your app) */
    --surface: rgba(255,255,255,0.04);
    --border: rgba(255,255,255,0.12);
    --hover: rgba(255,255,255,0.08);
    --text: #C8D0E0;
    --text-dim: #A3ABBE;
    --accent: #6EA8FE;
  }

  /* HEADER BLOCK -------------------------------------------------------- */
  .menu {
    max-width: min(var(--read-max), var(--read-vw));
    margin: 0 auto;
    padding: var(--y-pad) var(--menu-gutter);
    border-bottom: 1px solid var(--border);

    display: grid;
    grid-template-columns: auto 1fr; /* [toggle] [controls] */
    align-items: center;
    gap: var(--row-gap);
    box-sizing: border-box;
  }

  /* TOGGLE -------------------------------------------------------------- */
  .toggle {
    width: var(--toggle-w); height: var(--toggle-h);
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    display: grid; place-items: center;
    cursor: pointer;
    transition: background .2s ease, border-color .2s ease, transform .08s ease;
  }
  .toggle:hover { background: var(--hover); }
  .toggle:active { transform: scale(0.98); }

  .toggle .line { display:block; width:24px; height:2px; margin:4px auto; background:var(--text); opacity:.9; }
  .toggle .x { font-size: 20px; line-height: 1; }

  /* CONTROLS WRAPPER ---------------------------------------------------- */
  .controls {
    display: none;                 /* hidden when closed */
    justify-self: end;             /* push row contents to the right on wide */
    align-items: center;
    gap: 14px;
  }
  .controls.open { display: flex; }

  /* SPEED GROUP (label | slider | value) -------------------------------- */
  .speed {
    display: grid;
    grid-auto-flow: column;
    align-items: center;
    gap: 10px;
    grid-template-columns: auto minmax(140px, var(--range-max-desktop)) auto;
  }
  .speed-label { color: var(--text-dim); text-transform: lowercase; white-space: nowrap; }
  .speed-value { min-width: 56px; text-align: right; white-space: nowrap; }

  .speed-range {
    width: 100%;
    -webkit-appearance: none; appearance: none;
    background: transparent; height: 22px;
  }
  .speed-range::-webkit-slider-runnable-track { height: 4px; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--text-dim)); }
  .speed-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--text); border: 1px solid var(--border); margin-top: -6px; }
  .speed-range::-moz-range-track { height: 4px; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--text-dim)); }
  .speed-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--text); border: 1px solid var(--border); }

  /* RESET BUTTON -------------------------------------------------------- */
  .reset {
    background: var(--surface); color: var(--text);
    border: 1px solid var(--border);
    padding: 10px 14px; border-radius: 12px;
    text-transform: lowercase; white-space: nowrap;
    cursor: pointer;
    transition: background .2s ease, border-color .2s ease;
  }
  .reset:hover { background: var(--hover); }

  /* NARROW SCREENS: full vertical stack -------------------------------- */
  @media (max-width: 900px) {
    .menu {
      grid-template-columns: 1fr;      /* stack: toggle then controls */
      justify-items: start;
    }
    .controls.open {
      display: grid;
      justify-self: stretch;
      gap: 12px;
    }

    .speed {
      grid-auto-flow: row;             /* vertical */
      grid-template-columns: 1fr;
      justify-items: center;
      text-align: center;
    }
    .speed-range {
      max-width: var(--range-max-mobile);
      width: 100%;
    }
    .speed-value { text-align: center; }

    .reset {
      width: 100%;
      max-width: 260px;                 /* feels like a tidy “card” */
      justify-self: center;
      text-align: center;
    }
  }
</style>

