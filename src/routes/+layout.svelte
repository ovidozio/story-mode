<script lang="ts"></script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600&family=Raleway+Dots&display=swap" rel="stylesheet">
</svelte:head>

<style>
  :root { color-scheme: dark; }

  :global(html), :global(body), :global(#svelte) { height: 100%; margin: 0; }
  :global(body) {
    --bg: #0B0F19; --surface: rgba(255,255,255,0.04); --overlay: rgba(10,14,22,0.66);
    --border: rgba(255,255,255,0.12); --hover: rgba(255,255,255,0.08);
    --text: #C8D0E0; --text-dim: #A3ABBE; --accent: #6EA8FE;
    background: var(--bg); color: var(--text);
    font-family: "Josefin Sans", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    font-size: 16px; line-height: 1.85;
    -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
    letter-spacing: 0.01em;
    overflow-y: auto; overflow-x: hidden; overscroll-behavior-y: contain;
  }

  :root {
    --read-max: 95ch;
    --read-vw: 96vw;
    --safe-top: clamp(56px, 10vh, 96px);   /* room for hamburger alone */
    --menu-open-height: 0px;               /* ✦ set by HeaderMenu when open */
    --bottom-buffer: 100vh;
  }
  @media (max-width: 640px) {
    :root { --safe-top: calc(56px + env(safe-area-inset-top, 0px)); }
  }

  .shell { display: grid; grid-template-rows: auto minmax(0, 1fr); height: 100dvh; }
  .topbar { height: 0; border: 0; }

  .main {
    display: grid;
    grid-template-columns: 1fr min(var(--read-max), var(--read-vw)) 1fr;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    /* when menu opens, programmatic scroll lands below it */
    scroll-padding-top: calc(var(--safe-top) + var(--menu-open-height));
    scroll-padding-bottom: 20vh;
  }

  .doc {
    grid-column: 2;
    padding: clamp(16px, 3vw, 32px);

    /* push content down by the actual open-menu height */
    padding-top: calc(var(--safe-top) + var(--menu-open-height) + clamp(8px, 1.5vw, 16px));

    min-height: 0;
    overflow-anchor: none;
  }
  .doc::after { content: ""; display: block; height: var(--bottom-buffer); }

  :global(.dotted) { font-family: "Raleway Dots", sans-serif; letter-spacing: .02em; }
  :global(.veil)   { font-family: "Raleway Dots", sans-serif; opacity:.8; letter-spacing: .02em; }
</style>

<div class="shell">
  <div class="topbar"></div>
  <div class="main" id="scroll-root">
    <div class="doc">
      <slot />
    </div>
  </div>
</div>

