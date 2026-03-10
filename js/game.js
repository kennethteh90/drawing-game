// ==================== MAIN GAME ====================
import { LEVELS, LOGICAL_W, LOGICAL_H } from './levels.js';
import { loadState, saveState, markLevelComplete, incrementAttempts, resetProgress } from './state.js';
import { stepPhysics, updateMovingObstacles, isBallStuck, isBallOOB, isAtTarget } from './physics.js';

const BALL_RADIUS   = 12;
const TRAIL_LENGTH  = 28;
const LINE_WIDTH    = 8;        // drawn line logical width
const MIN_POINT_DIST = 5;       // min px between drawn points

// =====================================================
//  Utility: deep clone a level's mutable parts
// =====================================================
function cloneObstacles(obstacles) {
  return obstacles.map(o => {
    const c = Object.assign({}, o);
    if (c.moving) c.moving = Object.assign({}, c.moving);
    return c;
  });
}

// =====================================================
//  Canvas scaling helpers
// =====================================================
class ScaleHelper {
  constructor(canvas) { this.canvas = canvas; }

  get scaleX() { return this.canvas.clientWidth  / LOGICAL_W; }
  get scaleY() { return this.canvas.clientHeight / LOGICAL_H; }

  toLogical(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / this.scaleX,
      y: (clientY - rect.top)  / this.scaleY,
    };
  }
}

// =====================================================
//  Renderer
// =====================================================
class Renderer {
  constructor(canvas, ctx, scaler) {
    this.canvas = canvas;
    this.ctx    = ctx;
    this.scaler = scaler;
    this._starPath = this._buildStar(5, 1, 0.42);
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w   = this.canvas.clientWidth;
    const h   = this.canvas.clientHeight;
    this.canvas.width  = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr * this.scaler.scaleX, dpr * this.scaler.scaleY);
  }

  clear() {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    grad.addColorStop(0, '#0d0d1a');
    grad.addColorStop(1, '#14142a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth   = 1;
    const gridSize  = 50;
    for (let x = gridSize; x < LOGICAL_W; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, LOGICAL_H); ctx.stroke();
    }
    for (let y = gridSize; y < LOGICAL_H; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(LOGICAL_W, y); ctx.stroke();
    }
  }

  drawObstacles(obstacles, t) {
    const ctx = this.ctx;
    for (const obs of obstacles) {
      ctx.save();
      if (obs.type === 'rect') {
        const pulse = obs.moving ? 0.7 + 0.3 * Math.sin(t * 3) : 1;
        ctx.fillStyle   = obs.color || '#4a4a7a';
        ctx.strokeStyle = obs.moving
          ? `rgba(180,100,255,${pulse})`
          : 'rgba(120,120,180,0.6)';
        ctx.lineWidth  = 2;
        ctx.shadowColor  = obs.moving ? 'rgba(180,100,255,0.5)' : 'rgba(100,100,200,0.3)';
        ctx.shadowBlur   = obs.moving ? 12 : 6;
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 4);
        ctx.fill();
        ctx.stroke();
      } else if (obs.type === 'circle') {
        ctx.fillStyle   = obs.color || '#3a3a6a';
        ctx.strokeStyle = 'rgba(120,120,200,0.6)';
        ctx.lineWidth   = 2;
        ctx.shadowColor = 'rgba(100,100,255,0.4)';
        ctx.shadowBlur  = 10;
        ctx.beginPath();
        ctx.arc(obs.cx, obs.cy, obs.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawTarget(target, t) {
    const ctx  = this.ctx;
    const pulse = 0.92 + 0.08 * Math.sin(t * 3);
    ctx.save();
    ctx.translate(target.x, target.y);
    ctx.scale(pulse, pulse);

    // Glow rings
    const glowGrad = ctx.createRadialGradient(0, 0, target.r * 0.3, 0, 0, target.r * 1.8);
    glowGrad.addColorStop(0, 'rgba(255,215,0,0.3)');
    glowGrad.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, target.r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Star
    ctx.rotate(t * 0.8);
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur  = 18;
    ctx.fillStyle   = '#ffd700';
    ctx.strokeStyle = '#ffe87a';
    ctx.lineWidth   = 2;
    this._drawStar(ctx, target.r);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  _buildStar(points, outer, innerRatio) {
    const path = [];
    const step  = Math.PI / points;
    for (let i = 0; i < points * 2; i++) {
      const r    = i % 2 === 0 ? outer : outer * innerRatio;
      const angle = i * step - Math.PI / 2;
      path.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return path;
  }

  _drawStar(ctx, radius) {
    const pts   = this._starPath;
    ctx.beginPath();
    ctx.moveTo(pts[0].x * radius, pts[0].y * radius);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * radius, pts[i].y * radius);
    }
    ctx.closePath();
  }

  drawBallStart(levelBall) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle   = 'rgba(255,107,157,0.18)';
    ctx.strokeStyle = 'rgba(255,107,157,0.5)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(levelBall.x, levelBall.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawTrail(trail) {
    if (trail.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    for (let i = 1; i < trail.length; i++) {
      const alpha = (i / trail.length) * 0.6;
      const r     = BALL_RADIUS * (i / trail.length) * 0.7;
      ctx.fillStyle = `rgba(255,107,157,${alpha})`;
      ctx.beginPath();
      ctx.arc(trail[i].x, trail[i].y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawBall(ball, t) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = '#ff6b9d';
    ctx.shadowBlur  = 16;

    const grad = ctx.createRadialGradient(
      ball.x - BALL_RADIUS * 0.3, ball.y - BALL_RADIUS * 0.3, BALL_RADIUS * 0.1,
      ball.x, ball.y, BALL_RADIUS
    );
    grad.addColorStop(0, '#ffb3cc');
    grad.addColorStop(1, '#ff3070');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawLine(points, isDrawing) {
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.save();

    // Glow pass
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur  = 12;
    ctx.strokeStyle = isDrawing ? 'rgba(0,245,255,0.5)' : '#00f5ff';
    ctx.lineWidth   = LINE_WIDTH * 1.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Core line
    ctx.shadowBlur  = 0;
    ctx.strokeStyle = isDrawing ? 'rgba(200,255,255,0.8)' : '#e0ffff';
    ctx.lineWidth   = LINE_WIDTH;
    ctx.stroke();

    ctx.restore();
  }

  drawParticles(particles) {
    const ctx = this.ctx;
    ctx.save();
    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawHintText(text, t) {
    if (!text) return;
    const ctx = this.ctx;
    const alpha = Math.min(1, t < 1 ? t : Math.max(0, 4 - t));
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = 'rgba(255,255,255,0.9)';
    ctx.font        = `bold 15px 'Segoe UI', system-ui, sans-serif`;
    ctx.textAlign   = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur  = 8;
    ctx.fillText(text, LOGICAL_W / 2, LOGICAL_H - 18);
    ctx.restore();
  }
}

// =====================================================
//  Particle System
// =====================================================
class Particles {
  constructor() { this.list = []; }

  emit(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 250;
      const colors = ['#ffd700', '#ff6b9d', '#00f5ff', '#6c63ff', '#ffffff'];
      this.list.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r:  2 + Math.random() * 4,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 0.6 + Math.random() * 0.6,
      });
    }
  }

  update(dt) {
    this.list = this.list.filter(p => p.life < p.maxLife);
    for (const p of this.list) {
      p.life += dt;
      p.x    += p.vx * dt;
      p.y    += p.vy * dt;
      p.vy   += 300 * dt; // gravity
      p.alpha = 1 - p.life / p.maxLife;
    }
  }
}

// =====================================================
//  Game Class
// =====================================================
class Game {
  constructor() {
    this.canvas   = document.getElementById('game-canvas');
    this.ctx      = this.canvas.getContext('2d');
    this.scaler   = new ScaleHelper(this.canvas);
    this.renderer = new Renderer(this.canvas, this.ctx, this.scaler);
    this.particles = new Particles();

    this.state        = loadState();
    this.currentIdx   = this.state.currentLevel || 0;

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

    this.lastTime     = null;
    this.animFrame    = null;
    this.currentScreen = 'menu';

    this._bindUI();
    this._bindInput();
    this._onResize();
    window.addEventListener('resize', () => this._onResize());

    this._showScreen('menu');
    this._buildLevelGrid();
    this._loop(0);
  }

  // ==================== SCREENS ====================
  _showScreen(name) {
    this.currentScreen = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${name}`)?.classList.add('active');
  }

  _showOverlay(name) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
    const el = document.getElementById(`overlay-${name}`);
    if (el) el.classList.remove('hidden');
  }

  _hideOverlays() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
  }

  // ==================== LEVEL GRID ====================
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
        this._loadLevel(idx);
        this._showScreen('game');
        this._hideOverlays();
      });
      grid.appendChild(cell);
    });
  }

  // ==================== LEVEL LOADING ====================
  _loadLevel(idx) {
    const lvl    = LEVELS[idx];
    this.currentIdx = idx;
    this.state.currentLevel = idx;
    saveState(this.state);

    this.obstacles = cloneObstacles(lvl.obstacles);
    this.ball = {
      x:  lvl.ball.x, y:  lvl.ball.y,
      vx: lvl.ball.vx || 0, vy: lvl.ball.vy || 0,
      r:  BALL_RADIUS,
    };
    this.target      = { ...lvl.target };
    this.drawnPoints = [];
    this.trail       = [];
    this.isRunning   = false;
    this.won         = false;
    this.stuckTimer  = 0;
    this.levelTime   = 0;
    this._levelDef   = lvl;

    document.getElementById('hud-level-name').textContent = `${lvl.id} · ${lvl.name}`;
    this._setStatus('Draw a line, then Launch!');
    this._hideOverlays();
  }

  _resetLevel() {
    this._loadLevel(this.currentIdx);
  }

  _nextLevel() {
    const next = this.currentIdx + 1;
    if (next >= LEVELS.length) {
      this._showOverlay('done');
      return;
    }
    this._loadLevel(next);
  }

  _skipLevel() {
    const next = (this.currentIdx + 1) % LEVELS.length;
    this._loadLevel(next);
  }

  _setStatus(text) {
    document.getElementById('status-text').textContent = text;
  }

  // ==================== INPUT ====================
  _bindInput() {
    const canvas = this.canvas;

    const onStart = (x, y) => {
      if (!this.isRunning && !this.won) {
        this.isDrawing   = true;
        this.drawnPoints = [];
        const p = this.scaler.toLogical(x, y);
        this.drawnPoints.push(p);
      }
    };
    const onMove = (x, y) => {
      if (this.isDrawing && !this.isRunning) {
        const p    = this.scaler.toLogical(x, y);
        const last = this.drawnPoints[this.drawnPoints.length - 1];
        const dx   = p.x - last.x, dy = p.y - last.y;
        if (dx * dx + dy * dy > MIN_POINT_DIST * MIN_POINT_DIST) {
          this.drawnPoints.push(p);
        }
      }
    };
    const onEnd = () => { this.isDrawing = false; };

    canvas.addEventListener('mousedown',  e => { e.preventDefault(); onStart(e.clientX, e.clientY); });
    canvas.addEventListener('mousemove',  e => { e.preventDefault(); onMove (e.clientX, e.clientY); });
    canvas.addEventListener('mouseup',    e => { e.preventDefault(); onEnd(); });
    canvas.addEventListener('mouseleave', e => { onEnd(); });

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    }, { passive: false });
    canvas.addEventListener('touchend', e => { e.preventDefault(); onEnd(); }, { passive: false });
  }

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
      if (this.isRunning) this._pausePhysics();
      this._showOverlay('pause');
    });
    document.getElementById('btn-skip').addEventListener('click', () => this._skipLevel());

    // Game footer
    document.getElementById('btn-clear').addEventListener('click', () => {
      if (!this.isRunning) {
        this.drawnPoints = [];
        this._setStatus('Line cleared. Draw again!');
      }
    });
    document.getElementById('btn-launch').addEventListener('click', () => {
      if (!this.won && !this.isRunning) {
        incrementAttempts(this.state, this.currentIdx);
        this.isRunning = true;
        this._setStatus('');
      }
    });

    // Pause overlay
    document.getElementById('btn-resume').addEventListener('click', () => {
      this._hideOverlays();
      this.isRunning = true;
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

  _pausePhysics() { this.isRunning = false; }

  // ==================== RESIZE ====================
  _onResize() {
    if (this.currentScreen === 'game') {
      this.renderer.resize();
    }
  }

  // ==================== GAME LOOP ====================
  _loop(ts) {
    this.animFrame = requestAnimationFrame(ts2 => this._loop(ts2));

    if (this.currentScreen !== 'game') {
      this.lastTime = null;
      return;
    }

    if (this.lastTime === null) {
      this.renderer.resize();
      this.lastTime = ts;
    }
    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;

    this._update(dt);
    this._render(ts / 1000);
  }

  _update(dt) {
    if (!this.ball) return;

    if (this.isRunning && !this.won) {
      this.levelTime += dt;

      // Update moving obstacles
      updateMovingObstacles(this.obstacles, dt);

      // Physics
      stepPhysics(this.ball, this.drawnPoints, this.obstacles, dt);

      // Trail
      this.trail.push({ x: this.ball.x, y: this.ball.y });
      if (this.trail.length > TRAIL_LENGTH) this.trail.shift();

      // Particles
      this.particles.update(dt);

      // Win check
      if (isAtTarget(this.ball, this.target)) {
        this._onWin();
        return;
      }

      // Stuck check
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
    } else if (!this.isRunning) {
      this.particles.update(dt);
    }
  }

  _onWin() {
    this.won       = true;
    this.isRunning = false;
    markLevelComplete(this.state, this.currentIdx);
    this.particles.emit(this.target.x, this.target.y, 40);

    const lvl = LEVELS[this.currentIdx];
    document.getElementById('win-level-name').textContent = `${lvl.id} · ${lvl.name}`;

    const attempts = this.state.attempts[this.currentIdx] || 1;
    const stars    = attempts === 1 ? '★★★' : attempts <= 3 ? '★★' : '★';
    document.getElementById('win-stars').textContent = stars;

    const isLast = this.currentIdx >= LEVELS.length - 1;
    document.getElementById('btn-next-level').style.display = isLast ? 'none' : '';

    setTimeout(() => { this._showOverlay('win'); this._buildLevelGrid(); }, 800);
  }

  _onFail(msg) {
    this.isRunning  = false;
    this.trail      = [];
    const lvl       = this._levelDef;
    // Restore ball to start without clearing the drawn line
    this.ball       = {
      x:  lvl.ball.x, y:  lvl.ball.y,
      vx: lvl.ball.vx || 0, vy: lvl.ball.vy || 0,
      r:  BALL_RADIUS,
    };
    this.obstacles  = cloneObstacles(lvl.obstacles);
    this.stuckTimer = 0;
    this._setStatus(msg + ' Adjust your line and try again.');
  }

  // ==================== RENDER ====================
  _render(t) {
    const r = this.renderer;
    r.clear();

    if (!this.ball) return;

    r.drawObstacles(this.obstacles, t);
    r.drawTarget(this.target, t);

    // Show ghost ball position before launch
    if (!this.isRunning && !this.won) {
      r.drawBallStart(this._levelDef.ball);
    }

    r.drawLine(this.drawnPoints, this.isDrawing);
    r.drawTrail(this.trail);
    r.drawBall(this.ball, t);
    r.drawParticles(this.particles.list);
    r.drawHintText(this._levelDef?.hint, this.levelTime + 0.01);
  }
}

// =====================================================
//  Boot
// =====================================================
window.addEventListener('DOMContentLoaded', () => { new Game(); });
