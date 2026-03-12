// ==================== LEVEL DEFINITIONS ====================
// Logical coordinate space: 800 x 550
// Ball radius: 12, Target radius: varies (see each level)
// Gravity: 450 px/s² × 2x speed multiplier = effective 900 px/s²
// obstacle types: 'rect' {x,y,w,h}, 'circle' {cx,cy,r}
// moving obstacles add: moving:{axis:'x'|'y', min, max, speed}

export const LOGICAL_W = 800;
export const LOGICAL_H = 550;

export const LEVELS = [

  // ─── GROUP 1: Tutorial (1–5) — Very forgiving, big targets, clear intent ───

  {
    id: 1, name: "First Line",
    // Ball drops straight down. Draw any ramp near the bottom to
    // deflect it rightward toward the huge star.
    ball: { x: 120, y: 60, vx: 0, vy: 0 },
    target: { x: 680, y: 460, r: 36 },
    obstacles: [],
    hint: "Draw a diagonal ramp to redirect the ball to the star!",
  },

  {
    id: 2, name: "The Shelf",
    // A half-width shelf blocks the direct drop.
    // Draw a short angled line past the right end to guide ball down.
    ball: { x: 120, y: 60, vx: 0, vy: 0 },
    target: { x: 680, y: 460, r: 34 },
    obstacles: [
      { type: 'rect', x: 0, y: 240, w: 520, h: 18 },
    ],
    hint: "The shelf blocks the way — draw a ramp past its right edge!",
  },

  {
    id: 3, name: "Redirect",
    // Ball fires right. Shelf blocks the middle. Draw a bounce ramp
    // on the right wall to arc it down to the target below-left.
    ball: { x: 80, y: 80, vx: 260, vy: 0 },
    target: { x: 100, y: 460, r: 34 },
    obstacles: [
      { type: 'rect', x: 0, y: 240, w: 680, h: 18 },
    ],
    hint: "Ball fires right — draw a ramp on the far right to bounce it back down!",
  },

  {
    id: 4, name: "Launch Arc",
    // Ball launches upward-right. A vertical divider cuts the space.
    // Draw a short shelf near the top-right to catch and guide it down
    // to the large star in the lower-right quadrant.
    ball: { x: 80, y: 460, vx: 160, vy: -380 },
    target: { x: 680, y: 440, r: 34 },
    obstacles: [
      { type: 'rect', x: 340, y: 0, w: 18, h: 300 },
    ],
    hint: "Ball arcs up — draw a catching ramp on the right side to guide it to the star!",
  },

  {
    id: 5, name: "Corner Shot",
    // A clear L-shaped barrier. The gap above the horizontal arm is
    // the natural route. Draw a slight ramp to deflect ball rightward.
    ball: { x: 120, y: 60, vx: 0, vy: 0 },
    target: { x: 680, y: 460, r: 32 },
    obstacles: [
      { type: 'rect', x: 0,   y: 260, w: 460, h: 18 },
      { type: 'rect', x: 460, y: 80,  w: 18,  h: 160 },  // bottom at y=240, 8px above ball path
    ],
    hint: "L-shaped wall — guide the ball to the right before it reaches the corner!",
  },

  // ─── GROUP 2: Easy (6–10) — One concept introduced per level ───

  {
    id: 6, name: "The Gap",
    // Two shelf segments leave a gap in the middle.
    // Route the ball cleanly through the gap.
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 30 },
    obstacles: [
      { type: 'rect', x: 0,   y: 250, w: 280, h: 18 },
      { type: 'rect', x: 420, y: 250, w: 380, h: 18 },
    ],
    hint: "There's a gap in the wall — thread the ball through it!",
  },

  {
    id: 7, name: "Pinball",
    // Two round bumpers. Draw a ramp so the ball arcs between or
    // around them down to the star on the right.
    ball: { x: 120, y: 60, vx: 0, vy: 0 },
    target: { x: 680, y: 460, r: 30 },
    obstacles: [
      { type: 'circle', cx: 280, cy: 200, r: 38 },
      { type: 'circle', cx: 520, cy: 340, r: 38 },
    ],
    hint: "Bounce off the bumpers — or draw a path that avoids them entirely!",
  },

  {
    id: 8, name: "Staircase",
    // Three descending shelves stepping right. Each shelf has a gap on its
    // right end. Ball must bounce down each step in sequence.
    // Shelf 3 ends at x=680 so the target at x=730 is reachable beyond it.
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 730, y: 490, r: 28 },
    obstacles: [
      { type: 'rect', x: 0,   y: 180, w: 340, h: 18 },  // gap x > 340
      { type: 'rect', x: 280, y: 320, w: 340, h: 18 },  // gap x > 620
      { type: 'rect', x: 540, y: 430, w: 160, h: 18 },  // gap x > 700 — does NOT reach wall
    ],
    hint: "Three steps block the way — give the ball rightward momentum to bounce down each gap!",
  },

  {
    id: 9, name: "Box Escape",
    // Ball starts inside an open-bottomed U-shaped enclosure.
    // Draw a ramp to launch it out the open bottom.
    ball: { x: 400, y: 180, vx: 0, vy: 0 },
    target: { x: 680, y: 460, r: 28 },
    obstacles: [
      { type: 'rect', x: 200, y: 60,  w: 18,  h: 320 },
      { type: 'rect', x: 200, y: 60,  w: 380, h: 18  },
      { type: 'rect', x: 560, y: 60,  w: 18,  h: 260 },
      // bottom is open — ball escapes down
    ],
    hint: "The box has an open bottom — draw a ramp to launch yourself out!",
  },

  {
    id: 10, name: "Zigzag",
    // Ball starts top-right. Shelf 1 has a gap on the left; shelf 2 has a
    // gap on the right. Draw a ramp to send the ball left through shelf 1's
    // gap — it then bounces off the left wall and crosses to the right gap
    // of shelf 2, reaching the star.
    ball: { x: 600, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 28 },
    obstacles: [
      { type: 'rect', x: 180, y: 200, w: 620, h: 18 },  // gap x < 180
      { type: 'rect', x: 0,   y: 360, w: 620, h: 18 },  // gap x > 620
    ],
    hint: "Draw a ramp to send the ball left, bounce it off the wall, then let it fly right to the star!",
  },

  // ─── GROUP 3: Medium (11–15) — Multiple obstacles, tighter spaces ───

  {
    id: 11, name: "The Funnel",
    // Ball starts on the left side; two nested rings of shelves narrow the
    // center corridor. Draw a ramp to deflect the ball through both gaps
    // and into the target at the bottom of the funnel.
    ball: { x: 120, y: 60, vx: 0, vy: 0 },
    target: { x: 400, y: 480, r: 26 },
    obstacles: [
      { type: 'rect', x: 0,   y: 160, w: 280, h: 18 },  // outer left  — gap x > 280
      { type: 'rect', x: 520, y: 160, w: 280, h: 18 },  // outer right — gap x < 520
      { type: 'rect', x: 0,   y: 320, w: 160, h: 18 },  // inner left  — gap x > 160
      { type: 'rect', x: 640, y: 320, w: 160, h: 18 },  // inner right — gap x < 640
    ],
    hint: "The funnel narrows — draw a ramp to send the ball through the center gaps!",
  },

  {
    id: 12, name: "Flipper",
    // Ball launches right into a tall vertical wall, then a floor.
    // U-shaped arena — target is back near the start but elevated.
    // Draw a ramp against the far wall to arc it back up.
    ball: { x: 80, y: 80, vx: 220, vy: 0 },
    target: { x: 80, y: 100, r: 26 },
    obstacles: [
      { type: 'rect', x: 680, y: 0,   w: 18, h: 440 },
      { type: 'rect', x: 0,   y: 420, w: 700, h: 18 },
    ],
    hint: "Bounce off the far wall and back — draw a ramp to arc it home!",
  },

  {
    id: 13, name: "Maze Runner",
    // A 2-bend maze. Ball must navigate two right-angle turns.
    // Shelf 1 covers the left; pass through the right gap (x > 480).
    // Shelf 2 covers the right but stops at x = 660 — the target sits
    // just past that right gap so the ball falls through to the star.
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 26 },
    obstacles: [
      { type: 'rect', x: 0,   y: 200, w: 480, h: 18 },  // gap x > 480
      { type: 'rect', x: 480, y: 0,   w: 18,  h: 200 },
      { type: 'rect', x: 320, y: 360, w: 340, h: 18 },  // ends at x=660 — gap x > 660
      { type: 'rect', x: 320, y: 200, w: 18,  h: 168 },
    ],
    hint: "Follow the maze — deflect right through shelf 1, then right again past shelf 2!",
  },

  {
    id: 14, name: "Bumper Field",
    // Three bumpers in a triangle. Target at bottom-right.
    // Draw a ramp that threads the ball between two bumpers.
    ball: { x: 80, y: 60, vx: 180, vy: 0 },
    target: { x: 700, y: 460, r: 26 },
    obstacles: [
      { type: 'circle', cx: 240, cy: 200, r: 38 },
      { type: 'circle', cx: 560, cy: 200, r: 38 },
      { type: 'circle', cx: 400, cy: 360, r: 38 },
    ],
    hint: "Three bumpers form a triangle — thread the ball between them!",
  },

  {
    id: 15, name: "The Canyon",
    // Both canyon walls start at y=120, leaving a clear opening at the top.
    // Ball starts just left of the left wall — draw a ramp to arc the ball
    // rightward so it drops through the open top into the canyon below.
    ball: { x: 240, y: 60, vx: 0, vy: 0 },
    target: { x: 400, y: 430, r: 26 },
    obstacles: [
      { type: 'rect', x: 300, y: 120, w: 18, h: 420 },
      { type: 'rect', x: 500, y: 120, w: 18, h: 420 },
    ],
    hint: "Both walls have an open top — draw a ramp to arc the ball in and drop it to the star!",
  },

  // ─── GROUP 4: Hard (16–20) — Moving obstacles, precision required ───

  {
    id: 16, name: "Moving Wall",
    // A single tall vertical panel slides horizontally.
    // Time your line to let the ball through when the gap opens.
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 24 },
    obstacles: [
      { type: 'rect', x: 370, y: 80, w: 18, h: 360,
        moving: { axis: 'x', min: 160, max: 580, speed: 110 } },
    ],
    hint: "The wall moves — draw your line when the gap is on your side!",
  },

  {
    id: 17, name: "Gauntlet",
    // Three alternating vertical walls with bottom/top openings.
    // Ball has forward velocity. Draw a ramp to negotiate each gap.
    ball: { x: 80, y: 60, vx: 240, vy: 0 },
    target: { x: 700, y: 460, r: 24 },
    obstacles: [
      { type: 'rect', x: 200, y: 0,   w: 18, h: 300 },
      { type: 'rect', x: 400, y: 250, w: 18, h: 300 },
      { type: 'rect', x: 600, y: 0,   w: 18, h: 300 },
    ],
    hint: "Three walls alternate top/bottom gaps — weave the ball through!",
  },

  {
    id: 18, name: "Orbit",
    // A large circle sits in the middle. Ball and target are on
    // opposite sides at the same height. Must arc over or under.
    ball: { x: 80, y: 275, vx: 0, vy: 0 },
    target: { x: 720, y: 275, r: 24 },
    obstacles: [
      { type: 'circle', cx: 400, cy: 275, r: 115 },
    ],
    hint: "Giant obstacle in the middle — draw a ramp to arc the ball above or below it!",
  },

  {
    id: 19, name: "Twin Movers",
    // Two vertical panels move up-and-down at different speeds.
    // Find the window when both gaps align.
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 22 },
    obstacles: [
      { type: 'rect', x: 240, y: 100, w: 18, h: 280,
        moving: { axis: 'y', min: 60, max: 270, speed: 80 } },
      { type: 'rect', x: 540, y: 180, w: 18, h: 280,
        moving: { axis: 'y', min: 60, max: 270, speed: 115 } },
    ],
    hint: "Two walls slide at different speeds — draw your line when both gaps open up!",
  },

  {
    id: 20, name: "The Cross",
    // Cross-shaped barrier with four entry arcs.
    // Ball fires right with momentum — guide it through the correct quadrant.
    ball: { x: 80, y: 60, vx: 160, vy: 0 },
    target: { x: 700, y: 460, r: 22 },
    obstacles: [
      { type: 'rect', x: 310, y: 80,  w: 180, h: 18 },
      { type: 'rect', x: 310, y: 360, w: 180, h: 18 },
      { type: 'rect', x: 0,   y: 215, w: 310, h: 18 },
      { type: 'rect', x: 490, y: 215, w: 310, h: 18 },
    ],
    hint: "A cross-shaped wall — go around the outside or thread the center gaps!",
  },

  // ─── GROUP 5: Very Hard (21–25) — Combinations, tight timing ───

  {
    id: 21, name: "Tight Squeeze",
    // Two narrow vertical slits. The gaps are 70px wide — barely
    // enough for the ball. Precise line placement required.
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 20 },
    obstacles: [
      { type: 'rect', x: 0,   y: 0,   w: 240, h: 18 },
      { type: 'rect', x: 310, y: 0,   w: 490, h: 18 },
      { type: 'rect', x: 0,   y: 290, w: 490, h: 18 },
      { type: 'rect', x: 560, y: 290, w: 240, h: 18 },
    ],
    hint: "Two narrow horizontal gaps — thread the ball through both precisely!",
  },

  {
    id: 22, name: "Bumper Gauntlet",
    // Three bumpers in a row plus a shelf below.
    // Tight corridors between them. Ball has momentum.
    ball: { x: 80, y: 60, vx: 200, vy: 0 },
    target: { x: 700, y: 460, r: 20 },
    obstacles: [
      { type: 'circle', cx: 230, cy: 200, r: 34 },
      { type: 'circle', cx: 400, cy: 300, r: 34 },
      { type: 'circle', cx: 570, cy: 200, r: 34 },
      { type: 'rect',   x: 0,   y: 420, w: 540, h: 18 },
    ],
    hint: "Bumpers and a shelf — draw a line that threads between them all!",
  },

  {
    id: 23, name: "The Spiral",
    // Inward-spiraling walls. Ball must enter from the top opening
    // and reach the center target. Requires a precise curved-ish line.
    ball: { x: 400, y: 60, vx: 0, vy: 0 },
    target: { x: 400, y: 280, r: 22 },
    obstacles: [
      // Outer ring — open at top-center
      { type: 'rect', x: 120, y: 130, w: 560, h: 18 },
      { type: 'rect', x: 120, y: 130, w: 18,  h: 240 },
      { type: 'rect', x: 120, y: 350, w: 380, h: 18 },
      // Inner ring — open at right
      { type: 'rect', x: 240, y: 210, w: 280, h: 18 },
      { type: 'rect', x: 240, y: 210, w: 18,  h: 160 },
      { type: 'rect', x: 240, y: 350, w: 140, h: 18 },
    ],
    hint: "Spiral inward — find the break in each ring and guide the ball to the center!",
  },

  {
    id: 24, name: "Chaos",
    // Mixed obstacle types + one mover. Requires reading the layout
    // and placing a line that threads multiple hazards.
    ball: { x: 80, y: 60, vx: 200, vy: 0 },
    target: { x: 700, y: 460, r: 20 },
    obstacles: [
      { type: 'rect',   x: 220, y: 80,  w: 18, h: 220 },
      { type: 'circle', cx: 380, cy: 320, r: 50 },
      { type: 'rect',   x: 460, y: 200, w: 200, h: 18 },
      { type: 'rect',   x: 580, y: 80,  w: 18, h: 200,
        moving: { axis: 'y', min: 40, max: 220, speed: 90 } },
    ],
    hint: "Wall, bumper, shelf and a mover — read the layout and place one great line!",
  },

  {
    id: 25, name: "Pinpoint",
    // Small target enclosed in a narrow corridor. Ball must enter
    // through a tight slot on the left side.
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 680, y: 275, r: 16 },
    obstacles: [
      { type: 'rect', x: 0,   y: 190, w: 580, h: 18 },
      { type: 'rect', x: 200, y: 360, w: 600, h: 18 },
      { type: 'rect', x: 580, y: 190, w: 18,  h: 190 },
    ],
    hint: "The target hides in a narrow slot — guide the ball in from the left opening!",
  },

  // ─── GROUP 6: Expert (26–30) — Tight puzzles, clever placement ───

  {
    id: 26, name: "The Gauntlet",
    // Three staggered vertical barriers with a bumper near the exit.
    // Must navigate each gap cleanly under time pressure.
    ball: { x: 80, y: 60, vx: 230, vy: 0 },
    target: { x: 700, y: 460, r: 18 },
    obstacles: [
      { type: 'rect', x: 190, y: 0,   w: 18, h: 290 },
      { type: 'rect', x: 380, y: 260, w: 18, h: 290 },
      { type: 'rect', x: 570, y: 0,   w: 18, h: 290 },
      { type: 'circle', cx: 280, cy: 410, r: 32 },
    ],
    hint: "Three staggered walls and a bumper — place your line to weave through all of them!",
  },

  {
    id: 27, name: "Triple Movers",
    // Three independent moving panels at different speeds.
    // Must read the phase and draw to exploit alignment.
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 18 },
    obstacles: [
      { type: 'rect', x: 190, y: 80,  w: 18, h: 220,
        moving: { axis: 'y', min: 40, max: 330, speed: 65 } },
      { type: 'rect', x: 400, y: 200, w: 18, h: 220,
        moving: { axis: 'y', min: 40, max: 330, speed: 105 } },
      { type: 'rect', x: 610, y: 120, w: 18, h: 220,
        moving: { axis: 'y', min: 40, max: 330, speed: 80 } },
    ],
    hint: "Three walls move at different speeds — watch the gaps and time your launch!",
  },

  {
    id: 28, name: "The Labyrinth",
    // Dense multi-path maze. Only one route leads cleanly to the target.
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 18 },
    obstacles: [
      { type: 'rect', x: 0,   y: 150, w: 360, h: 18 },
      { type: 'rect', x: 440, y: 150, w: 360, h: 18 },
      { type: 'rect', x: 360, y: 0,   w: 18,  h: 150 },
      { type: 'rect', x: 180, y: 300, w: 380, h: 18 },
      { type: 'rect', x: 180, y: 150, w: 18,  h: 168 },
      { type: 'rect', x: 560, y: 300, w: 18,  h: 180 },
      { type: 'rect', x: 0,   y: 440, w: 200, h: 18 },
      { type: 'rect', x: 340, y: 440, w: 460, h: 18 },
    ],
    hint: "The labyrinth has one clean path — study it before you draw!",
  },

  {
    id: 29, name: "Bullet Run",
    // Ball and target both at mid-height. Large circles block the
    // center corridor top and bottom, forcing a precise S-curve path.
    ball: { x: 80, y: 275, vx: 0, vy: 0 },
    target: { x: 720, y: 275, r: 16 },
    obstacles: [
      { type: 'rect',   x: 0,   y: 0,   w: 800, h: 70  },
      { type: 'rect',   x: 0,   y: 480, w: 800, h: 70  },
      { type: 'circle', cx: 220, cy: 275, r: 55 },
      { type: 'circle', cx: 400, cy: 160, r: 45 },
      { type: 'circle', cx: 400, cy: 390, r: 45 },
      { type: 'circle', cx: 580, cy: 275, r: 55 },
    ],
    hint: "Thread the needle through the circle gauntlet — one perfect arc does it!",
  },

  {
    id: 30, name: "Grand Finale",
    // Everything: three static walls, two bumpers, one moving panel.
    // Small target. Ball has forward velocity. Every element interacts.
    ball: { x: 80, y: 60, vx: 200, vy: 0 },
    target: { x: 700, y: 460, r: 15 },
    obstacles: [
      { type: 'rect',   x: 200, y: 0,   w: 18, h: 280 },
      { type: 'rect',   x: 420, y: 270, w: 18, h: 280 },
      { type: 'rect',   x: 620, y: 0,   w: 18, h: 280 },
      { type: 'circle', cx: 310, cy: 390, r: 36 },
      { type: 'circle', cx: 520, cy: 160, r: 36 },
      { type: 'rect',   x: 190, y: 260, w: 18, h: 220,
        moving: { axis: 'y', min: 130, max: 360, speed: 90 } },
    ],
    hint: "The Grand Finale — every skill combined. One perfect line wins it all!",
  },
];
