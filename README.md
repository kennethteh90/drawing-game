# Draw & Bounce

A mobile-first physics puzzle game where you guide a ball to a star by drawing lines with your finger (or mouse).

![Draw & Bounce screenshot](screenshot.png)

---

## How to Play

1. **Look** at where the ball starts and where the star is.
2. **Draw a line** anywhere on the canvas — it becomes a physical surface the ball will bounce off.
3. **Release** to launch. The ball obeys gravity and bounces off your line, obstacles, and the walls.
4. **Reach the star** to complete the level. Fewer attempts earns more stars.
5. Hit **Reset** to try a new line, or **Skip** to move on.

---

## Features

- 30 hand-crafted levels across 6 difficulty tiers (Tutorial → Expert)
- Moving obstacles that require timing
- Smooth 2x-speed physics with sub-step accuracy
- Particle burst, screen shake, and camera flash on win/fail
- Level-to-level fade transitions
- Stuck-ball warning with visual tint
- Full PWA support — add to home screen on iOS/Android
- Progress saved to localStorage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Renderer | [Phaser 3](https://phaser.io/) (WebGL / Canvas) |
| Physics | Custom impulse-based engine (`js/physics.js`) |
| Logic | Vanilla ES Modules (`js/game.js`, `js/state.js`) |
| Levels | Data-driven JSON-like definitions (`js/levels.js`) |
| Styles | Plain CSS with CSS custom properties |
| Font | Nunito via Google Fonts |

Physics highlights:
- 4 substeps per frame for stable high-speed collisions
- 2x simulation speed multiplier (effective gravity ~900 px/s²)
- Separate restitution coefficients for walls, obstacles, and drawn lines
- Wall-clip draw logic prevents players from drawing inside obstacles

---

## Local Development

No build step required — it's plain ES modules served over HTTP.

```bash
# Any static file server works. Using the npm `serve` package:
npm install -g serve
serve .

# Or with Python:
python3 -m http.server 8080
```

Then open `http://localhost:3000` (or `8080`) in your browser.

> Note: ES modules require a real HTTP server — opening `index.html` directly as a `file://` URL will not work.

---

## Live Demo

[Play it here »](https://your-demo-url-here.com)

---

## Project Structure

```
drawing-game/
  index.html          Main HTML shell + overlay markup
  manifest.json       PWA manifest
  css/
    style.css         All UI styles
  js/
    game.js           Phaser scene + Game controller
    physics.js        Physics engine (gravity, collision, resolution)
    levels.js         All 30 level definitions
    state.js          localStorage progress tracking
```

---

## License

MIT
