export type Choice = { label: string; to: string };
export type Beat = { id: string; text: string; choices?: Choice[] };
export type Scene = { id: string; title?: string; start: string; beats: Record<string, Beat> };
export type Story = Record<string, Scene>;

export const story: Story = {
  scene1: {
    id: "scene1",
    title: "Night Train",
    start: "intro",
    beats: {
      intro: {
        id: "intro",
        text:
          `The night train slid along the coast, and salt speckled the windows like a quiet constellation. Carriage lights breathed with the rails—inhale on the bend, exhale on the straight—and the pages in your lap rose and fell as if trying to keep time. Across the aisle, a courier hugged a tin case to their ribs with the wary devotion reserved for heirlooms or fragile lies. The case hummed—faint, persistent, as if a tuning fork had been struck somewhere just out of sight. You told yourself to read, but the words kept surfacing like foam, refusing to sink.`,
        choices: [
          { label: "Watch the courier more closely", to: "watch" },
          { label: "Turn to the window and read the sea", to: "sea" }
        ]
      },
      watch: {
        id: "watch",
        text:
          `The courier’s coat was neat, every button partnered, every pocket closed. The case itself was rubbed matte by years of handling, yet the hum inside it felt young—impatient, bright at the edges. You imagined its interior: coiled wire, a folded note, a small clock that believed time wasn’t a circle but a knot. The courier noticed you noticing and lowered their gaze, as though hiding the eyes could hide the rest. The hum kept a rhythm your pulse tried—unsuccessfully—to imitate.`,
        choices: [
          { label: "Ask an innocent question", to: "talk" },
          { label: "Pretend to sleep and keep listening", to: "sleep" }
        ]
      },
      sea: {
        id: "sea",
        text:
          `Outside, the coast unspooled in charcoal strokes. The water lifted and set itself down again, counting something the world had forgotten. Salt filmed the glass; when you breathed, the fog drew a temporary halo that slid away with the next sway of the car. Shore lights arrived like punctuation—comma, comma, dash—until a long pause held. Your reflection drifted over the black water like a late cloud. Behind it, the courier’s case held its private note.`,
        choices: [
          { label: "Crack the window to taste the air", to: "window" },
          { label: "Face forward and steady your thoughts", to: "book" }
        ]
      },
      talk: {
        id: "talk",
        text:
          `"Late run," you said, as if lateness were a secret only travelers kept. The courier’s mouth shaped the start of a smile and then set it aside, like a cup placed carefully beyond reach. "Late, but safe," they said. Their fingers tapped a patient rhythm on the case; the hum adjusted, finding a second voice, a harmony. Somewhere under your feet the rails leaned into a curve you didn’t remember from the map.`,
        choices: [
          { label: "Step off at the next stop", to: "scene2.platform" },
          { label: "Stay aboard and shadow the courier", to: "scene2.cab" }
        ]
      },
      sleep: {
        id: "sleep",
        text:
          `You let your eyelids fall until the carriage softened into warmth and motion. In the dimness, the hum grew clearer, a thread held taut by a careful hand. You pictured a staff of music stamped into tin, notes punched like stars across a winter sky. Each vibration rang a tiny bone near your ear. It was not a lullaby. It was a spelling, and you wanted the word.`,
        choices: [
          { label: "Wake as the brakes begin to sing", to: "scene2.platform" },
          { label: "Keep drifting and trust your ears", to: "scene2.cab" }
        ]
      },
      window: {
        id: "window",
        text:
          `You thumbed the latch. Night slid in—a thin seam of rain, salt, and metal. The train wore the weather like a second skin; the air tasted faintly of batteries. Up the track, two rails met and argued, their disagreement arriving as a tremor in your wrists. The case across the aisle agreed, its hum rounding into a chord that felt like a direction.`,
        choices: [
          { label: "Follow the current off the train", to: "scene2.platform" },
          { label: "Sit back and learn the chord", to: "scene2.cab" }
        ]
      },
      book: {
        id: "book",
        text:
          `You tried the page again. The paragraph had the tide’s habit—arriving whole, receding in fragments. A phrase clung: <span class="dotted">“Every signal is a promise.”</span> It wasn’t from your book, not exactly. The words rang against the case’s hum and came back altered, warm as a coin returned from a closed fist. Promises were still promises, even when they traveled in disguise.`,
        choices: [
          { label: "Mist drifting over the platform", to: "scene2.platform" },
          { label: "Lamplight and corridor whispers", to: "scene2.cab" }
        ]
      }
    }
  },

  scene2: {
    id: "scene2",
    title: "Between Stations",
    start: "platform",
    beats: {
      platform: {
        id: "platform",
        text:
          `The platform breathed rain and diesel. Overhead, a loudspeaker cleared its throat and decided against speaking. Passengers unscrolled from the doors like careful paper figures, each with a crease you could read if you stood still enough. The courier kept the case close. The hum softened—not gone, but polite—as though you had stepped into a room where people whispered by custom.`,
        choices: [
          { label: "Follow the signs painted in old arrows", to: "signs" },
          { label: "Wait near the case and listen", to: "wait" }
        ]
      },
      cab: {
        id: "cab",
        text:
          `The corridor was warm and metallic, a tunnel of brushed light. Doors breathed at the edges. The case’s tone resolved into intervals that made a geometry in your chest, a shape you could almost name. The courier paused by a window where the night pressed its ear to the glass. Reflections layered: you, the courier, the case—and something else that watched like a patient ledger.`,
        choices: [
          { label: "Try the brass latch one door down", to: "door" },
          { label: "Stand still and let the tone resolve", to: "listen" }
        ]
      },
      signs: {
        id: "signs",
        text:
          `Arrows pointed left, then right, then left again, a chorus without a conductor. You chose one because choosing is how the world keeps moving. Halfway down the hall the arrow pointed back at you, and you understood that some signs measure attention, not distance. You were paying.`,
      },
      wait:  {
        id: "wait",
        text:
          `You waited until the waiting had edges. The case’s hum settled in the space behind your teeth, a coin held there for luck. The train shifted, metal speaking to metal in a language old enough to ignore your questions.`,
      },
      door:  {
        id: "door",
        text:
          `The latch lifted with a courteous resistance, the sort of boundary that wants to be acknowledged. Inside, the air was cooler. The chord bent lower, like a bow. You stepped in. The corridor forgot you.`,
      },
      listen:{
        id: "listen",
        text:
          `You let the tone speak until it stopped needing to be a tone. Beneath it was a pattern; beneath the pattern, a kindness you didn’t trust yet. You did not move. The train moved you.`,
      }
    }
  }
};

export function resolveTarget(currentSceneId: string, to: string) {
  if (to.includes(".")) {
    const [sceneId, beatId] = to.split(".");
    return { sceneId, beatId, sceneChange: true };
  }
  return { sceneId: currentSceneId, beatId: to, sceneChange: false };
}

