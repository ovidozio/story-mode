<script lang="ts">
  export let label: string;
  export let onSelect: () => void;
  const chars = label.split("").map(ch => (ch === " " ? "\u00A0" : ch));
</script>

<button class="choice" on:click={onSelect} aria-label={label}>
  {#each chars as ch, idx}
    <span class="char" style="--i:{idx}">{@html ch}</span>
  {/each}
</button>

<style>
  .choice {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.10);
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    position: relative;

    /* smaller than story text */
    font-size: 0.92em;
    line-height: 1.5;
  }
  .choice:hover { background: rgba(255,255,255,0.06); }

  .char {
    display: inline-block;
    color: #aeb3cb;            /* muted at rest */
    transition: none;          /* instant on hover-out */
  }
  .choice:hover .char {
    transition: color .22s ease;
    transition-delay: calc(var(--i) * 28ms);
    color: #d6d9ed;            /* dim white on hover */
  }
</style>

