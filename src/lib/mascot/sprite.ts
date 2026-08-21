/**
 * VEASNA — pixel sprite data for the mascot.
 *
 * "Veasna" is a firefly lantern-spirit: a small round glow-bug that carries a
 * paper lantern and lights the way through a screening session.
 *
 * The art is authored as a 20x20 character grid. One character = one sprite
 * pixel. The renderer (PixelMascot) paints it onto a <canvas> at 1 canvas
 * pixel per sprite pixel and scales up with nearest-neighbour, so it stays
 * crisp at any size. No image assets and no drawing libraries involved.
 */

export const SPRITE_W = 20;
export const SPRITE_H = 20;

/** Palette. A key of "." means "leave transparent". */
export const PALETTE: Record<string, string> = {
  o: "#2c2016", // outline / ink
  b: "#ffd98a", // body
  h: "#fff2c8", // body highlight
  s: "#e5ad55", // body shadow
  c: "#ff9d9d", // cheek blush
  e: "#2c2016", // eye
  E: "#ffffff", // eye shine
  w: "#79d6cf", // wing
  W: "#cdf6f2", // wing highlight
  m: "#7a6448", // lantern frame
  l: "#ffe27a", // lantern glass
  L: "#fffdf0", // lantern flame
};

/** Palette keys that belong to the wings — the renderer flaps these. */
export const WING_KEYS = new Set(["w", "W"]);
/** Palette keys that emit light — the renderer draws a bloom behind these. */
export const EMISSIVE_KEYS = new Set(["l", "L"]);

/**
 * The body. Rows 7, 8 (eyes) and 10 (mouth) are placeholders — `buildFrame`
 * swaps in the expression rows below. Every row is exactly SPRITE_W chars.
 */
const BODY: string[] = [
  /* 0  antenna tips  */ ".......l....l.......",
  /* 1  antennae      */ ".......o....o.......",
  /* 2  antennae      */ "........o..o........",
  /* 3  crown         */ ".....oooooooooo.....",
  /* 4  head          */ "....obhbbbbbbsbo....",
  /* 5  wings furl    */ "...wobhbbbbbbsbow...",
  /* 6  wings         */ "..WwobhbbbbbbsbowW..",
  /* 7  EYES (upper)  */ ".Wwwo__________owwW.",
  /* 8  EYES (lower)  */ ".Wwwo__________owwW.",
  /* 9  cheeks        */ ".Wwwocbbbbbbbbcowww.",
  /* 10 MOUTH         */ "..Wwo__________owW..",
  /* 11 body          */ "...wobsbbbbbbsbow...",
  /* 12 body          */ "....obsbbbbbbsbo....",
  /* 13 body taper    */ ".....ossbbbbsso.....",
  /* 14 base          */ "......oooooooo......",
  /* 15 legs + arm    */ "........o...o.oo....",
  /* 16 feet + handle */ ".......ooo.ooo.mmmm.",
  /* 17 lantern       */ "..............ollllo",
  /* 18 lantern flame */ "..............olLLlo",
  /* 19 lantern base  */ "..............oooooo",
];

const INNER_START = 5;
const INNER_WIDTH = 10;
const EYE_ROW_UPPER = 7;
const EYE_ROW_LOWER = 8;
const MOUTH_ROW = 10;

/** The interior columns of a row that expressions write into. */
type Inner = string;

const EYES: Record<string, [Inner, Inner]> = {
  //          upper         lower
  open:     ["bEebbbbEeb", "beebbbbeeb"],
  blink:    ["bbbbbbbbbb", "boobbbboob"],
  happy:    ["bbobbbbobb", "bobobbobob"],
  wide:     ["beeebbeeeb", "beEebbeEeb"],
  thinking: ["beebbbbeeb", "bbbbbbbbbb"],
  asleep:   ["bbbbbbbbbb", "boobbbboob"],
  focused:  ["bbbbbbbbbb", "beebbbbeeb"],
};

const MOUTHS: Record<string, Inner> = {
  smile: "bbbboobbbb",
  talk:  "bbboooobbb",
  small: "bbbboobbbb",
  flat:  "bbboooobbb",
  none:  "bbbbbbbbbb",
};

function splice(row: string, inner: Inner): string {
  // Keep the outline and wing columns from BODY; swap only the face.
  return row.slice(0, INNER_START) + inner + row.slice(INNER_START + INNER_WIDTH);
}

export type Expression = keyof typeof EYES;
export type Mouth = keyof typeof MOUTHS;

export interface FrameSpec {
  eyes: Expression;
  mouth: Mouth;
}

/** Named poses the rest of the app refers to. */
export const POSES = {
  idle:     { eyes: "open",     mouth: "smile" },
  blink:    { eyes: "blink",    mouth: "smile" },
  talking:  { eyes: "open",     mouth: "talk" },
  happy:    { eyes: "happy",    mouth: "smile" },
  cheer:    { eyes: "happy",    mouth: "talk" },
  alert:    { eyes: "wide",     mouth: "small" },
  thinking: { eyes: "thinking", mouth: "small" },
  sleeping: { eyes: "asleep",   mouth: "none" },
  working:  { eyes: "focused",  mouth: "flat" },
} as const satisfies Record<string, FrameSpec>;

export type PoseName = keyof typeof POSES;

/** Build the full 20x20 grid for a pose. */
export function buildFrame(pose: PoseName): string[] {
  const spec = POSES[pose];
  const [upper, lower] = EYES[spec.eyes];
  const rows = BODY.slice();
  rows[EYE_ROW_UPPER] = splice(rows[EYE_ROW_UPPER], upper);
  rows[EYE_ROW_LOWER] = splice(rows[EYE_ROW_LOWER], lower);
  rows[MOUTH_ROW] = splice(rows[MOUTH_ROW], MOUTHS[spec.mouth]);
  return rows;
}

/** Every pose pre-built once, so the render loop never rebuilds strings. */
export const FRAMES: Record<PoseName, string[]> = Object.fromEntries(
  (Object.keys(POSES) as PoseName[]).map((p) => [p, buildFrame(p)])
) as Record<PoseName, string[]>;

/**
 * Development guard: catches a mis-typed row while editing the art above.
 * Tree-shaken out of production builds.
 */
if (process.env.NODE_ENV !== "production") {
  BODY.forEach((row, y) => {
    if (row.length !== SPRITE_W) {
      console.error(`[mascot] BODY row ${y} is ${row.length} chars, expected ${SPRITE_W}`);
    }
  });
  Object.entries(EYES).forEach(([name, pair]) =>
    pair.forEach((inner, i) => {
      if (inner.length !== INNER_WIDTH) {
        console.error(`[mascot] eyes "${name}"[${i}] is ${inner.length} chars, expected ${INNER_WIDTH}`);
      }
    })
  );
  Object.entries(MOUTHS).forEach(([name, inner]) => {
    if (inner.length !== INNER_WIDTH) {
      console.error(`[mascot] mouth "${name}" is ${inner.length} chars, expected ${INNER_WIDTH}`);
    }
  });
}
