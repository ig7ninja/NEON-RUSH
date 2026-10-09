import { createHazard } from '../entities/Hazard.js';
import { Shard, DashGate, Switch, Exit } from '../entities/Pickup.js';
import { circleRect, circleCircle, dist } from './Collision.js';

const BOUND = 16;
const BOUND_THICK = 40;

export class Arena {
  constructor(level, gameState) {
    this.level = level;
    this.gameState = gameState;
    this.time = 0;
    this.message = level.objective;
    this.messageTimer = 4;

    this.walls = level.walls.map((w) => ({ ...w }));

    this.hazards = (level.hazards || []).map(createHazard);
    this.shards = (level.shards || []).map((d) => new Shard(d));
    this.gates = (level.gates || []).map((d) => new DashGate(d));
    this.switches = (level.switches || []).map((d) => new Switch(d));
    this.exit = new Exit(level.exit);
    this.spawn = level.spawn;
    this.requiredShards = this.shards.length;
    this.requiredSwitches = this.switches.length;
    this.nearSwitch = null;
    this.accent = level.accent || '#3d7bff';
  }

  update(dt, player, game) {
    this.time += dt;
    if (this.messageTimer > 0) this.messageTimer -= dt;

    for (const h of this.hazards) {
      h.update(dt);
      if (h.checkNearMiss) h.checkNearMiss(player, game.scoring);
    }
    for (const s of this.shards) s.update(dt);
    for (const g of this.gates) g.update(dt);
    for (const s of this.switches) s.update(dt);
    this.exit.update(dt);

    for (const g of this.gates) {
      if (!g.passed && player.dashing && circleRect(player.x, player.y, player.radius, g)) {
        g.passed = true;
        g.flash = 0.6;
        game.scoring.onGatePassed(g);
        game.audio.play('gate');
      }
    }
  }

  resolveWalls(player) {
    for (const w of this.walls) {
      pushOutOfRect(player, w);
    }
    if (!player.dashing) {
      for (const g of this.gates) {
        pushOutOfRect(player, g);
      }
    }

    const minX = BOUND + player.radius;
    const maxX = 960 - BOUND - player.radius;
    const minY = BOUND + player.radius;
    const maxY = 640 - BOUND - player.radius;
    if (player.x < minX) { player.x = minX; player.vx = Math.max(0, player.vx); if (player.dashing) this.cancelDashOnWall(player); }
    if (player.x > maxX) { player.x = maxX; player.vx = Math.min(0, player.vx); if (player.dashing) this.cancelDashOnWall(player); }
    if (player.y < minY) { player.y = minY; player.vy = Math.max(0, player.vy); if (player.dashing) this.cancelDashOnWall(player); }
    if (player.y > maxY) { player.y = maxY; player.vy = Math.min(0, player.vy); if (player.dashing) this.cancelDashOnWall(player); }
  }

  cancelDashOnWall(player) {
    player.dashing = false;
    player.dashTimer = 0;
    player.vx = 0;
    player.vy = 0;
  }

  checkHazardCollision(player) {
    for (const h of this.hazards) {
      if (h.dashable && player.dashing) {
        if (h.hits(player) && h.crossedFlash !== undefined && h.crossedFlash <= 0) {
          h.crossedFlash = 0.4;
        }
        continue;
      }
      if (player.isInvulnerable()) continue;
      if (h.hits(player)) return { x: player.x, y: player.y, hazard: h };
    }
    return null;
  }

  collectShard(player) {
    for (const s of this.shards) {
      if (!s.taken && circleCircle(player.x, player.y, player.radius, s.x, s.y, s.r)) {
        s.taken = true;
        return s;
      }
    }
    return null;
  }

  getInteractableSwitch(player) {
    for (const s of this.switches) {
      if (dist(player.x, player.y, s.x, s.y) < player.radius + s.r + 14) return s;
    }
    return null;
  }

  switchesOn() {
    let n = 0;
    for (const s of this.switches) if (s.on) n += 1;
    return n;
  }

  isExitOpen() {
    const shardsLeft = this.shards.some((s) => !s.taken);
    return !shardsLeft && this.switchesOn() >= this.requiredSwitches;
  }

  playerAtExit(player) {
    return circleCircle(player.x, player.y, player.radius, this.exit.x, this.exit.y, this.exit.r);
  }

  remainingShards() {
    return this.shards.filter((s) => !s.taken).length;
  }
}

function pushOutOfRect(player, rect) {
  if (!circleRect(player.x, player.y, player.radius, rect)) return;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const dx = player.x - cx;
  const dy = player.y - cy;
  const ox = rect.w / 2 + player.radius - Math.abs(dx);
  const oy = rect.h / 2 + player.radius - Math.abs(dy);
  if (ox <= 0 || oy <= 0) return;
  if (ox < oy) {
    player.x += dx >= 0 ? ox : -ox;
    player.vx = 0;
  } else {
    player.y += dy >= 0 ? oy : -oy;
    player.vy = 0;
  }
}
