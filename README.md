# NEON RUSH

A fast, original top-down **neon arcade game** for the browser. Pilot an energy
drone through six handcrafted sectors: collect energy shards, chain combos, shave
past hazards for near-miss bonuses, flip switches, punch through dash gates, and
reach the exit before the clock beats you.

Built with **Vite + vanilla JavaScript + HTML5 Canvas**. No engine, no framework,
no backend, no remote assets — every visual is drawn with the Canvas 2D API and
every sound is synthesized live with the Web Audio API. Once dependencies are
installed it runs fully offline.

---

## Table of contents

- [Features](#features)
- [Controls](#controls)
- [How to play](#how-to-play)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Save data](#save-data)
- [Building for production](#building-for-production)
- [Deploying to GitHub Pages](#deploying-to-github-pages)
- [Repository checklist](#repository-checklist)
- [Credits](#credits)

---

## Features

- **Signature energy dash** — a short, snappy burst with a clear cooldown you can
  read on the HUD. While dashing the drone is briefly invulnerable, letting you
  cross hazard fields and pass through violet dash gates.
- **Six distinct handcrafted levels** with their own layout and gimmick:
  1. **First Pulse** — movement, pickups, and the exit.
  2. **Crossfire** — predictable moving hazards on timed lanes.
  3. **Narrow Signal** — tight corridors and static danger fields.
  4. **Dash Circuit** — gated vaults and dash-timing challenges.
  5. **Overload** — rotating hazards plus a **timed switch** race.
  6. **Final Surge** — everything at once, demanding but fair.
- **Combo & multiplier scoring** up to **×4**, with a decaying combo window and
  clear on-screen feedback for every point event.
- **Near-miss rewards** — graze a moving orb for bonus points; do it mid-dash for
  double.
- **Progression & upgrades** — earn credits per sector and spend them on dash
  cooldown, combo window, a shield charge, and cosmetic drone tints.
- **Persistent saves** — unlocked levels, credits, upgrades, best scores, and
  settings survive reloads via `localStorage`.
- **Full menu set** — title, level select, how-to-play, settings, between-level
  upgrades, pause, level-complete, failure, and final-completion screens. Every
  control is functional; there are no decorative or fake settings.
- **Settings that actually apply** — master volume, SFX volume, screen-shake
  toggle, reduced-effects toggle, and fullscreen.
- **Tuned game feel** — normalized diagonal movement, reliable collision, fading
  dash trails, hit feedback, screen shake, and immediate restart.
- **Crisp retro-neon look** — deep navy backgrounds with cyan / electric-blue /
  violet / restrained-magenta accents, geometric silhouettes, and controlled glow.
- **Lightweight & offline** — one production JS bundle (~52 kB), no network calls.

---

## Controls

| Key | Action |
| --- | --- |
| `WASD` / `Arrow keys` | Move (also navigates menus) |
| `Space` | Dash |
| `E` | Interact with a nearby switch |
| `Esc` / `P` | Pause / resume |
| `R` | Restart the current level after failure |
| `Enter` | Confirm menu selection |

Arrow keys and `Space` are captured by the game, so the browser will not scroll
while you play.

---

## How to play

Each sector follows the same loop:

1. Enter the arena and read the objective banner.
2. Collect every **energy shard** (amber diamonds).
3. Dodge **red** (deadly) and **pink** (rotating) hazards, or cross them with a
   well-timed **dash**.
4. Pass **violet dash gates** only by dashing through them.
5. Step on **amber switch** pads and press `E` to activate them (some are **timed**
   and switch back off, and the exit stays sealed until all required switches are
   on at once).
6. Reach the **exit portal** — it opens when the level's conditions are met.
7. Earn a score summary, unlock the next sector, and buy upgrades with credits.

> Scoring is deterministic: each shard, gate, and switch awards points only once,
> and the multiplier rewards fast chains and resets on a timeout or a hit. Failing
> restarts the current level but never wipes permanent progression.

---

## Getting started

You need **Node.js 18+** recommended (any modern LTS works).

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (hot reload)
npm run dev
#    open http://localhost:5188

# 3. Create a production build (outputs to /dist)
npm run build

# 4. Preview the production build locally
npm run preview
```

There is no separate test suite; gameplay was verified manually and via headless
browser checks. See [Building for production](#building-for-production) for the
build contract.

---

## Project structure

```
NEON-RUSH/
├── index.html               # Canvas + UI layer entry point
├── package.json             # Scripts & devDependencies (Vite only)
├── vite.config.js           # base:'./' for portable static hosting
└── src/
    ├── main.js              # Boot, audio-unlock gesture, window.__game debug hook
    ├── style.css            # Retro-neon theme for menus/settings/HUD overlays
    ├── core/
    │   ├── Game.js          # State machine, main loop, level flow, screen shake
    │   ├── GameState.js     # Runtime settings + upgrade-derived tuning values
    │   └── Input.js         # Keyboard model (held + edge-triggered)
    ├── player/Player.js     # Movement, dash, cooldown, shield, invulnerability
    ├── world/
    │   ├── Arena.js         # Level runtime: walls, entities, collisions, exit logic
    │   └── Collision.js     # Primitive geometry helpers
    ├── entities/
    │   ├── Hazard.js        # Static / moving / rotating hazards + near-miss
    │   └── Pickup.js        # Shards, dash gates, switches, exit portal
    ├── systems/
    │   ├── Scoring.js       # Combo, multiplier, bonuses, floating popups
    │   └── Progression.js   # Credits, unlocks, best scores
    ├── rendering/Renderer.js# Canvas painting, particles, glow, wipe transition
    ├── ui/
    │   ├── HUD.js           # In-game overlay (score, shards, dash bar, timers)
    │   └── Menu.js          # DOM screens: title/levelselect/settings/upgrades/...
    ├── audio/Audio.js       # Procedural Web Audio SFX (gesture-gated)
    ├── save/SaveSystem.js   # localStorage load/persist/migrate defaults
    └── data/levels.js       # Six handcrafted level definitions
```

All art and audio are generated in code — there are no binary asset files in the
repository.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Build tool | [Vite](https://vitejs.dev/) 5 |
| Language | Vanilla ES2020 JavaScript (ESM) |
| Rendering | HTML5 Canvas 2D |
| UI screens | DOM overlay styled with CSS |
| Audio | Web Audio API (procedural synthesis) |
| Persistence | `localStorage` |
| Frameworks | None (no React / Phaser / engine) |

The only dependency is Vite (a `devDependency`). The shipped bundle has zero
runtime dependencies.

---

## Save data

Progress is stored in the browser under the key `neon-rush-save-v1`
(`localStorage`). It contains unlocked levels, credits, upgrade ranks, per-level
best scores, and your settings. It never leaves your machine. To start fresh, use
**Settings → Reset All Progress**, or clear the key in DevTools.

> Note for developers: `main.js` exposes the running instance on `window.__game`
> for console debugging and scripted play-testing. It is inert to players and
> harmless to leave in, but you can remove that single line if you prefer a
> production-clean global namespace.

---

## Building for production

```bash
npm run build
```

- Compiles 20 modules to static files under `dist/`.
- Output: `dist/index.html`, `dist/assets/index-*.js`, `dist/assets/index-*.css`.
- The current build is roughly **52 kB JS** (~16 kB gzip) and **6 kB CSS**.
- `dist/` is git-ignored; regenerate it rather than committing it.

Verify locally before deploying:

```bash
npm run preview   # serves the dist build exactly like a static host
```

---

## Deploying to GitHub Pages

`vite.config.js` sets **`base: './'`**, so the built `index.html` references its
assets with **relative URLs**. This means the game works when served from any
repository sub-path — `https://<user>.github.io/<repo>/` — **without knowing or
hard-coding the repository name**, and it keeps `npm run dev` working unchanged.
This is the recommended configuration for a project page.

Pick one of the following.

### Option A — GitHub Actions (recommended)

1. Push the repository to GitHub (see [Repository checklist](#repository-checklist)).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Add `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

4. Push to `main`; the Pages URL appears under **Settings → Pages**.

### Option B — `gh-pages` branch (one command)

```bash
npm run build
npx gh-pages -d dist
```

Then set **Settings → Pages → Source: Deploy from a branch → `gh-pages` / `/ (root)`**.

### If you prefer an absolute base path

Relative `base` avoids this entirely, but if you want an explicit path you can set
`base: '/<repository-name>/'` in `vite.config.js` — for example a repository named
`NEON-RUSH` would use `base: '/NEON-RUSH/'`. Only do this if you serve from the
repo root path; keep `./` for maximum portability.

---

## Repository checklist

Before publishing:

- [ ] No secrets present — this is an offline game with no API keys, tokens, or
      credentials; nothing in `src/` reads environment variables.
- [ ] `.gitignore` excludes `node_modules/`, `dist/`, `.env*`, logs, and editor/OS
      cruft, while keeping all source, configs, `package.json`, and
      `package-lock.json` tracked.
- [ ] Commit `package-lock.json` for reproducible `npm ci` installs.
- [ ] `package.json` is `"private": true` — this only blocks accidental `npm
      publish` to the registry and does **not** affect hosting on GitHub.
- [ ] Add a `LICENSE` file to define how others may use the project.
- [ ] Confirm the repository name you want (e.g. `NEON-RUSH`) for the Pages URL.

---

## Credits

- **Design, code, art, and audio:** original work created for this project — all
  visuals are Canvas-generated and all sound effects are synthesized at runtime;
  no copyrighted characters, logos, or third-party game assets are used.
- **Tooling:** [Vite](https://vitejs.dev/), the [Canvas 2D
  API](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D), and
  the [Web Audio API](https://developer.mozilla.org/docs/Web/API/Web_Audio_API).

Add your name/handle here for authorship.

---

*NEON RUSH — collect, dash, and outrun the clock.*
