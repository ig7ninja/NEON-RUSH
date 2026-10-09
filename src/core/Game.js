import { Input } from './Input.js';
import { GameState } from './GameState.js';
import { Player } from '../player/Player.js';
import { Arena } from '../world/Arena.js';
import { Scoring } from '../systems/Scoring.js';
import { Progression } from '../systems/Progression.js';
import { Renderer } from '../rendering/Renderer.js';
import { HUD } from '../ui/HUD.js';
import { Menu } from '../ui/Menu.js';
import { SaveSystem } from '../save/SaveSystem.js';
import { Audio } from '../audio/Audio.js';
import { LEVELS } from '../data/levels.js';

const WIPE_TIME = 0.5;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input();
    this.save = new SaveSystem();
    this.gameState = new GameState(this.save);
    this.audio = new Audio();
    this.audio.setVolumes(this.gameState.settings.masterVolume, this.gameState.settings.sfxVolume);
    this.renderer = new Renderer(this.ctx);
    this.hud = new HUD(this.ctx);
    this.scoring = new Scoring(this.gameState);
    this.progression = new Progression(this.save);
    this.menu = new Menu(document.getElementById('ui-layer'), this);

    this.state = 'title';
    this.levelIndex = 0;
    this.arena = null;
    this.player = null;
    this.runActive = false;
    this.runScore = 0;
    this.shake = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.wipe = 0;
    this.wipeDir = -1;
    this.wipeCallback = null;
    this.stateTime = 0;
    this.lastTime = 0;
    this.time = 0;

    this.menu.show('title');
    this.requestLoop();
  }

  requestLoop() {
    requestAnimationFrame((t) => this.frame(t));
  }

  frame(t) {
    if (!this.lastTime) this.lastTime = t;
    let dt = (t - this.lastTime) / 1000;
    this.lastTime = t;
    if (dt > 0.1) dt = 0.1;
    this.time += dt;
    this.stateTime += dt;

    this.update(dt);
    this.render();

    this.input.endFrame();
    this.requestLoop();
  }

  setState(s) {
    this.state = s;
    this.stateTime = 0;
  }

  addShake(amount) {
    if (!this.gameState.settings.screenShake) return;
    this.shake = Math.min(this.shake + amount, 14);
  }

  update(dt) {
    this.updateWipe(dt);

    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 22);
      const s = this.shake;
      this.shakeX = (Math.random() * 2 - 1) * s;
      this.shakeY = (Math.random() * 2 - 1) * s;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    switch (this.state) {
      case 'title': case 'levelselect': case 'howto': case 'settings':
      case 'upgrades': case 'gamecomplete':
        this.menu.update(dt);
        break;
      case 'playing':
        this.updatePlaying(dt);
        break;
      case 'paused':
        this.menu.update(dt);
        if (this.input.wasPressed('Escape') || this.input.wasPressed('KeyP')) {
          this.resumeGame();
        }
        break;
      case 'levelcomplete':
        this.menu.update(dt);
        break;
      case 'failed':
        if (this.stateTime > 0.5) {
          this.menu.update(dt);
          if (this.input.wasPressed('KeyR')) {
            this.startWipe(() => this.startLevel(this.levelIndex, false));
          }
        }
        break;
    }
  }

  updatePlaying(dt) {
    if (this.input.wasPressed('Escape') || this.input.wasPressed('KeyP')) {
      this.pauseGame();
      return;
    }

    this.player.update(dt, this.input, this.arena);
    this.arena.update(dt, this.player, this);
    this.scoring.update(dt, this.player);

    this.resolveHazardHits(dt);
    this.resolvePickups();
    this.resolveInteract();
    this.checkExit();

    if (this.arena.message && this.arena.messageTimer > 0) {
      this.arena.messageTimer -= dt;
    }
  }

  resolveHazardHits() {
    if (!this.player.canBeHit()) return;
    const hit = this.arena.checkHazardCollision(this.player);
    if (hit) {
      if (this.player.shield > 0) {
        this.player.shield -= 1;
        this.player.invuln = 1.2;
        this.scoring.breakCombo(true);
        this.audio.play('shield');
        this.addShake(5);
        this.renderer.burst(hit.x, hit.y, '#4ef2ff', 14, this.gameState);
        return;
      }
      this.failLevel(hit.x, hit.y);
    }
  }

  resolvePickups() {
    const shard = this.arena.collectShard(this.player);
    if (shard) {
      this.scoring.addShard(shard);
      this.audio.play('pickup');
      this.renderer.burst(shard.x, shard.y, '#ffd54a', 8, this.gameState);
    }
  }

  resolveInteract() {
    const sw = this.arena.getInteractableSwitch(this.player);
    this.arena.nearSwitch = sw;
    if (sw && !sw.on && this.input.wasPressed('KeyE')) {
      sw.activate();
      this.audio.play('switch');
      this.scoring.addSwitchBonus(sw);
      this.renderer.burst(sw.x, sw.y, '#7dff8a', 10, this.gameState);
    }
  }

  checkExit() {
    if (!this.arena.isExitOpen(this.player)) return;
    if (this.arena.playerAtExit(this.player)) {
      this.completeLevel();
    }
  }

  startWipe(callback) {
    if (this.wipeDir !== 0) return;
    this.wipeDir = 1;
    this.wipe = 0;
    this.wipeCallback = callback;
  }

  updateWipe(dt) {
    if (this.wipeDir === 1) {
      this.wipe += dt / WIPE_TIME;
      if (this.wipe >= 1) {
        this.wipe = 1;
        this.wipeDir = -1;
        if (this.wipeCallback) {
          this.wipeCallback();
          this.wipeCallback = null;
        }
      }
    } else if (this.wipeDir === -1) {
      this.wipe -= dt / WIPE_TIME;
      if (this.wipe <= 0) {
        this.wipe = 0;
        this.wipeDir = 0;
      }
    }
  }

  startRun() {
    this.runActive = true;
    this.runScore = 0;
    this.startWipe(() => this.startLevel(0, true));
  }

  continueRun() {
    this.runActive = true;
    this.runScore = 0;
    const next = Math.min(this.save.highestUnlocked(), LEVELS.length - 1);
    this.startWipe(() => this.startLevel(next, true));
  }

  startLevel(index, fresh) {
    this.levelIndex = index;
    const level = LEVELS[index];
    this.arena = new Arena(level, this.gameState);
    this.player = new Player(
      level.spawn.x, level.spawn.y,
      this.gameState,
      this,
    );
    this.scoring.startLevel(level);
    this.menu.hideAll();
    this.setState('playing');
  }

  pauseGame() {
    this.menu.show('paused');
    this.setState('paused');
  }

  resumeGame() {
    this.menu.hideAll();
    this.setState('playing');
  }

  restartLevel() {
    this.startWipe(() => this.startLevel(this.levelIndex, false));
  }

  quitToTitle() {
    this.runActive = false;
    this.arena = null;
    this.player = null;
    this.menu.show('title');
    this.setState('title');
  }

  failLevel(x, y) {
    this.audio.play('fail');
    this.addShake(9);
    this.renderer.burst(x, y, '#ff3b6b', 22, this.gameState);
    this.scoring.breakCombo(true);
    this.menu.show('failed');
    this.setState('failed');
  }

  completeLevel() {
    const level = LEVELS[this.levelIndex];
    const results = this.scoring.finishLevel(level);
    this.progression.completeLevel(this.levelIndex, results);
    if (this.runActive) this.runScore += results.total;

    this.audio.play('levelcomplete');
    const isFinal = this.levelIndex >= LEVELS.length - 1;
    this.menu.showLevelComplete(results, isFinal, this.runActive);
    this.setState('levelcomplete');
  }

  advanceAfterComplete() {
    const nextIndex = this.levelIndex + 1;
    if (nextIndex >= LEVELS.length) {
      this.menu.show('gamecomplete');
      this.setState('gamecomplete');
      return;
    }
    this.startWipe(() => this.startLevel(nextIndex, true));
  }

  goToUpgradesThenAdvance() {
    this.menu.show('upgrades', { returnTo: 'advance' });
    this.setState('upgrades');
  }

  render() {
    this.renderer.render(this, this.hud);
  }
}
