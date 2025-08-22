export type Choice = { label: string; to: string };
export type Beat = { id: string; text: string; choices?: Choice[] };
export type Scene = { id: string; title?: string; start: string; beats: Record<string, Beat> };
export type Story = Record<string, Scene>;

/*
  Single scene, depth = 3 (root → 0/1 → 00/01/10/11 terminals)
  - 7 beats total
  - fully-qualified links (scene1.X) for consistency
*/

export const story: Story = {
  scene1: {
    id: "scene1",
    title: "Night Train",
    start: "root",
    beats: {
      // level 1
      root: {
        id: "root",
        text:
`The night train slid along the coast, and salt pinpricked constellations on the window that shifted with each curve.
Carriage lights breathed with the rails—inhale on the bend, exhale on the straight—so softly that the page in your lap seemed to breathe too.
Across the aisle, a courier sat very still with a matte tin case balanced on their knees, holding it as if a bird might wake inside.
The case gave off a faint, steady hum that you felt in your molars more than heard, the way a power line sings when the air is wet.
You caught the courier watching your reflection in the glass rather than your eyes, as if the sea could answer for you.
Choice arrives as a pressure before it becomes a thought.`,
        choices: [
          { label: "Watch the courier", to: "scene1.0" },
          { label: "Watch the sea",     to: "scene1.1" }
        ]
      },

      // level 2
      "0": {
        id: "0",
        text:
`The courier’s coat was neat to the last button; even the loose threads looked intentional, like stitches in a map.
You tried to guess the case’s weight from the tendons in their hand and found it lighter than the sound suggested, a box that believed in itself.
The hum brightened at corners and softened on straights, as if the rails were teaching it to speak in intervals.
You pictured coils and paper, perhaps a clock that believed time was a knot and could be untied by patience.
When your gaze lingered too long, the courier smiled without showing teeth and tapped the lid twice; the hum answered with a small, obedient chord.
Curiosity is a key that pretends to be a question.`,
        choices: [
          { label: "Ask a harmless question",        to: "scene1.00" },
          { label: "Feign sleep and keep listening", to: "scene1.01" }
        ]
      },

      "1": {
        id: "1",
        text:
`Outside, the coastline unspooled in charcoal strokes and lonely lamps, each light a footnote to a town you would not enter.
Your reflection drifted over the black water like a late cloud; behind it the tin case kept its private metronome.
You wrote a sentence in the fog on the glass and watched the carriage erase it syllable by syllable.
The window carried smells in seams—rain, metal, something like pennies warmed in a palm—and the rails spoke in an older grammar beneath it all.
Somewhere ahead a signal would change from waiting to permission; you felt your pulse try to keep time.
The sea offered no opinion, which was almost as persuasive as certainty.`,
        choices: [
          { label: "Crack the window a finger’s width",         to: "scene1.10" },
          { label: "Face forward and steady your thoughts",     to: "scene1.11" }
        ]
      },

      // level 3 (terminals)
      "00": {
        id: "00",
        text:
`“Late run,” you ventured, as if lateness were a password people shared only on the rails.
“Late, but safe,” the courier said, the corner of their mouth folding like a saved page.
They tapped the case again—one, two—and the hum found harmony, a second voice arriving shyly from beneath the first.
Somewhere the map you carried in your head bent without asking, as if a river had changed its mind in the night.
You realized the conversation was less about destination than about whether you were already part of the cargo.
Agreement can sound like politeness when it first puts on its shoes.`
      },

      "01": {
        id: "01",
        text:
`You let your eyelids drop until the carriage softened into warmth and motion and the world narrowed to a ribbon.
Beneath the tone there was a pattern; beneath the pattern, a spelling you could almost pronounce; beneath the spelling, a kindness you didn’t quite trust.
You followed the sequence until breath and steel made the same argument and time pooled in the hollow of your ear.
A memory surfaced—a waiting room, a numbered ticket, someone you promised to meet “when the signal clears.”
You kept listening anyway, knowing that pretending to sleep is a way of asking the world to speak first.`
      },

      "10": {
        id: "10",
        text:
`The latch yielded a measured click.
Night slid in—rain, salt, metal—and the air tasted faintly of batteries, the sort of weather that remembers your name.
Up the line the rails met and argued; their debate traveled through the glass into your wrists and settled there like advice.
The chord inside the case turned from a note into a direction, pointing not outward but slightly inward, like a compass trained on an idea.
For an instant the carriage’s reflections doubled and you saw yourself stepping through two doors at once, both of them yours to close.`
      },

      "11": {
        id: "11",
        text:
`You tried the page again. It had the tide’s habit—arriving whole, receding in fragments—until a phrase clung and would not leave:
<span class="dotted">“Every signal is a promise.”</span> The words didn’t belong to your book, not exactly, but the case’s hum adopted them and made them warmer.
You read them aloud in a whisper and felt the rails answer with a long, patient vowel.
Promises, you decided, are simply agreements about which direction to face when the door opens.
You faced forward and let the sentence keep you company until the lamps outside began to keep time with it.`
      }
    }
  }
};

export function resolveTarget(currentSceneId: string, to: string) {
  if (to.includes(".")) {
    const [sceneId, beatId] = to.split(".");
    return { sceneId, beatId, sceneChange: sceneId !== currentSceneId };
  }
  return { sceneId: currentSceneId, beatId: to, sceneChange: false };
}

