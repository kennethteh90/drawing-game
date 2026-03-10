// ==================== LEVEL DEFINITIONS ====================
// Logical coordinate space: 800 x 550
// Ball radius: 12, Target radius: 25 (default)
// obstacle types: 'rect' {x,y,w,h}, 'circle' {cx,cy,r}
// moving obstacles add: moving:{axis:'x'|'y', min, max, speed}

export const LOGICAL_W = 800;
export const LOGICAL_H = 550;

export const LEVELS = [
  // ─── GROUP 1: Tutorial (1–5) ───
  {
    id: 1, name: "First Line",
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 32 },
    obstacles: [],
    hint: "Draw a diagonal line to redirect the ball to the star!",
  },
  {
    id: 2, name: "The Shelf",
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 30 },
    obstacles: [
      { type: 'rect', x: 0, y: 240, w: 560, h: 18, color: '#4a4a7a' },
    ],
    hint: "Draw a ramp to deflect the ball past the shelf!",
  },
  {
    id: 3, name: "Redirect",
    ball: { x: 80, y: 60, vx: 250, vy: 0 },
    target: { x: 80, y: 460, r: 30 },
    obstacles: [
      { type: 'rect', x: 0, y: 220, w: 700, h: 18, color: '#4a4a7a' },
    ],
    hint: "Bounce the ball back to the left side!",
  },
  {
    id: 4, name: "High Five",
    ball: { x: 80, y: 460, vx: 200, vy: -420 },
    target: { x: 700, y: 80, r: 30 },
    obstacles: [
      { type: 'rect', x: 350, y: 0, w: 18, h: 340, color: '#4a4a7a' },
    ],
    hint: "The ball is launched upward — guide it past the wall!",
  },
  {
    id: 5, name: "Corner Shot",
    ball: { x: 400, y: 60, vx: 0, vy: 0 },
    target: { x: 720, y: 480, r: 30 },
    obstacles: [
      { type: 'rect', x: 480, y: 200, w: 320, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 480, y: 200, w: 18, h: 220, color: '#4a4a7a' },
    ],
    hint: "Navigate the ball around the L-shaped wall!",
  },

  // ─── GROUP 2: Easy (6–10) ───
  {
    id: 6, name: "The Gap",
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 28 },
    obstacles: [
      { type: 'rect', x: 0, y: 240, w: 280, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 380, y: 240, w: 420, h: 18, color: '#4a4a7a' },
    ],
    hint: "Guide the ball through the gap in the wall!",
  },
  {
    id: 7, name: "Pinball",
    ball: { x: 400, y: 60, vx: 0, vy: 0 },
    target: { x: 720, y: 460, r: 28 },
    obstacles: [
      { type: 'circle', cx: 250, cy: 220, r: 40, color: '#3a3a6a' },
      { type: 'circle', cx: 550, cy: 320, r: 35, color: '#3a3a6a' },
    ],
    hint: "Use bumpers to your advantage!",
  },
  {
    id: 8, name: "Staircase",
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 680, y: 460, r: 28 },
    obstacles: [
      { type: 'rect', x: 0,   y: 200, w: 300, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 250, y: 320, w: 300, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 500, y: 440, w: 300, h: 18, color: '#4a4a7a' },
    ],
    hint: "Step down the staircase!",
  },
  {
    id: 9, name: "Box Escape",
    ball: { x: 400, y: 200, vx: 0, vy: 0 },
    target: { x: 680, y: 460, r: 28 },
    obstacles: [
      { type: 'rect', x: 200, y: 80,  w: 18, h: 300, color: '#4a4a7a' },
      { type: 'rect', x: 200, y: 80,  w: 340, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 522, y: 80,  w: 18, h: 220, color: '#4a4a7a' },
      // open bottom — ball can escape from below
    ],
    hint: "Draw a line to escape through the bottom opening!",
  },
  {
    id: 10, name: "Zigzag",
    ball: { x: 80, y: 60, vx: 300, vy: 0 },
    target: { x: 80, y: 460, r: 28 },
    obstacles: [
      { type: 'rect', x: 200, y: 180, w: 600, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 0,   y: 360, w: 600, h: 18, color: '#4a4a7a' },
    ],
    hint: "Zigzag down to the target!",
  },

  // ─── GROUP 3: Medium (11–15) ───
  {
    id: 11, name: "The Funnel",
    ball: { x: 400, y: 60, vx: 0, vy: 0 },
    target: { x: 400, y: 480, r: 25 },
    obstacles: [
      { type: 'rect', x: 0,   y: 0,   w: 280, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 520, y: 0,   w: 280, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 0,   y: 200, w: 200, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 600, y: 200, w: 200, h: 18, color: '#4a4a7a' },
    ],
    hint: "Thread the needle!",
  },
  {
    id: 12, name: "Flipper",
    ball: { x: 80, y: 60, vx: 200, vy: 0 },
    target: { x: 80, y: 80, r: 25 },
    obstacles: [
      { type: 'rect', x: 200, y: 0,   w: 18, h: 400, color: '#4a4a7a' },
      { type: 'rect', x: 200, y: 400, w: 600, h: 18, color: '#4a4a7a' },
    ],
    hint: "Bounce back up to the star near where you started!",
  },
  {
    id: 13, name: "Maze Runner",
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 25 },
    obstacles: [
      { type: 'rect', x: 0,   y: 180, w: 500, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 300, y: 360, w: 500, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 500, y: 0,   w: 18, h: 180, color: '#4a4a7a' },
      { type: 'rect', x: 300, y: 180, w: 18, h: 200, color: '#4a4a7a' },
    ],
    hint: "Find the path through the maze!",
  },
  {
    id: 14, name: "Bumper Field",
    ball: { x: 80, y: 60, vx: 150, vy: 0 },
    target: { x: 700, y: 460, r: 25 },
    obstacles: [
      { type: 'circle', cx: 250, cy: 180, r: 35, color: '#3a3a6a' },
      { type: 'circle', cx: 500, cy: 260, r: 35, color: '#3a3a6a' },
      { type: 'circle', cx: 350, cy: 380, r: 35, color: '#3a3a6a' },
    ],
    hint: "Dodge or use the bumpers!",
  },
  {
    id: 15, name: "The Canyon",
    ball: { x: 400, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 25 },
    obstacles: [
      { type: 'rect', x: 280, y: 0,   w: 18, h: 420, color: '#4a4a7a' },
      { type: 'rect', x: 520, y: 130, w: 18, h: 420, color: '#4a4a7a' },
    ],
    hint: "Escape the canyon — draw your line carefully!",
  },

  // ─── GROUP 4: Medium-Hard (16–20) ───
  {
    id: 16, name: "Moving Wall",
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 25 },
    obstacles: [
      { type: 'rect', x: 350, y: 100, w: 18, h: 300, color: '#6a4a9a',
        moving: { axis: 'x', min: 200, max: 600, speed: 90 } },
    ],
    hint: "The wall moves! Time your shot or draw around it.",
  },
  {
    id: 17, name: "Gauntlet",
    ball: { x: 80, y: 60, vx: 250, vy: 0 },
    target: { x: 700, y: 460, r: 25 },
    obstacles: [
      { type: 'rect', x: 200, y: 0,   w: 18, h: 320, color: '#4a4a7a' },
      { type: 'rect', x: 400, y: 230, w: 18, h: 320, color: '#4a4a7a' },
      { type: 'rect', x: 600, y: 0,   w: 18, h: 320, color: '#4a4a7a' },
    ],
    hint: "Weave through the gauntlet!",
  },
  {
    id: 18, name: "Orbit",
    ball: { x: 80, y: 280, vx: 0, vy: 0 },
    target: { x: 720, y: 280, r: 25 },
    obstacles: [
      { type: 'circle', cx: 400, cy: 275, r: 120, color: '#3a3a6a' },
    ],
    hint: "Navigate around the big circle!",
  },
  {
    id: 19, name: "Twin Movers",
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 22 },
    obstacles: [
      { type: 'rect', x: 200, y: 150, w: 18, h: 250, color: '#6a4a9a',
        moving: { axis: 'y', min: 80, max: 300, speed: 70 } },
      { type: 'rect', x: 550, y: 150, w: 18, h: 250, color: '#6a4a9a',
        moving: { axis: 'y', min: 80, max: 300, speed: 95 } },
    ],
    hint: "Two moving walls — find the opening!",
  },
  {
    id: 20, name: "The Cross",
    ball: { x: 80, y: 60, vx: 150, vy: 0 },
    target: { x: 700, y: 460, r: 22 },
    obstacles: [
      { type: 'rect', x: 320, y: 100, w: 160, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 320, y: 340, w: 160, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 0,   y: 220, w: 320, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 480, y: 220, w: 320, h: 18, color: '#4a4a7a' },
    ],
    hint: "Navigate through the cross-shaped barrier!",
  },

  // ─── GROUP 5: Hard (21–25) ───
  {
    id: 21, name: "Tight Squeeze",
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 20 },
    obstacles: [
      { type: 'rect', x: 240, y: 0,   w: 18, h: 240, color: '#4a4a7a' },
      { type: 'rect', x: 240, y: 310, w: 18, h: 240, color: '#4a4a7a' },
      { type: 'rect', x: 500, y: 0,   w: 18, h: 190, color: '#4a4a7a' },
      { type: 'rect', x: 500, y: 260, w: 18, h: 290, color: '#4a4a7a' },
    ],
    hint: "Precisely thread two narrow gaps!",
  },
  {
    id: 22, name: "Bumper Gauntlet",
    ball: { x: 80, y: 60, vx: 200, vy: 0 },
    target: { x: 700, y: 460, r: 20 },
    obstacles: [
      { type: 'circle', cx: 220, cy: 180, r: 30, color: '#3a3a6a' },
      { type: 'circle', cx: 400, cy: 280, r: 30, color: '#3a3a6a' },
      { type: 'circle', cx: 580, cy: 180, r: 30, color: '#3a3a6a' },
      { type: 'rect',   x: 0,   y: 400, w: 550, h: 18, color: '#4a4a7a' },
    ],
    hint: "Bounce past the bumpers and over the shelf!",
  },
  {
    id: 23, name: "Spiral",
    ball: { x: 400, y: 60, vx: 0, vy: 0 },
    target: { x: 400, y: 275, r: 22 },
    obstacles: [
      { type: 'rect', x: 150, y: 150, w: 500, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 150, y: 150, w: 18,  h: 220, color: '#4a4a7a' },
      { type: 'rect', x: 150, y: 350, w: 350, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 480, y: 220, w: 18,  h: 150, color: '#4a4a7a' },
      { type: 'rect', x: 270, y: 220, w: 230, h: 18, color: '#4a4a7a' },
    ],
    hint: "Guide the ball into the spiral's center!",
  },
  {
    id: 24, name: "Chaos",
    ball: { x: 80, y: 60, vx: 180, vy: 0 },
    target: { x: 700, y: 460, r: 20 },
    obstacles: [
      { type: 'rect', x: 200, y: 100, w: 18, h: 200, color: '#4a4a7a' },
      { type: 'rect', x: 400, y: 250, w: 200, h: 18, color: '#4a4a7a' },
      { type: 'circle', cx: 320, cy: 360, r: 45, color: '#3a3a6a' },
      { type: 'rect', x: 550, y: 100, w: 18, h: 300, color: '#4a4a7a',
        moving: { axis: 'y', min: 50, max: 200, speed: 80 } },
    ],
    hint: "Navigate through the chaos!",
  },
  {
    id: 25, name: "Pinpoint",
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 275, r: 15 },
    obstacles: [
      { type: 'rect', x: 0,   y: 180, w: 600, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 200, y: 370, w: 600, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 600, y: 198, w: 18, h: 172, color: '#4a4a7a' },
    ],
    hint: "The target is tiny — precision is everything!",
  },

  // ─── GROUP 6: Expert (26–30) ───
  {
    id: 26, name: "The Gauntlet",
    ball: { x: 80, y: 60, vx: 220, vy: 0 },
    target: { x: 700, y: 460, r: 18 },
    obstacles: [
      { type: 'rect', x: 180, y: 0,   w: 18, h: 280, color: '#5a2a7a' },
      { type: 'rect', x: 360, y: 270, w: 18, h: 280, color: '#5a2a7a' },
      { type: 'rect', x: 540, y: 0,   w: 18, h: 280, color: '#5a2a7a' },
      { type: 'circle', cx: 270, cy: 390, r: 30, color: '#3a2060' },
    ],
    hint: "The hardest gauntlet yet!",
  },
  {
    id: 27, name: "Triple Movers",
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 18 },
    obstacles: [
      { type: 'rect', x: 180, y: 100, w: 18, h: 200, color: '#6a3a9a',
        moving: { axis: 'y', min: 60, max: 340, speed: 60 } },
      { type: 'rect', x: 390, y: 200, w: 18, h: 200, color: '#6a3a9a',
        moving: { axis: 'y', min: 60, max: 340, speed: 100 } },
      { type: 'rect', x: 600, y: 100, w: 18, h: 200, color: '#6a3a9a',
        moving: { axis: 'y', min: 60, max: 340, speed: 75 } },
    ],
    hint: "Three moving walls stand between you and victory!",
  },
  {
    id: 28, name: "The Labyrinth",
    ball: { x: 80, y: 60, vx: 0, vy: 0 },
    target: { x: 700, y: 460, r: 18 },
    obstacles: [
      { type: 'rect', x: 0,   y: 140, w: 380, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 420, y: 140, w: 380, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 200, y: 280, w: 400, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 0,   y: 420, w: 250, h: 18, color: '#4a4a7a' },
      { type: 'rect', x: 550, y: 280, w: 18,  h: 160, color: '#4a4a7a' },
      { type: 'rect', x: 200, y: 280, w: 18,  h: 160, color: '#4a4a7a' },
    ],
    hint: "The ultimate labyrinth. Find the path!",
  },
  {
    id: 29, name: "Bullet",
    ball: { x: 80, y: 275, vx: 0, vy: 0 },
    target: { x: 720, y: 275, r: 16 },
    obstacles: [
      { type: 'circle', cx: 240, cy: 275, r: 50, color: '#3a3a6a' },
      { type: 'circle', cx: 400, cy: 140, r: 40, color: '#3a3a6a' },
      { type: 'circle', cx: 400, cy: 410, r: 40, color: '#3a3a6a' },
      { type: 'circle', cx: 560, cy: 275, r: 50, color: '#3a3a6a' },
      { type: 'rect',   x: 0,   y: 0,   w: 800, h: 80, color: '#4a4a7a' },
      { type: 'rect',   x: 0,   y: 470, w: 800, h: 80, color: '#4a4a7a' },
    ],
    hint: "Thread the needle down the center!",
  },
  {
    id: 30, name: "Grand Finale",
    ball: { x: 80, y: 60, vx: 200, vy: 0 },
    target: { x: 700, y: 460, r: 15 },
    obstacles: [
      { type: 'rect', x: 200, y: 0,   w: 18, h: 260, color: '#5a2a7a' },
      { type: 'rect', x: 400, y: 290, w: 18, h: 260, color: '#5a2a7a' },
      { type: 'rect', x: 600, y: 0,   w: 18, h: 260, color: '#5a2a7a' },
      { type: 'circle', cx: 300, cy: 380, r: 36, color: '#3a2060' },
      { type: 'circle', cx: 500, cy: 170, r: 36, color: '#3a2060' },
      { type: 'rect', x: 180, y: 260, w: 18, h: 200, color: '#6a3a9a',
        moving: { axis: 'y', min: 140, max: 360, speed: 85 } },
    ],
    hint: "The Grand Finale. Everything you've learned, applied!",
  },
];
