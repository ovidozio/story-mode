<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import HeaderMenu from "$lib/components/HeaderMenu.svelte";
  import ChoiceMorph from "$lib/components/ChoiceMorph.svelte";
  import { story, resolveTarget } from "$lib/story/graph";

  type StoryKey = keyof typeof story;

  const ERASE_ON_SCENE_CHANGE = true;
  const SCENE_SCROLL_TO_TOP   = true;

  /* speed (characters per second -> interval ms) */
  let cps = 36;
  let charDelay = Math.max(8, Math.round(1000 / cps));

  let sceneId: StoryKey = "scene1";
  let beatId: string = story[sceneId].start;

  let printed = "";
  let typing  = "";
  let i = 0;
  let finished = false;
  let timer: number | null = null;

  let scrollRoot: HTMLElement | null = null;

  // processed HTML for the current beat
  let currentText = "";

  const scene = () => story[sceneId];
  const beat  = () => scene().beats[beatId];

  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function start() { if (!timer) { timer = setInterval(tick, charDelay) as unknown as number; } }

  // —— TEXT PREPROCESSING ————————————————————————————————
  // 1) Remove any element that has class "dotted" (so prose never renders in Raleway Dots)
  // 2) Wrap quotes for consistent styling
  // 3) Sentence-case: capitalize first alphabetic letter after start or [.?!] or newline
  function prepareHTML(html: string): string {
    // 1) strip dotted wrappers of ANY tag (span/em/i/…)
    html = html.replace(
      /<([a-z]+)\b([^>]*?)class=["'][^"']*\bdotted\b[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi,
      "$3"
    );

    let out = "";
    let inTag = false;
    let capitalizeNext = true;

    const isLower = (c: string) => c >= "a" && c <= "z";
    const isUpper = (c: string) => c >= "A" && c <= "Z";
    const isAlpha = (c: string) => isLower(c) || isUpper(c);
    const isEnd   = (c: string) => c === "." || c === "!" || c === "?";
    const isQuote = (c: string) => c === '"' || c === "'" || c === "“" || c === "”" || c === "‘" || c === "’";

    for (let k = 0; k < html.length; k++) {
      const ch = html[k];

      if (ch === "<") { inTag = true; out += ch; continue; }
      if (inTag)     { out += ch; if (ch === ">") inTag = false; continue; }

      // 2) quote wrapper
      if (isQuote(ch)) { out += `<span class="quote-fix">${ch}</span>`; continue; }

      // 3) sentence casing
      if (capitalizeNext) {
        if (isAlpha(ch)) {
          out += isLower(ch) ? ch.toUpperCase() : ch;
          capitalizeNext = false;
          continue;
        }
      }

      out += ch;
      if (isEnd(ch) || ch === "\n") capitalizeNext = true;
    }
    return out;
  }
  // ————————————————————————————————————————————————————————

  // inject full tags at once
  function appendNext(cur: string) {
    const ch = cur[i];
    if (ch === "<") {
      const j = cur.indexOf(">", i);
      if (j !== -1) { typing += cur.slice(i, j + 1); i = j + 1; return; }
    }
    typing += ch; i += 1;
  }

  function beginBeat(nextSceneId: StoryKey, nextBeatId: string, eraseFirst = false, gap = false) {
    stop();
    if (eraseFirst) printed = "";
    if (gap && printed && !printed.endsWith("\n\n")) printed += "\n\n";
    sceneId = nextSceneId;
    beatId = nextBeatId;

    currentText = prepareHTML(beat().text);

    i = 0; typing = ""; finished = false;
    if (eraseFirst && SCENE_SCROLL_TO_TOP) scrollToTop();
    start();
  }

  function tick() {
    const cur = currentText;
    if (i < cur.length) { appendNext(cur); }
    else { finished = true; stop(); printed += typing; typing = ""; }
  }

  function choose(to: string) {
    const { sceneId: s, beatId: b, sceneChange } = resolveTarget(sceneId, to);
    const erase = sceneChange && ERASE_ON_SCENE_CHANGE;
    beginBeat(s as StoryKey, b, erase, true);
  }

  function resetStory() {
    stop();
    printed = ""; typing  = ""; i = 0; finished = false;
    sceneId = "scene1"; beatId = story[sceneId].start;
    beginBeat(sceneId, beatId, /* eraseFirst */ true, /* gap */ false);
  }

  function scrollToTop() {
    if (!scrollRoot) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    scrollRoot.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  function applySpeed(newCps: number) {
    cps = Math.max(10, Math.min(100, Math.round(newCps)));
    charDelay = Math.max(8, Math.round(1000 / cps));
    if (timer) { stop(); start(); }
  }

  onMount(() => {
    scrollRoot = document.getElementById("scroll-root");
    resetStory();
  });

  onDestroy(() => { stop(); });
</script>

<HeaderMenu
  speedCPS={cps}
  on:reset={resetStory}
  on:speed={(e) => applySpeed(e.detail)}
/>

<div class="reading">
  {@html printed + typing}
</div>

{#if finished && beat()?.choices?.length === 2}
  <div class="choices">
    {#each beat().choices as c}
      <ChoiceMorph label={c.label} onSelect={() => choose(c.to)} />
    {/each}
  </div>
{/if}

<style>
  .reading {
    border: none; background: transparent; padding: 10px 0 0 0; border-radius: 0;
    font-size: clamp(16px, 1.8vw, 20px);
    line-height: 1.9;
    color: var(--text, #C8D0E0);
    white-space: pre-wrap; word-break: break-word;
    min-height: 40vh;

    font-weight: 400; font-style: normal;
    font-synthesis-weight: none; font-synthesis-style: none;
  }

  /* quotes: same appearance as prose */
  .reading .quote-fix { opacity: 1; }

  /* hard override: anything marked dotted inside prose becomes normal text */
  .reading .dotted {
    font-family: inherit !important;
    opacity: 1 !important;
    letter-spacing: normal !important;
  }

  /* (optional) you can still veil text deliberately using .veil */
  .reading .veil { font-family: "Raleway Dots", sans-serif; opacity: .8; letter-spacing: .02em; }

  .choices { display: flex; gap: 12px; margin-top: 14px; }
</style>

