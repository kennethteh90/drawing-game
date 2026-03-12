// ==================== DRAW & BOUNCE — Phaser 3 Edition ====================
import { LEVELS, LOGICAL_W, LOGICAL_H } from './levels.js';
import { loadState, saveState, markLevelComplete, incrementAttempts, resetProgress } from './state.js';
import { stepPhysics, updateMovingObstacles, isBallStuck, isBallOOB, isAtTarget } from './physics.js';

const BALL_RADIUS    = 12;
const TRAIL_LENGTH   = 28;
const LINE_WIDTH     = 8;
const MIN_POINT_DIST = 5;

// =====================================================
//  Drawing wall-clip helpers
// =====================================================

// Returns t ∈ [0,1] of intersection of segment (ax,ay)→(bx,by) with
// segment (cx,cy)→(dx,dy), or null if none.
function segSegT(ax, ay, bx, by, cx, cy, dx, dy) {
  const dxAB = bx - ax, dyAB = by - ay;
  const dxCD = dx - cx, dyCD = dy - cy;
  const denom = dxAB * dyCD - dyAB * dxCD;
  if (Math.abs(denom) < 1e-10) return null;
  const t = ((cx - ax) * dyCD - (cy - ay) * dxCD) / denom;
  const u = ((cx - ax) * dyAB - (cy - ay) * dxAB) / denom;
  return (t >= 0 && t <= 1 && u >= 0 && u <= 1) ? t : null;
}

// Returns first t ∈ [0,1] where segment crosses obstacle boundary, or null.
function segObstacleT(ax, ay, bx, by, obs) {
  if (obs.type === 'rect') {
    const { x: rx, y: ry, w: rw, h: rh } = obs;
    const edges = [
      [rx,      ry,      rx + rw, ry     ],
      [rx,      ry + rh, rx + rw, ry + rh],
      [rx,      ry,      rx,      ry + rh],
      [rx + rw, ry,      rx + rw, ry + rh],
    ];
    let minT = null;
    for (const [ex0, ey0, ex1, ey1] of edges) {
      const t = segSegT(ax, ay, bx, by, ex0, ey0, ex1, ey1);
      if (t !== null && (minT === null || t < minT)) minT = t;
    }
    return minT;
  }
  if (obs.type === 'circle') {
    const dx = bx - ax, dy = by - ay;
    const fx = ax - obs.cx, fy = ay - obs.cy;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - obs.r * obs.r;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const sq = Math.sqrt(disc);
    const t1 = (-b - sq) / (2 * a);
    const t2 = (-b + sq) / (2 * a);
    if (t1 >= 0 && t1 <= 1) return t1;
    if (t2 >= 0 && t2 <= 1) return t2;
    return null;
  }
  return null;
}

// Returns true if point (px,py) is inside obstacle.
function pointInObstacle(px, py, obs) {
  if (obs.type === 'rect') {
    return px >= obs.x && px <= obs.x + obs.w && py >= obs.y && py <= obs.y + obs.h;
  }
  if (obs.type === 'circle') {
    const dx = px - obs.cx, dy = py - obs.cy;
    return dx * dx + dy * dy <= obs.r * obs.r;
  }
  return false;
}

// ---- deep-clone a level's mutable obstacle array ----
function cloneObstacles(obstacles) {
  return obstacles.map(o => {
    const c = Object.assign({}, o);
    if (c.moving) c.moving = Object.assign({}, c.moving);
    return c;
  });
}

// =====================================================
//  Phaser Scene — all rendering + input
// =====================================================
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  // ---- called once by Phaser at boot ----
  create() {
    // Shared game state (set by Game controller before scene starts)
    this.gfx        = this.add.graphics();
    this.trailGfx   = this.add.graphics();
    this.lineGfx    = this.add.graphics();
    this.ballGfx    = this.add.graphics();  // kept for trail & ghost; ball itself uses Image
    this.bgGfx      = this.add.graphics();
    this.overlayGfx = this.add.graphics(); // for background/grid

    // Depth ordering
    this.bgGfx.setDepth(0);
    this.gfx.setDepth(1);       // obstacles + target
    this.lineGfx.setDepth(2);   // drawn line
    this.trailGfx.setDepth(3);  // trail
    this.ballGfx.setDepth(4);   // ghost ball indicator (pre-launch)

    // --- Build high-quality programmatic textures via RenderTexture ---
    this._createBallTexture();
    this._createStarTexture();

    // Ball Image object — replaces per-frame ballGfx circle drawing
    this._ballImage = this.add.image(0, 0, 'tex_ball');
    this._ballImage.setDepth(4);
    this._ballImage.setBlendMode(Phaser.BlendModes.NORMAL);
    this._ballImage.setVisible(false);

    // Particle emitter (Phaser 3.60+ API)
    this._setupParticleEmitter();

    // Background drawn once (or on resize)
    this._drawBackground();

    // Star rotation angle
    this._starAngle = 0;
    this._pulseT    = 0;

    // Menu background pulse accumulator
    this._menuPulseT = 0;

    // Pointer input — forwarded to the controller
    this.input.on('pointerdown',  ptr => this._onPointerDown(ptr));
    this.input.on('pointermove',  ptr => this._onPointerMove(ptr));
    this.input.on('pointerup',    ptr => this._onPointerUp(ptr));
    this.input.on('pointerupoutside', ptr => this._onPointerUp(ptr));

    // Listen for resize so we redraw the background
    this.scale.on('resize', () => this._drawBackground());

    // ---- Phaser 3.60+ postFX — GPU-based glow & bloom ----
    // Applied once at setup; GPU handles the rest every frame at zero CPU cost.

    // Pink glow on the ball Graphics layer (ghost / trail halos)
    this.ballGfx.postFX.addGlow(0xff6b9d, 12, 0, false, 0.1, 8);

    // Ball Image glow — most visually impactful, keep quality reasonable
    this._ballImage.postFX.addGlow(0xff6b9d, 14, 0, false, 0.1, 10);

    // Cyan glow on the drawn line
    this.lineGfx.postFX.addGlow(0x00f5ff, 10, 0, false, 0.1, 8);

    // Purple glow on the obstacles/target layer — lightest pass
    this.gfx.postFX.addGlow(0x6c63ff, 4, 0, false, 0.1, 6);

    // NOTE: camera.postFX.addBloom intentionally omitted — full-screen bloom
    // is the single most expensive GPU pass and tanks mobile framerate.
  }

  // ---- Create a 64×64 RenderTexture for the ball ----
  // Radial gradient look: dark core → bright pink → transparent rim
  _createBallTexture() {
    const SIZE = 64;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Outer transparent halo (for the postFX glow to eat into)
    g.fillStyle(0xff3070, 0.0);
    g.fillCircle(SIZE / 2, SIZE / 2, SIZE / 2);

    // Soft outer glow ring
    g.fillStyle(0xff6b9d, 0.18);
    g.fillCircle(SIZE / 2, SIZE / 2, SIZE / 2 - 2);

    // Mid glow
    g.fillStyle(0xff4080, 0.55);
    g.fillCircle(SIZE / 2, SIZE / 2, SIZE / 2 - 8);

    // Core body — deep magenta-red
    g.fillStyle(0xff2060, 1.0);
    g.fillCircle(SIZE / 2, SIZE / 2, SIZE / 2 - 14);

    // Inner bright centre
    g.fillStyle(0xff70a0, 0.8);
    g.fillCircle(SIZE / 2 - 4, SIZE / 2 - 4, SIZE / 2 - 22);

    // Specular highlight — top-left white dot
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(SIZE / 2 - 9, SIZE / 2 - 9, 7);

    // Tiny crisp highlight point
    g.fillStyle(0xffffff, 1.0);
    g.fillCircle(SIZE / 2 - 10, SIZE / 2 - 10, 3);

    const rt = this.add.renderTexture(0, 0, SIZE, SIZE);
    rt.setVisible(false);
    rt.draw(g, 0, 0);
    rt.saveTexture('tex_ball');
    g.destroy();
    // rt stays alive as a texture source; setVisible(false) keeps it off-screen
  }

  // ---- Create a 80×80 RenderTexture for the star ----
  // Pre-rendered gold star with baked glow so GPU postFX amplifies it.
  _createStarTexture() {
    const SIZE = 80;
    const cx   = SIZE / 2;
    const cy   = SIZE / 2;
    const g    = this.make.graphics({ x: 0, y: 0, add: false });

    // Outer diffuse glow aura
    g.fillStyle(0xffd700, 0.06);
    g.fillCircle(cx, cy, SIZE / 2);
    g.fillStyle(0xffd700, 0.12);
    g.fillCircle(cx, cy, SIZE / 2 - 8);
    g.fillStyle(0xffe040, 0.2);
    g.fillCircle(cx, cy, SIZE / 2 - 16);

    // Draw a 5-point star
    const outerR = SIZE / 2 - 18;
    const innerR = outerR * 0.42;
    const points = 5;
    const step   = Math.PI / points;
    const verts  = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = i * step - Math.PI / 2;
      verts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }

    // Fill star body
    g.fillStyle(0xffd700, 1);
    g.beginPath();
    g.moveTo(verts[0], verts[1]);
    for (let i = 2; i < verts.length; i += 2) g.lineTo(verts[i], verts[i + 1]);
    g.closePath();
    g.fillPath();

    // Bright inner star slightly smaller for depth
    g.fillStyle(0xffe87a, 1);
    const verts2 = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR * 0.75 : innerR * 0.75;
      const a = i * step - Math.PI / 2;
      verts2.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    g.beginPath();
    g.moveTo(verts2[0], verts2[1]);
    for (let i = 2; i < verts2.length; i += 2) g.lineTo(verts2[i], verts2[i + 1]);
    g.closePath();
    g.fillPath();

    // Stroke outline
    g.lineStyle(2, 0xffeea0, 1);
    g.beginPath();
    g.moveTo(verts[0], verts[1]);
    for (let i = 2; i < verts.length; i += 2) g.lineTo(verts[i], verts[i + 1]);
    g.closePath();
    g.strokePath();

    // Tiny centre highlight
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(cx - 3, cy - 3, 4);

    const rt = this.add.renderTexture(0, 0, SIZE, SIZE);
    rt.setVisible(false);
    rt.draw(g, 0, 0);
    rt.saveTexture('tex_star');
    g.destroy();
  }

  // ---- Particle emitter using Phaser 3 ParticleEmitter ----
  _setupParticleEmitter() {
    // Create a soft glowing dot texture for particles
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // Soft outer glow
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(10, 10, 10);
    // Core
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(10, 10, 6);
    // Bright centre
    g.fillStyle(0xffffff, 1.0);
    g.fillCircle(10, 10, 3);
    g.generateTexture('particle_dot', 20, 20);
    g.destroy();

    this._particles = this.add.particles(0, 0, 'particle_dot', {
      speed:     { min: 80, max: 320 },
      angle:     { min: 0, max: 360 },
      scale:     { start: 0.5, end: 0 },
      lifespan:  { min: 500, max: 1100 },
      gravityY:  300,
      tint:      [0xffd700, 0xff6b9d, 0x00f5ff, 0x6c63ff, 0xffffff],
      blendMode: 'ADD',
      emitting:  false,
      frequency: -1,   // manual burst mode
    });
    this._particles.setDepth(5);
  }

  // ---- coordinate conversion: Phaser canvas px → logical ----
  toLogical(phaserX, phaserY) {
    const cam    = this.cameras.main;
    const scaleX = cam.width  / LOGICAL_W;
    const scaleY = cam.height / LOGICAL_H;
    return {
      x: phaserX / scaleX,
      y: phaserY / scaleY,
    };
  }

  // ---- pointer handlers (forward to controller) ----
  _onPointerDown(ptr) {
    if (this._ctrl) this._ctrl.onPointerDown(ptr.x, ptr.y);
  }
  _onPointerMove(ptr) {
    if (this._ctrl) this._ctrl.onPointerMove(ptr.x, ptr.y);
  }
  _onPointerUp(ptr) {
    if (this._ctrl) this._ctrl.onPointerUp();
  }

  // ---- background: dark gradient + grid + decorative ambient orbs ----
  _drawBackground() {
    const g = this.bgGfx;
    g.clear();

    const W = this.scale.width;
    const H = this.scale.height;

    // Dark background fill
    g.fillGradientStyle(0x0d0d1a, 0x0d0d1a, 0x14142a, 0x14142a, 1);
    g.fillRect(0, 0, W, H);

    // Subtle starfield
    g.fillStyle(0xffffff, 0.25);
    const rng = new Phaser.Math.RandomDataGenerator(['drawbounce-bg']);
    for (let i = 0; i < 120; i++) {
      const sx = rng.realInRange(0, W);
      const sy = rng.realInRange(0, H);
      const sr = rng.realInRange(0.5, 1.5);
      g.fillCircle(sx, sy, sr);
    }

    // Decorative ambient orbs — consistent seed, low-alpha glowing circles
    // These give the background depth without any animation cost
    const orbRng = new Phaser.Math.RandomDataGenerator(['drawbounce-orbs']);
    const orbData = [
      { alpha: 0.04, color: 0x6c63ff },
      { alpha: 0.03, color: 0xff6b9d },
      { alpha: 0.03, color: 0x00f5ff },
      { alpha: 0.04, color: 0x6c63ff },
      { alpha: 0.025, color: 0xffd700 },
      { alpha: 0.03, color: 0xff6b9d },
      { alpha: 0.035, color: 0x00f5ff },
      { alpha: 0.03, color: 0x6c63ff },
    ];
    for (const orb of orbData) {
      const ox = orbRng.realInRange(W * 0.05, W * 0.95);
      const oy = orbRng.realInRange(H * 0.05, H * 0.95);
      const or = orbRng.realInRange(60, 140);
      g.fillStyle(orb.color, orb.alpha);
      g.fillCircle(ox, oy, or);
    }

    // Grid lines
    const scaleX = W / LOGICAL_W;
    const scaleY = H / LOGICAL_H;
    const gridSz = 50;
    g.lineStyle(1, 0xffffff, 0.03);
    for (let lx = gridSz; lx < LOGICAL_W; lx += gridSz) {
      g.lineBetween(lx * scaleX, 0, lx * scaleX, H);
    }
    for (let ly = gridSz; ly < LOGICAL_H; ly += gridSz) {
      g.lineBetween(0, ly * scaleY, W, ly * scaleY);
    }
  }

  // ---- Camera effects ----

  screenShake() {
    this.cameras.main.shake(280, 0.012);
  }

  flashWin() {
    this.cameras.main.flash(400, 255, 255, 255, false);
  }

  fadeTransition(callback) {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      callback();
      this.cameras.main.fadeIn(300, 0, 0, 0);
    });
  }

  // ---- Phaser update — called every frame ----
  update(time, deltaMs) {
    if (!this._ctrl) return;
    this._starAngle  += deltaMs * 0.001 * 0.8; // rotation speed
    this._pulseT     += deltaMs * 0.001;
    this._menuPulseT += deltaMs * 0.001;
    this._ctrl.phaserUpdate(deltaMs / 1000);
    this._render(time / 1000);
  }

  // ---- main render ----
  _render(t) {
    const ctrl = this._ctrl;
    if (!ctrl || !ctrl.ball) return;

    const W      = this.scale.width;
    const H      = this.scale.height;
    const scaleX = W / LOGICAL_W;
    const scaleY = H / LOGICAL_H;

    // helper: logical → canvas
    const cx = lx => lx * scaleX;
    const cy = ly => ly * scaleY;
    const cs = lr => lr * Math.min(scaleX, scaleY); // scale radius

    // ---- Menu background subtle pulse ----
    // When on menu screen, modulate the bgGfx overlay circle alpha based on time
    if (ctrl.currentScreen === 'menu') {
      // Pulse a single translucent overlay circle on top of the static bg
      const pAlpha = 0.04 + 0.02 * Math.sin(this._menuPulseT * 0.9);
      this.overlayGfx.clear();
      this.overlayGfx.fillStyle(0x6c63ff, pAlpha);
      this.overlayGfx.fillCircle(W * 0.3, H * 0.25, Math.min(W, H) * 0.45);
      this.overlayGfx.fillStyle(0xff6b9d, pAlpha * 0.7);
      this.overlayGfx.fillCircle(W * 0.72, H * 0.72, Math.min(W, H) * 0.38);
    } else {
      this.overlayGfx.clear();
    }

    // ---- obstacles ----
    this.gfx.clear();
    for (const obs of ctrl.obstacles) {
      if (obs.type === 'rect') {
        const pulse = obs.moving ? 0.7 + 0.3 * Math.sin(this._pulseT * 3) : 1;
        const baseColor  = obs.moving ? 0x6a3a9a : 0x3c3c6e;
        const glowColor  = obs.moving ? 0xb464ff : 0x6060c0;
        const glowAlpha  = obs.moving ? pulse * 0.9 : 0.5;

        // Glow halo (slightly larger rect, low alpha)
        // postFX on gfx handles the actual GPU glow, so keep this subtle
        this.gfx.fillStyle(glowColor, glowAlpha * 0.2);
        this.gfx.fillRect(cx(obs.x) - 3, cy(obs.y) - 3, cx(obs.x + obs.w) - cx(obs.x) + 6, cy(obs.y + obs.h) - cy(obs.y) + 6);

        // Body
        this.gfx.fillStyle(baseColor, 1);
        this.gfx.fillRect(cx(obs.x), cy(obs.y), cx(obs.x + obs.w) - cx(obs.x), cy(obs.y + obs.h) - cy(obs.y));

        // Border
        this.gfx.lineStyle(2, glowColor, glowAlpha);
        this.gfx.strokeRect(cx(obs.x), cy(obs.y), cx(obs.x + obs.w) - cx(obs.x), cy(obs.y + obs.h) - cy(obs.y));

      } else if (obs.type === 'circle') {
        const r = cs(obs.r);
        // Glow halo (reduced since postFX handles the real glow)
        this.gfx.fillStyle(0x6060c8, 0.10);
        this.gfx.fillCircle(cx(obs.cx), cy(obs.cy), r + 6);
        // Body
        this.gfx.fillStyle(0x2e2e5e, 1);
        this.gfx.fillCircle(cx(obs.cx), cy(obs.cy), r);
        // Border
        this.gfx.lineStyle(2, 0x6868c8, 0.7);
        this.gfx.strokeCircle(cx(obs.cx), cy(obs.cy), r);
      }
    }

    // ---- target star — drawn via gfx using the pre-baked tex_star ----
    // We draw the star manually so it rotates; the GPU glow on gfx amplifies it.
    const tgt    = ctrl.target;
    const tPulse = 0.92 + 0.08 * Math.sin(this._pulseT * 3);
    const tr     = cs(tgt.r) * tPulse;
    const tx     = cx(tgt.x);
    const ty     = cy(tgt.y);

    // Soft aura — kept minimal since postFX glow handles blooming
    this.gfx.fillStyle(0xffd700, 0.06);
    this.gfx.fillCircle(tx, ty, tr * 2.0);
    this.gfx.fillStyle(0xffd700, 0.10);
    this.gfx.fillCircle(tx, ty, tr * 1.5);

    // Rotating star polygon drawn directly on gfx (so it gets the purple glow postFX)
    this._drawStar(this.gfx, tx, ty, tr, 5, 0.42, this._starAngle, 0xffd700, 0xffe87a);

    // ---- ghost ball + launch arrow (before launch) ----
    this.ballGfx.clear();
    if (!ctrl.isRunning && !ctrl.won) {
      const lvlBall = ctrl._levelDef.ball;
      const bx = cx(lvlBall.x);
      const by = cy(lvlBall.y);
      const br = cs(BALL_RADIUS);

      // Ghost circle
      this.ballGfx.fillStyle(0xff6b9d, 0.12);
      this.ballGfx.fillCircle(bx, by, br);
      this.ballGfx.lineStyle(2, 0xff6b9d, 0.4);
      this._drawDashedCircle(this.ballGfx, bx, by, br);

      // Arrow indicator — only when ball has initial velocity
      const initSpeed = Math.hypot(lvlBall.vx || 0, lvlBall.vy || 0);
      if (initSpeed > 0) {
        const nx = (lvlBall.vx || 0) / initSpeed;
        const ny = (lvlBall.vy || 0) / initSpeed;
        const pulse = 0.75 + 0.25 * Math.sin(this._pulseT * 5);
        const arrowLen = cs(52) * pulse;
        const headLen  = cs(14);
        const startX   = bx + nx * (br + cs(4));
        const startY   = by + ny * (br + cs(4));
        const tipX     = startX + nx * arrowLen;
        const tipY     = startY + ny * arrowLen;
        const perpX    = -ny;
        const perpY    =  nx;

        // Shaft
        this.ballGfx.lineStyle(cs(3), 0xffaa00, 0.85 * pulse);
        this.ballGfx.beginPath();
        this.ballGfx.moveTo(startX, startY);
        this.ballGfx.lineTo(tipX - nx * headLen, tipY - ny * headLen);
        this.ballGfx.strokePath();

        // Arrowhead
        this.ballGfx.fillStyle(0xffaa00, 0.9 * pulse);
        this.ballGfx.beginPath();
        this.ballGfx.moveTo(tipX, tipY);
        this.ballGfx.lineTo(tipX - nx * headLen + perpX * headLen * 0.5, tipY - ny * headLen + perpY * headLen * 0.5);
        this.ballGfx.lineTo(tipX - nx * headLen - perpX * headLen * 0.5, tipY - ny * headLen - perpY * headLen * 0.5);
        this.ballGfx.closePath();
        this.ballGfx.fillPath();

        // Secondary tick marks along the shaft to show motion direction
        for (let i = 1; i <= 2; i++) {
          const tTick  = i / 3;
          const mx = startX + nx * arrowLen * tTick;
          const my = startY + ny * arrowLen * tTick;
          const tickAlpha = (0.3 + 0.2 * tTick) * pulse;
          this.ballGfx.lineStyle(cs(2), 0xffcc44, tickAlpha);
          this.ballGfx.beginPath();
          this.ballGfx.moveTo(mx + perpX * cs(5), my + perpY * cs(5));
          this.ballGfx.lineTo(mx - perpX * cs(5), my - perpY * cs(5));
          this.ballGfx.strokePath();
        }
      }
    }

    // ---- drawn line ----
    // postFX addGlow on lineGfx handles the actual neon bloom;
    // just draw one clean bright line — no manual multi-pass glow needed.
    this.lineGfx.clear();
    const pts = ctrl.drawnPoints;
    if (pts.length >= 2) {
      // Single clean bright line — GPU postFX provides the glow halo
      this.lineGfx.lineStyle(
        LINE_WIDTH * scaleX,
        ctrl.isDrawing ? 0xc8ffff : 0xe0ffff,
        ctrl.isDrawing ? 0.80 : 1.0
      );
      this.lineGfx.beginPath();
      this.lineGfx.moveTo(cx(pts[0].x), cy(pts[0].y));
      for (let i = 1; i < pts.length; i++) {
        this.lineGfx.lineTo(cx(pts[i].x), cy(pts[i].y));
      }
      this.lineGfx.strokePath();
    }

    // ---- trail ----
    this.trailGfx.clear();
    const trail = ctrl.trail;
    for (let i = 1; i < trail.length; i++) {
      const alpha = (i / trail.length) * 0.50;
      const r     = cs(BALL_RADIUS * (i / trail.length) * 0.60);
      this.trailGfx.fillStyle(0xff6b9d, alpha);
      this.trailGfx.fillCircle(cx(trail[i].x), cy(trail[i].y), r);
    }

    // ---- ball — use pre-baked Image instead of per-frame Graphics ----
    if (ctrl.ball) {
      const bx = cx(ctrl.ball.x);
      const by = cy(ctrl.ball.y);
      const br = cs(BALL_RADIUS);

      // Scale the 64×64 texture to match the desired display radius
      const desiredDiameter = br * 2.6; // slightly larger than logical radius for the glow rim
      const texScale = desiredDiameter / 64;

      this._ballImage.setPosition(bx, by);
      this._ballImage.setScale(texScale);
      this._ballImage.setVisible(true);

      // ---- Stuck visual warning — flash ball red when approaching stuck threshold ----
      if (ctrl.isRunning && ctrl.stuckTimer > 2) {
        const flash = Math.sin(this._pulseT * 20) > 0 ? 0xff3333 : 0xff6b9d;
        this._ballImage.setTint(flash);
      } else {
        this._ballImage.clearTint();
      }
    } else {
      this._ballImage.setVisible(false);
    }
  }

  // ---- draw a star polygon ----
  _drawStar(gfx, x, y, outerR, points, innerRatio, angle, fillColor, strokeColor) {
    const step = Math.PI / points;
    const verts = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : outerR * innerRatio;
      const a = i * step - Math.PI / 2 + angle;
      verts.push(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }

    gfx.fillStyle(fillColor, 1);
    gfx.beginPath();
    gfx.moveTo(verts[0], verts[1]);
    for (let i = 2; i < verts.length; i += 2) {
      gfx.lineTo(verts[i], verts[i + 1]);
    }
    gfx.closePath();
    gfx.fillPath();

    gfx.lineStyle(2, strokeColor, 1);
    gfx.beginPath();
    gfx.moveTo(verts[0], verts[1]);
    for (let i = 2; i < verts.length; i += 2) {
      gfx.lineTo(verts[i], verts[i + 1]);
    }
    gfx.closePath();
    gfx.strokePath();
  }

  // ---- dashed circle helper ----
  _drawDashedCircle(gfx, x, y, r) {
    const SEGS   = 16;
    const step   = (Math.PI * 2) / SEGS;
    for (let i = 0; i < SEGS; i += 2) {
      const a0 = i * step;
      const a1 = (i + 1) * step;
      gfx.beginPath();
      gfx.arc(x, y, r, a0, a1, false, 0.05);
      gfx.strokePath();
    }
  }

  // ---- burst particles at logical coords ----
  emitBurst(lx, ly, count) {
    const W = this.scale.width;
    const H = this.scale.height;
    const px = lx * (W / LOGICAL_W);
    const py = ly * (H / LOGICAL_H);
    this._particles.setPosition(px, py);
    this._particles.explode(count);

    // Second burst 150ms later — same position, denser short-lived sparks
    this.time.delayedCall(150, () => {
      this._particles.setPosition(px, py);
      this._particles.explode(Math.floor(count * 0.6));
    });
  }

  // ---- bind controller reference ----
  setController(ctrl) {
    this._ctrl = ctrl;
  }
}

// =====================================================
//  Game Controller — orchestrates all game logic
// =====================================================
class Game {
  constructor() {
    this.state      = loadState();
    this.currentIdx = this.state.currentLevel || 0;

    // Game state
    this.ball         = null;
    this.obstacles    = [];
    this.drawnPoints  = [];
    this.trail        = [];
    this.isDrawing    = false;
    this.isRunning    = false;
    this.won          = false;
    this.stuckTimer   = 0;
    this.levelTime    = 0;
    this._levelDef    = null;
    this.target       = null;

    this.currentScreen = 'menu';
    this._pausedFromRunning = false;

    // Phaser game instance — sized to match #phaser-container
    this._phaser = null;
    this._scene  = null;

    this._initPhaser();
    this._bindUI();
    this._buildLevelGrid();
    this._showScreen('menu');
  }

  // ---- boot Phaser ----
  _initPhaser() {
    const container = document.getElementById('phaser-container');

    this._phaser = new Phaser.Game({
      type:            Phaser.AUTO,
      parent:          'phaser-container',
      backgroundColor: '#0d0d1a',
      scale: {
        mode:       Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width:      '100%',
        height:     '100%',
      },
      scene:  GameScene,
      banner: false,
      audio:  { noAudio: true },
    });

    // Grab the scene once Phaser is ready
    this._phaser.events.once('ready', () => {
      this._scene = this._phaser.scene.getScene('GameScene');
      this._scene.setController(this);
    });
  }

  // ---- screen management ----
  _showScreen(name) {
    this.currentScreen = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${name}`)?.classList.add('active');

    if (name === 'game') {
      // Let Phaser re-measure its container after CSS transition
      setTimeout(() => {
        this._phaser?.scale.refresh();
        if (this._scene) this._scene._drawBackground();
      }, 50);
    }
  }

  _showOverlay(name) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
    const el = document.getElementById(`overlay-${name}`);
    if (el) el.classList.remove('hidden');
  }

  _hideOverlays() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
  }

  // ---- level grid ----
  _buildLevelGrid() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';
    LEVELS.forEach((lvl, idx) => {
      const cell = document.createElement('div');
      cell.className = 'level-cell';
      const completed = this.state.completed.includes(idx);
      if (completed) cell.classList.add('completed');
      if (idx === this.currentIdx) cell.classList.add('current');
      cell.innerHTML = `
        <span class="level-num">${lvl.id}</span>
        <span class="level-star">${completed ? '★' : ''}</span>
        <span class="level-name-small">${lvl.name}</span>
      `;
      cell.addEventListener('click', () => {
        this.currentIdx = idx;
        this.state.currentLevel = idx;
        saveState(this.state);
        this._showScreen('game');
        this._hideOverlays();
        // Fade transition when loading via level select
        if (this._scene) {
          this._scene.fadeTransition(() => this._loadLevel(idx));
        } else {
          this._loadLevel(idx);
        }
      });
      grid.appendChild(cell);
    });
  }

  // ---- level load / reset ----
  _loadLevel(idx) {
    const lvl = LEVELS[idx];
    this.currentIdx = idx;
    this.state.currentLevel = idx;
    saveState(this.state);

    this.obstacles   = cloneObstacles(lvl.obstacles);
    this.ball        = { x: lvl.ball.x, y: lvl.ball.y, vx: lvl.ball.vx || 0, vy: lvl.ball.vy || 0, r: BALL_RADIUS };
    this.target      = { ...lvl.target };
    this.drawnPoints = [];
    this.trail       = [];
    this.isRunning   = false;
    this.won         = false;
    this.stuckTimer  = 0;
    this.levelTime   = 0;
    this._levelDef   = lvl;

    document.getElementById('hud-level-name').textContent = `${lvl.id} · ${lvl.name}`;
    this._setStatus(lvl.hint || 'Draw a line to launch!');
    this._hideOverlays();
  }

  _resetLevel() { this._loadLevel(this.currentIdx); }

  _nextLevel() {
    const next = this.currentIdx + 1;
    if (next >= LEVELS.length) { this._showOverlay('done'); return; }
    // Fade transition into the next level
    if (this._scene) {
      this._scene.fadeTransition(() => this._loadLevel(next));
    } else {
      this._loadLevel(next);
    }
  }

  _skipLevel() {
    const next = (this.currentIdx + 1) % LEVELS.length;
    this._loadLevel(next);
  }

  _setStatus(text) {
    document.getElementById('status-text').textContent = text;
  }

  // ---- pointer input handlers (called by Phaser scene) ----
  onPointerDown(px, py) {
    if (this.currentScreen !== 'game') return;
    if (!this.isRunning && !this.won) {
      const p = this._scene.toLogical(px, py);
      // Don't start drawing inside a wall
      if (this.obstacles.some(obs => pointInObstacle(p.x, p.y, obs))) return;
      this.isDrawing   = true;
      this.drawnPoints = [];
      this.drawnPoints.push(p);
    }
  }

  onPointerMove(px, py) {
    if (this.currentScreen !== 'game') return;
    if (this.isDrawing && !this.isRunning) {
      const p    = this._scene.toLogical(px, py);
      const last = this.drawnPoints[this.drawnPoints.length - 1];
      const dx   = p.x - last.x;
      const dy   = p.y - last.y;
      if (dx * dx + dy * dy > MIN_POINT_DIST * MIN_POINT_DIST) {
        // Find first wall hit along this mini-segment
        let minT = null;
        for (const obs of this.obstacles) {
          const t = segObstacleT(last.x, last.y, p.x, p.y, obs);
          if (t !== null && (minT === null || t < minT)) minT = t;
        }
        if (minT !== null) {
          // Clip to the wall edge and stop drawing
          this.drawnPoints.push({ x: last.x + (p.x - last.x) * minT, y: last.y + (p.y - last.y) * minT });
          this.isDrawing = false;
        } else {
          this.drawnPoints.push(p);
        }
      }
    }
  }

  onPointerUp() {
    if (this.currentScreen !== 'game') return;
    if (this.isDrawing && !this.isRunning && !this.won && this.drawnPoints.length >= 2) {
      incrementAttempts(this.state, this.currentIdx);
      this.isRunning = true;
      this._setStatus('');
    }
    this.isDrawing = false;
  }

  // ---- UI bindings ----
  _bindUI() {
    // Menu
    document.getElementById('btn-play').addEventListener('click', () => {
      this._loadLevel(this.currentIdx);
      this._showScreen('game');
    });
    document.getElementById('btn-levels').addEventListener('click', () => {
      this._buildLevelGrid();
      this._showScreen('levels');
    });

    // Level select
    document.getElementById('btn-back-levels').addEventListener('click', () => this._showScreen('menu'));
    document.getElementById('btn-reset-progress').addEventListener('click', () => {
      if (confirm('Reset all progress?')) {
        this.state = resetProgress();
        this.currentIdx = 0;
        this._buildLevelGrid();
      }
    });

    // Game HUD
    document.getElementById('btn-hud-menu').addEventListener('click', () => {
      this._pausedFromRunning = this.isRunning;
      if (this.isRunning) this.isRunning = false;
      this._showOverlay('pause');
    });
    document.getElementById('btn-skip').addEventListener('click', () => this._skipLevel());

    // HUD right
    document.getElementById('btn-reset').addEventListener('click', () => {
      this._resetLevel();
    });

    // Pause overlay
    document.getElementById('btn-resume').addEventListener('click', () => {
      this._hideOverlays();
      if (this._pausedFromRunning) this.isRunning = true;
    });
    document.getElementById('btn-restart').addEventListener('click', () => {
      this._hideOverlays();
      this._resetLevel();
    });
    document.getElementById('btn-pause-levels').addEventListener('click', () => {
      this._buildLevelGrid();
      this._showScreen('levels');
      this._hideOverlays();
    });
    document.getElementById('btn-pause-menu').addEventListener('click', () => {
      this._showScreen('menu');
      this._hideOverlays();
    });

    // Win overlay
    document.getElementById('btn-next-level').addEventListener('click', () => {
      this._hideOverlays();
      this._nextLevel();
    });
    document.getElementById('btn-win-replay').addEventListener('click', () => {
      this._hideOverlays();
      this._resetLevel();
    });
    document.getElementById('btn-win-levels').addEventListener('click', () => {
      this._buildLevelGrid();
      this._showScreen('levels');
      this._hideOverlays();
    });

    // Done overlay
    document.getElementById('btn-done-levels').addEventListener('click', () => {
      this._buildLevelGrid();
      this._showScreen('levels');
      this._hideOverlays();
    });
    document.getElementById('btn-done-menu').addEventListener('click', () => {
      this._showScreen('menu');
      this._hideOverlays();
    });
  }

  // ---- phaserUpdate — called every Phaser frame via scene.update ----
  phaserUpdate(rawDt) {
    if (this.currentScreen !== 'game') return;

    // 2× simulation speed multiplier
    const dt = Math.min(rawDt, 0.05) * 2;

    this._update(dt);
  }

  _update(dt) {
    if (!this.ball) return;

    if (this.isRunning && !this.won) {
      this.levelTime += dt;

      updateMovingObstacles(this.obstacles, dt);
      stepPhysics(this.ball, this.drawnPoints, this.obstacles, dt);

      // Trail
      this.trail.push({ x: this.ball.x, y: this.ball.y });
      if (this.trail.length > TRAIL_LENGTH) this.trail.shift();

      // Win check
      if (isAtTarget(this.ball, this.target)) {
        this._onWin();
        return;
      }

      // Stuck timer
      const speed = Math.hypot(this.ball.vx, this.ball.vy);
      if (speed < 25) this.stuckTimer += dt;
      else this.stuckTimer = 0;

      if (isBallOOB(this.ball)) {
        this._onFail('Ball fell off screen. Try again!');
        return;
      }
      if (isBallStuck(this.ball, this.stuckTimer)) {
        this._onFail('Ball got stuck. Try again!');
        return;
      }
    }
  }

  _onWin() {
    this.won       = true;
    this.isRunning = false;
    markLevelComplete(this.state, this.currentIdx);

    // White flash + particle burst
    if (this._scene) {
      this._scene.flashWin();
      this._scene.emitBurst(this.target.x, this.target.y, 80);
    }

    // Clear status text on win
    this._setStatus('');

    const lvl      = LEVELS[this.currentIdx];
    document.getElementById('win-level-name').textContent = `${lvl.id} · ${lvl.name}`;

    const attempts = this.state.attempts[this.currentIdx] || 1;
    const stars    = attempts === 1 ? '★★★' : attempts <= 3 ? '★★' : '★';
    document.getElementById('win-stars').textContent = stars;

    const isLast = this.currentIdx >= LEVELS.length - 1;
    document.getElementById('btn-next-level').style.display = isLast ? 'none' : '';

    setTimeout(() => {
      this._showOverlay('win');
      this._buildLevelGrid();
    }, 800);
  }

  _onFail(msg) {
    this.isRunning   = false;
    this.trail       = [];
    this.drawnPoints = [];
    const lvl        = this._levelDef;
    this.ball        = { x: lvl.ball.x, y: lvl.ball.y, vx: lvl.ball.vx || 0, vy: lvl.ball.vy || 0, r: BALL_RADIUS };
    this.obstacles   = cloneObstacles(lvl.obstacles);
    this.stuckTimer  = 0;

    // Screen shake on fail
    if (this._scene) {
      this._scene.screenShake();
    }

    // Flash status text red
    const statusEl = document.getElementById('status-text');
    this._setStatus(lvl.hint || 'Adjust your line and try again.');
    statusEl.classList.add('fail');
    setTimeout(() => statusEl.classList.remove('fail'), 600);
  }
}

// =====================================================
//  Boot
// =====================================================
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();

  // ---- Android back-gesture / back-button intercept ----
  // Push a dummy history entry so the OS back gesture hits it first.
  // Each time the user "goes back", we push another entry and route the
  // action in-app rather than leaving the page.
  history.pushState({ inGame: true }, '');

  window.addEventListener('popstate', () => {
    // Always push a new entry to keep the trap active
    history.pushState({ inGame: true }, '');

    // Route the back action contextually
    const overlays = [...document.querySelectorAll('.overlay')].filter(
      el => !el.classList.contains('hidden')
    );
    if (overlays.length > 0) {
      // Dismiss any open overlay
      game._hideOverlays();
      if (game._pausedFromRunning) game.isRunning = true;
    } else if (game.currentScreen === 'game') {
      // In-game: treat as pause
      game._pausedFromRunning = game.isRunning;
      if (game.isRunning) game.isRunning = false;
      game._showOverlay('pause');
    } else if (game.currentScreen === 'levels') {
      game._showScreen('menu');
    }
    // On menu screen: do nothing (stay in app)
  });
});
