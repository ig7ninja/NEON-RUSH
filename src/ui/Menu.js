import { LEVELS } from '../data/levels.js';
import { UPGRADES, DRONE_TINTS } from '../core/GameState.js';

export class Menu {
  constructor(layer, game) {
    this.layer = layer;
    this.game = game;
    this.current = null;
    this.selected = 0;
    this.upgradeReturnTo = 'title';
    this.pendingResults = null;
    this.pendingFinal = false;

    this.buildScreens();
    this.bindMouse();
  }

  buildScreens() {
    this.layer.innerHTML = `
      <div class="screen" id="screen-title">
        <h1 class="logo">NEON <span class="rush">RUSH</span></h1>
        <div class="subtitle">ENERGY DRONE PROTOCOL</div>
        <div class="menu-list" data-nav>
          <button class="menu-item" data-action="newRun">NEW RUN</button>
          <button class="menu-item" data-action="continue">CONTINUE</button>
          <button class="menu-item" data-action="levelselect">LEVEL SELECT</button>
          <button class="menu-item" data-action="upgrades">UPGRADES</button>
          <button class="menu-item" data-action="settings">SETTINGS</button>
          <button class="menu-item" data-action="howto">HOW TO PLAY</button>
        </div>
        <div class="hint"><b>WASD</b> move &nbsp; <b>SPACE</b> dash &nbsp; <b>E</b> interact &nbsp; <b>ESC</b> pause</div>
      </div>

      <div class="screen" id="screen-levelselect">
        <h2 class="screen-title">LEVEL SELECT</h2>
        <div class="level-grid" id="level-grid" data-nav></div>
        <div class="hint"><b>ENTER</b> start &nbsp; <b>ESC</b> back</div>
      </div>

      <div class="screen" id="screen-howto">
        <h2 class="screen-title">HOW TO PLAY</h2>
        <div class="tutorial-list">
          <div><b>GOAL</b> — collect every shard, flip the required switches, reach the exit.</div>
          <div><b>WASD / ARROWS</b> move &nbsp;·&nbsp; <b>SPACE</b> dash &nbsp;·&nbsp; <b>E</b> use switch &nbsp;·&nbsp; <b>ESC</b> pause &nbsp;·&nbsp; <b>R</b> retry after failure</div>
          <div><b>DASH</b> — a short burst that crosses <span style="color:#9a6bff">violet fields</span> and <span style="color:#9a6bff">dash gates</span> safely. It does NOT protect you from red or pink hazards. Watch the cooldown bar.</div>
          <div><b>COMBO</b> — chain pickups quickly to raise the multiplier up to x4. It decays if you stop collecting or get hit.</div>
          <div><b>NEAR MISS</b> — shave past a moving orb for bonus points. Do it during a dash for double.</div>
          <div class="warn">Red = deadly. Violet = dash through. Amber = interact. Green = active.</div>
        </div>
        <button class="btn" data-action="back" data-focus>BACK</button>
      </div>

      <div class="screen" id="screen-settings">
        <h2 class="screen-title">SETTINGS</h2>
        <div class="settings-list" data-nav>
          <div class="setting-row" data-setting="masterVolume" data-focus><label>MASTER VOLUME</label><span class="setting-value"></span></div>
          <div class="setting-row" data-setting="sfxVolume" data-focus><label>SFX VOLUME</label><span class="setting-value"></span></div>
          <div class="setting-row" data-setting="screenShake" data-focus><label>SCREEN SHAKE</label><span class="setting-value"></span></div>
          <div class="setting-row" data-setting="reducedEffects" data-focus><label>REDUCED EFFECTS</label><span class="setting-value"></span></div>
          <div class="setting-row" data-setting="fullscreen" data-focus><label>FULLSCREEN</label><span class="setting-value"></span></div>
          <button class="btn" data-action="resetProgress">RESET ALL PROGRESS</button>
          <button class="btn" data-action="back" data-focus>BACK</button>
        </div>
        <div class="hint"><b>LEFT / RIGHT</b> adjust &nbsp; <b>ENTER</b> toggle &nbsp; <b>ESC</b> back</div>
      </div>

      <div class="screen" id="screen-upgrades">
        <h2 class="screen-title">UPGRADES</h2>
        <div class="credits-display" id="credits-display"></div>
        <div class="upgrade-grid" id="upgrade-grid" data-nav></div>
        <button class="btn" data-action="upgradeBack" data-focus>BACK</button>
        <div class="hint"><b>ENTER</b> purchase</div>
      </div>

      <div class="screen" id="screen-paused">
        <h2 class="screen-title">PAUSED</h2>
        <div class="menu-list" data-nav>
          <button class="menu-item" data-action="resume">RESUME</button>
          <button class="menu-item" data-action="restart">RESTART LEVEL</button>
          <button class="menu-item" data-action="quit">QUIT TO TITLE</button>
        </div>
        <div class="hint"><b>ESC</b> resume</div>
      </div>

      <div class="screen" id="screen-failed">
        <h2 class="screen-title" style="color:#ff3b6b; text-shadow:0 0 14px rgba(255,59,107,0.5)">SYSTEM FAILURE</h2>
        <div class="subtitle">DRONE INTEGRITY LOST</div>
        <div class="menu-list" data-nav>
          <button class="menu-item" data-action="restart">RETRY &nbsp;[R]</button>
          <button class="menu-item" data-action="quit">QUIT TO TITLE</button>
        </div>
      </div>

      <div class="screen" id="screen-levelcomplete">
        <h2 class="screen-title" id="lc-title">LEVEL COMPLETE</h2>
        <div class="results-list" id="lc-results"></div>
        <div id="lc-newbest"></div>
        <div class="menu-list" id="lc-buttons" data-nav></div>
      </div>

      <div class="screen" id="screen-gamecomplete">
        <h1 class="logo" style="font-size:44px">RUN <span class="rush">COMPLETE</span></h1>
        <div class="subtitle">ALL SIX SECTORS CLEARED</div>
        <div class="results-list" id="gc-results"></div>
        <div class="menu-list" data-nav>
          <button class="menu-item" data-action="quit" data-focus>BACK TO TITLE</button>
        </div>
      </div>
    `;

    this.screens = {};
    for (const el of this.layer.querySelectorAll('.screen')) {
      this.screens[el.id.replace('screen-', '')] = el;
    }
  }

  bindMouse() {
    this.layer.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (actionEl) {
        this.activate(actionEl);
        return;
      }
      const settingEl = e.target.closest('[data-setting]');
      if (settingEl) {
        this.adjustSetting(settingEl.dataset.setting, 1);
      }
    });
    this.layer.addEventListener('mouseover', (e) => {
      const focusEl = e.target.closest('[data-focus]');
      if (focusEl && this.focusables.includes(focusEl)) {
        this.selected = this.focusables.indexOf(focusEl);
        this.paintSelection();
      }
    });
  }

  get focusables() {
    if (!this.current) return [];
    const screen = this.screens[this.current];
    return [...screen.querySelectorAll('[data-focus], .menu-item')];
  }

  show(name, opts = {}) {
    this.hideAll();
    this.current = name;
    this.layer.classList.add('active');
    this.screens[name].classList.remove('hidden');
    this.selected = 0;
    if (name === 'levelselect') this.buildLevelGrid();
    if (name === 'upgrades') {
      this.upgradeReturnTo = opts.returnTo || 'title';
      this.buildUpgradeGrid();
    }
    if (name === 'settings') this.paintSettings();
    if (name === 'title') {
      const cont = this.screens.title.querySelector('[data-action="continue"]');
      cont.style.display = this.game.save.highestUnlocked() > 1 ? '' : 'none';
    }
    this.paintSelection();
  }

  hideAll() {
    this.layer.classList.remove('active');
    for (const key in this.screens) this.screens[key].classList.add('hidden');
    this.current = null;
  }

  update(dt) {
    const input = this.game.input;
    const focus = this.focusables;
    if (!focus.length) return;

    if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
      this.selected = (this.selected + 1) % focus.length;
      this.paintSelection();
      this.game.audio.play('menu');
    }
    if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
      this.selected = (this.selected - 1 + focus.length) % focus.length;
      this.paintSelection();
      this.game.audio.play('menu');
    }
    const grid = this.current === 'levelselect' || this.current === 'upgrades';
    if (grid && (input.wasPressed('ArrowRight') || input.wasPressed('KeyD'))) {
      this.selected = Math.min(focus.length - 1, this.selected + 1);
      this.paintSelection();
      this.game.audio.play('menu');
    }
    if (grid && (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA'))) {
      this.selected = Math.max(0, this.selected - 1);
      this.paintSelection();
      this.game.audio.play('menu');
    }

    const el = focus[this.selected];
    if (input.wasPressed('Enter') || input.wasPressed('Space')) {
      this.activate(el);
    }
    if (el && el.dataset.setting) {
      if (input.wasPressed('ArrowRight') || input.wasPressed('KeyD')) this.adjustSetting(el.dataset.setting, 1);
      if (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA')) this.adjustSetting(el.dataset.setting, -1);
    }
    if (input.wasPressed('Escape')) {
      if (this.current === 'settings') this.show(this.settingsReturnTo || 'title');
      else if (this.current === 'levelselect' || this.current === 'howto') this.show('title');
      else if (this.current === 'upgrades') this.upgradeBack();
    }
  }

  paintSelection() {
    const focus = this.focusables;
    focus.forEach((el, i) => el.classList.toggle('selected', i === this.selected));
    if (focus[this.selected]) focus[this.selected].focus({ preventScroll: true });
  }

  activate(el) {
    if (!el) return;
    if (el.dataset.setting) {
      this.adjustSetting(el.dataset.setting, 1);
      return;
    }
    const action = el.dataset.action;
    const levelIndex = el.dataset.level !== undefined ? Number(el.dataset.level) : undefined;
    const upgradeId = el.dataset.upgrade;
    this.game.audio.play('menuConfirm');
    const actions = {
      newRun: () => this.game.startRun(),
      continue: () => this.game.continueRun(),
      levelselect: () => this.show('levelselect'),
      upgrades: () => this.show('upgrades'),
      settings: () => { this.settingsReturnTo = 'title'; this.show('settings'); },
      howto: () => this.show('howto'),
      back: () => this.show('title'),
      resume: () => this.game.resumeGame(),
      restart: () => this.game.restartLevel(),
      quit: () => this.game.quitToTitle(),
      resetProgress: () => this.resetProgress(),
      upgradeBack: () => this.upgradeBack(),
      playLevel: () => {
        if (levelIndex === undefined) return;
        this.game.runActive = false;
        this.game.startWipe(() => this.game.startLevel(levelIndex, false));
      },
      buyUpgrade: () => this.buyUpgrade(upgradeId),
      nextLevel: () => this.game.advanceAfterComplete(),
      goUpgrades: () => this.game.goToUpgradesThenAdvance(),
      retryLevel: () => this.game.restartLevel(),
      finishRun: () => this.show('gamecomplete'),
      toTitle: () => this.game.quitToTitle(),
    };
    if (actions[action]) actions[action]();
  }

  upgradeBack() {
    if (this.upgradeReturnTo === 'advance') {
      this.game.advanceAfterComplete();
    } else {
      this.show('title');
    }
  }

  resetProgress() {
    this.game.save.resetAll();
    this.game.gameState.settings = { ...this.game.gameState.settings };
    this.paintSettings();
    this.show('settings');
  }

  buildLevelGrid() {
    const grid = this.screens.levelselect.querySelector('#level-grid');
    grid.innerHTML = '';
    LEVELS.forEach((lv, i) => {
      const unlocked = this.game.save.isUnlocked(i);
      const best = this.game.save.getBest(i);
      const card = document.createElement('div');
      card.className = 'level-card' + (unlocked ? '' : ' locked');
      card.dataset.focus = '';
      if (unlocked) {
        card.dataset.action = 'playLevel';
        card.dataset.level = i;
      }
      card.innerHTML = `
        <span class="num">SECTOR ${i + 1}</span>
        <span class="name">${unlocked ? lv.name : 'LOCKED'}</span>
        <span class="best ${best !== undefined ? '' : 'empty'}">${best !== undefined ? 'BEST ' + best : (unlocked ? 'NO RECORD' : '---')}</span>
      `;
      grid.appendChild(card);
    });
  }

  buildUpgradeGrid() {
    const grid = this.screens.upgrades.querySelector('#upgrade-grid');
    const save = this.game.save;
    grid.innerHTML = '';
    UPGRADES.forEach((up) => {
      const rank = save.getUpgradeRank(up.id);
      const maxed = rank >= up.max;
      const cost = maxed ? null : up.cost[rank];
      const card = document.createElement('div');
      card.className = 'upgrade-card' + (maxed ? ' maxed' : '');
      card.dataset.focus = '';
      card.dataset.upgrade = up.id;
      if (!maxed) {
        card.dataset.action = 'buyUpgrade';
      }
      const pips = Array.from({ length: up.max }, (_, i) =>
        `<span style="color:${i < rank ? '#ffd54a' : '#2a3357'}">${i < rank ? '&#9632;' : '&#9633;'}</span>`).join(' ');
      let extra = '';
      if (up.id === 'droneTint') {
        extra = `<div style="margin-top:2px"><span style="color:${DRONE_TINTS[rank % DRONE_TINTS.length]}">&#9632;</span> current skin</div>`;
      }
      card.innerHTML = `
        <span class="uname">${up.name} ${pips}</span>
        <span class="udesc">${up.desc}</span>
        ${extra}
        <span class="ucost">${maxed ? 'MAXED' : cost + ' CR'}</span>
      `;
      grid.appendChild(card);
    });
    const cd = this.screens.upgrades.querySelector('#credits-display');
    cd.textContent = 'CREDITS: ' + save.getCredits() + ' CR';
  }

  buyUpgrade(id) {
    const up = UPGRADES.find((u) => u.id === id);
    const save = this.game.save;
    const rank = save.getUpgradeRank(id);
    if (rank >= up.max) return;
    const cost = up.cost[rank];
    if (save.buyUpgrade(id, cost)) {
      this.game.audio.play('switch');
      this.buildUpgradeGrid();
      this.selected = Math.min(this.selected, this.focusables.length - 1);
      this.paintSelection();
    } else {
      this.game.audio.play('dashDenied');
    }
  }

  showLevelComplete(results, isFinal, runActive) {
    this.pendingResults = results;
    this.pendingFinal = isFinal;
    this.show('levelcomplete');
    const title = this.screens.levelcomplete.querySelector('#lc-title');
    title.textContent = isFinal ? 'FINAL SECTOR CLEAR' : 'SECTOR CLEAR';
    const rows = [
      ['SHARDS', `${results.shardsTaken} / ${results.shardsTotal}`, ''],
      ['TIME', results.time.toFixed(1) + 's', ''],
      ['SPEED BONUS', '+' + results.speedBonus, 'gold'],
      ['BEST COMBO', 'x' + results.bestCombo, ''],
      ['NEAR MISSES', '+' + results.nearMisses, ''],
      ['GATES DASHED', '+' + results.gatesPassed, ''],
      ['CREDITS EARNED', '+' + results.credits + ' CR', 'gold'],
      ['SECTOR SCORE', String(results.total), 'big pink'],
    ];
    if (runActive) rows.push(['RUN SCORE', String(this.game.runScore), 'big pink']);
    this.screens.levelcomplete.querySelector('#lc-results').innerHTML = rows
      .map(([l, v, cls]) => `<div class="row ${cls}"><span class="label">${l}</span><span class="value">${v}</span></div>`)
      .join('');
    this.screens.levelcomplete.querySelector('#lc-newbest').innerHTML =
      results.newBest ? '<div class="new-best">NEW BEST SCORE</div>' : '';

    const btns = [];
    if (isFinal && runActive) {
      btns.push(['finishRun', 'VIEW FINAL RESULTS']);
      btns.push(['retryLevel', 'REPLAY SECTOR']);
      btns.push(['toTitle', 'TITLE']);
    } else if (isFinal) {
      btns.push(['retryLevel', 'REPLAY SECTOR']);
      btns.push(['goUpgrades', 'UPGRADES']);
      btns.push(['toTitle', 'TITLE']);
    } else {
      btns.push(['nextLevel', 'NEXT SECTOR']);
      btns.push(['goUpgrades', 'UPGRADES']);
      btns.push(['retryLevel', 'REPLAY']);
      btns.push(['toTitle', 'TITLE']);
    }
    const btnWrap = this.screens.levelcomplete.querySelector('#lc-buttons');
    btnWrap.innerHTML = '';
    for (const [action, label] of btns) {
      const b = document.createElement('button');
      b.className = 'menu-item';
      b.dataset.action = action;
      b.dataset.focus = '';
      b.textContent = label;
      btnWrap.appendChild(b);
    }
    this.paintSelection();
  }

  paintSettings() {
    const s = this.game.gameState.settings;
    const values = {
      masterVolume: Math.round(s.masterVolume * 100) + '%',
      sfxVolume: Math.round(s.sfxVolume * 100) + '%',
      screenShake: s.screenShake ? 'ON' : 'OFF',
      reducedEffects: s.reducedEffects ? 'ON' : 'OFF',
      fullscreen: document.fullscreenElement ? 'ON' : 'OFF',
    };
    for (const row of this.screens.settings.querySelectorAll('[data-setting]')) {
      row.querySelector('.setting-value').textContent = values[row.dataset.setting];
    }
  }

  adjustSetting(key, dir) {
    const gs = this.game.gameState;
    const s = gs.settings;
    if (key === 'masterVolume') {
      gs.applySettingChange('masterVolume', clamp01(s.masterVolume + dir * 0.1));
      this.game.audio.setVolumes(s.masterVolume, s.sfxVolume);
    } else if (key === 'sfxVolume') {
      gs.applySettingChange('sfxVolume', clamp01(s.sfxVolume + dir * 0.1));
      this.game.audio.setVolumes(s.masterVolume, s.sfxVolume);
      this.game.audio.play('pickup');
    } else if (key === 'screenShake') {
      gs.applySettingChange('screenShake', !s.screenShake);
    } else if (key === 'reducedEffects') {
      gs.applySettingChange('reducedEffects', !s.reducedEffects);
    } else if (key === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    }
    this.paintSettings();
    this.game.audio.play('menu');
  }
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
