<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import HeaderMenu from "$lib/components/HeaderMenu.svelte";
  import ChoiceMorph from "$lib/components/ChoiceMorph.svelte";
  import ContinueBar from "$lib/components/ContinueBar.svelte";
  import { story as initialStory } from "$lib/story/graph";
  import type { Scene } from "$lib/ai/schema";

  // ————————————————— Config —————————————————
  const ERASE_ON_SCENE_CHANGE = true;
  const SCENE_SCROLL_TO_TOP   = true;

  // ————————————————— Typing/scroll state —————————————————
  let cps = 36;
  let charDelay = Math.max(8, Math.round(1000 / cps));
  let printed = "";
  let typing  = "";
  let i = 0;
  let finished = false;
  let timer: number | null = null;
  let scrollRoot: HTMLElement | null = null;

  // ————————————————— Story registry & cursor —————————————————
  let registry: Record<string, Scene> = structuredClone(initialStory) as any;
  let sceneId: string = "scene1";
  let beatId: string  = registry[sceneId].start;

  // ————————————————— AI safety: cancellation + staleness —————————————————
  let epoch = 0;
  let resetSeq = 0;

  // ————————————————— History for API —————————————————
  type PathStep = { sceneId: string; beatId: string; choiceLabel?: string; excerpt?: string };
  let history: PathStep[] = [];

  // ————————————————— Derived helpers —————————————————
  let currentText = "";
  const scene = () => registry[sceneId];
  const beat  = () => scene().beats[beatId];

  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function start() { if (!timer) { timer = setInterval(tick, charDelay) as unknown as number; } }

  // Strip `.dotted`, wrap quotes, sentence-case first letters, normalize newlines.
  function prepareHTML(html: string): string {
    html = html.replace(/\r\n?/g, "\n");
    html = html.replace(
      /<([a-z]+)\b([^>]*?)class=["'][^"']*\bdotted\b[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi,
      "$3"
    );
    // collapse single \n to space, keep paragraph breaks
    html = html.replace(/\n(?!\n)/g, " ").replace(/\n{3,}/g, "\n\n");

    let out = "", inTag = false, capitalizeNext = true;
    const isLower = (c: string) => c >= "a" && c <= "z";
    const isUpper = (c: string) => c >= "A" && c <= "Z";
    const isAlpha = (c: string) => isLower(c) || isUpper(c);
    const isEnd   = (c: string) => c === "." || c === "!" || c === "?";
    const isQuote = (c: string) =>
      c === '"' || c === "'" || c === "“" || c === "”" || c === "‘" || c === "’";

    for (let k = 0; k < html.length; k++) {
      const ch = html[k];
      if (ch === "<") { inTag = true; out += ch; continue; }
      if (inTag) { out += ch; if (ch === ">") inTag = false; continue; }
      if (isQuote(ch)) { out += `<span class="quote-fix">${ch}</span>`; continue; }
      if (capitalizeNext && isAlpha(ch)) { out += isLower(ch) ? ch.toUpperCase() : ch; capitalizeNext = false; continue; }
      out += ch;
      if (isEnd(ch) || ch === "\n") capitalizeNext = true;
    }
    return out;
  }

  function appendNext(cur: string) {
    const ch = cur[i];
    if (ch === "<") {
      const j = cur.indexOf(">", i);
      if (j !== -1) { typing += cur.slice(i, j + 1); i = j + 1; return; }
    }
    typing += ch; i += 1;
  }

  function scrollToTop() {
    if (!scrollRoot) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    scrollRoot.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  function beginBeat(nextSceneId: string, nextBeatId: string, eraseFirst = false, gap = false) {
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

  function excerptFromHTML(html: string, n = 200) {
    const txt = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return txt.slice(0, n);
  }

  function choose(to: string, label: string) {
    const next = resolveTarget(sceneId, to);
    const ex = excerptFromHTML(beat().text, 200);
    history = [...history, { sceneId, beatId, choiceLabel: label, excerpt: ex }];
    const erase = next.sceneChange && ERASE_ON_SCENE_CHANGE;
    beginBeat(next.sceneId, next.beatId, erase, true);
  }

  function resetStory() {
    stop();
    epoch += 1;     // invalidate pending results
    resetSeq += 1;  // tell children to abort fetch
    history = [];
    printed = ""; typing  = ""; i = 0; finished = false;
    sceneId = "scene1"; beatId = registry[sceneId].start;
    beginBeat(sceneId, beatId, true, false);
  }

  function applySpeed(newCps: number) {
    cps = Math.max(10, Math.min(200, Math.round(newCps)));
    charDelay = Math.max(8, Math.round(1000 / cps));
    if (timer) { stop(); start(); }
  }

  function onGenerated(e: CustomEvent<{ scene: Scene; epoch: number }>) {
    if (e.detail.epoch !== epoch) return;
    const scene = e.detail.scene;
    registry[scene.id] = scene;
    const ex = excerptFromHTML(beat().text, 200);
    history = [...history, { sceneId, beatId, excerpt: ex }];
    beginBeat(scene.id, scene.start, /*erase*/ true, /*gap*/ true);
  }

  function resolveTarget(currentSceneId: string, to: string) {
    if (to.includes(".")) {
      const [sid, bid] = to.split(".");
      return { sceneId: sid, beatId: bid, sceneChange: sid !== currentSceneId };
    }
    return { sceneId: currentSceneId, beatId: to, sceneChange: false };
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

<!-- The choices/continue bar now render INSIDE this .reading block -->
<div class="reading" class:done={finished}>
  {@html printed + typing}

  {#if finished}
    {#if (beat()?.choices?.length ?? 0) > 0}
      <div class="choices">
        {#each beat().choices as c}
          <ChoiceMorph label={c.label} onSelect={() => choose(c.to, c.label)} />
        {/each}
      </div>
    {:else}
      <div class="continue-wrap">
        <ContinueBar
          history={history}
          resetSeq={resetSeq}
          epoch={epoch}
          on:generated={onGenerated}
        />
      </div>
    {/if}
  {/if}
</div>

<style>
  .reading {
    border: none;
    background: transparent;
    padding: 10px 0 0 0;
    border-radius: 0;
    font-size: clamp(16px, 1.8vw, 20px);
    line-height: 1.9;
    color: var(--text, #C8D0E0);
    white-space: pre-wrap;
    word-break: break-word;

    /* keeps page from feeling cramped while typing */
    min-height: 40vh;

    font-weight: 400;
    font-style: normal;
    font-synthesis-weight: none;
    font-synthesis-style: none;
  }
  /* once finished, collapse the min-height so buttons hug the last line */
  .reading.done { min-height: 0; }

  .reading .quote-fix { opacity: 1; }
  .reading .dotted { font-family: inherit !important; opacity: 1 !important; letter-spacing: normal !important; }
  .reading .veil { font-family: "Raleway Dots", sans-serif; opacity: .8; letter-spacing: .02em; }

  .choices {
    display: flex;
    gap: 12px;
    margin-top: 12px;   /* just a small rhythm gap under the last line */
    flex-wrap: wrap;
  }

  .continue-wrap {
    margin-top: 14px;
  }
</style>

