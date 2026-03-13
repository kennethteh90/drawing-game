// ==================== PHYSICS ENGINE ====================
import { LOGICAL_W, LOGICAL_H } from './levels.js';

const GRAVITY      = 450;   // px/s²
const RESTITUTION  = 0.72;  // bounce energy retention
const FRICTION     = 0.997; // velocity multiplier per frame (air resistance)
const WALL_REST    = 0.65;  // canvas edge restitution
const MIN_BOUNCE   = 40;    // min velocity to avoid micro-bounces
const SUBSTEPS     = 4;     // physics substeps per frame

// ---- Helpers ----
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function closestPointOnSegment(ax, ay, bx, by, px, py) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) return { x: ax, y: ay };
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / lenSq, 0, 1);
  return { x: ax + t * dx, y: ay + t * dy };
}

function reflectVelocity(vx, vy, nx, ny, restitution) {
  const dot = vx * nx + vy * ny;
  return {
    vx: vx - (1 + restitution) * dot * nx,
    vy: vy - (1 + restitution) * dot * ny,
  };
}

// ---- Obstacle collision (rect or circle) ----
function resolveObstacle(ball, obs) {
  if (obs.type === 'rect') {
    resolveRect(ball, obs.x, obs.y, obs.w, obs.h);
  } else if (obs.type === 'circle') {
    resolveCircleObs(ball, obs.cx, obs.cy, obs.r);
  }
}

function resolveRect(ball, rx, ry, rw, rh) {
  // Clamp ball center to rect bounds
  const cx = clamp(ball.x, rx, rx + rw);
  const cy = clamp(ball.y, ry, ry + rh);
  const dx = ball.x - cx;
  const dy = ball.y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist >= ball.r || dist < 0.001) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot >= 0) return; // moving away

  const overlap = ball.r - dist;
  ball.x += nx * overlap;
  ball.y += ny * overlap;

  const ref = reflectVelocity(ball.vx, ball.vy, nx, ny, RESTITUTION);
  ball.vx = ref.vx;
  ball.vy = ref.vy;
}

function resolveCircleObs(ball, cx, cy, cr) {
  const dx = ball.x - cx;
  const dy = ball.y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = ball.r + cr;
  if (dist >= minDist || dist < 0.001) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot >= 0) return;

  const overlap = minDist - dist;
  ball.x += nx * overlap;
  ball.y += ny * overlap;

  const ref = reflectVelocity(ball.vx, ball.vy, nx, ny, RESTITUTION);
  ball.vx = ref.vx;
  ball.vy = ref.vy;
}

// ---- Drawn line collision ----
function resolveLineSegment(ball, ax, ay, bx, by) {
  const cp = closestPointOnSegment(ax, ay, bx, by, ball.x, ball.y);
  const dx = ball.x - cp.x;
  const dy = ball.y - cp.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist >= ball.r || dist < 0.001) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot >= 0) return; // moving away already

  const overlap = ball.r - dist;
  ball.x += nx * overlap;
  ball.y += ny * overlap;

  // Slightly boost energy on drawn-line bounces for satisfying feel
  const ref = reflectVelocity(ball.vx, ball.vy, nx, ny, RESTITUTION + 0.08);
  ball.vx = ref.vx;
  ball.vy = ref.vy;
}

// ---- Canvas wall collision ----
function resolveWalls(ball) {
  if (ball.x - ball.r < 0) {
    ball.x = ball.r;
    if (ball.vx < 0) ball.vx = Math.abs(ball.vx) * WALL_REST;
  }
  if (ball.x + ball.r > LOGICAL_W) {
    ball.x = LOGICAL_W - ball.r;
    if (ball.vx > 0) ball.vx = -Math.abs(ball.vx) * WALL_REST;
  }
  if (ball.y - ball.r < 0) {
    ball.y = ball.r;
    if (ball.vy < 0) ball.vy = Math.abs(ball.vy) * WALL_REST;
  }
  // Bottom wall — don't auto-resolve (detect fall-off instead)
}

// ---- Moving obstacle update ----
export function updateMovingObstacles(obstacles, dt) {
  for (const obs of obstacles) {
    if (!obs.moving) continue;
    const m = obs.moving;
    if (!m._dir) m._dir = 1;
    const axis = m.axis;
    if (axis === 'x') {
      obs.x += m.speed * m._dir * dt;
      if (obs.x <= m.min) { obs.x = m.min; m._dir = 1; }
      if (obs.x + (obs.w || 0) >= m.max) { obs.x = m.max - (obs.w || 0); m._dir = -1; }
    } else {
      obs.y += m.speed * m._dir * dt;
      if (obs.y <= m.min) { obs.y = m.min; m._dir = 1; }
      if (obs.y + (obs.h || 0) >= m.max) { obs.y = m.max - (obs.h || 0); m._dir = -1; }
    }
  }
}

// ---- Main physics step ----
export function stepPhysics(ball, drawnPoints, obstacles, dt, gravityMult = 1) {
  const subDt = Math.min(dt, 0.033) / SUBSTEPS;

  for (let s = 0; s < SUBSTEPS; s++) {
    // Integrate
    ball.vy += GRAVITY * gravityMult * subDt;
    ball.x  += ball.vx * subDt;
    ball.y  += ball.vy * subDt;

    // Air resistance
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;

    // Canvas walls
    resolveWalls(ball);

    // Obstacle collisions
    for (const obs of obstacles) {
      resolveObstacle(ball, obs);
    }

    // Drawn line segment collisions
    if (drawnPoints.length >= 2) {
      for (let i = 0; i < drawnPoints.length - 1; i++) {
        resolveLineSegment(
          ball,
          drawnPoints[i].x,   drawnPoints[i].y,
          drawnPoints[i+1].x, drawnPoints[i+1].y
        );
      }
    }
  }

  // Dampen very slow horizontal movement on near-horizontal surfaces
  if (Math.abs(ball.vx) < MIN_BOUNCE * 0.3) ball.vx *= 0.9;
}

// ---- Stable (stuck) detection ----
export function isBallStuck(ball, stuckTimer) {
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  return speed < 25 && stuckTimer > 3.5;
}

// ---- Fall-off detection ----
export function isBallOOB(ball) {
  return ball.y - ball.r > LOGICAL_H + 80;
}

// ---- Win detection ----
export function isAtTarget(ball, target) {
  const dx = ball.x - target.x;
  const dy = ball.y - target.y;
  return Math.sqrt(dx * dx + dy * dy) < target.r + ball.r * 0.7;
}
