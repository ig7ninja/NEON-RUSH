import { circleRect } from '../world/Collision.js';

const BASE_SPEED = 210;
const ACCEL = 2200;
const FRICTION = 1800;
const RADIUS = 11;

const DASH_SPEED = 640;
const DASH_TIME = 0.18;
const DASH_COOLDOWN = 1.1;
const DASH_TRAIL_INTERVAL = 0.012;

export class Player {
  constructor(x, y, gameState, game) {
    this.gameState = gameState;
    this.game = game;
    this.spawnX = x;
    this.spawnY = y;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = RADIUS;
    this.shield = gameState.getShieldRank() > 0 ? 1 : 0;
    this.invuln = 0.6;
    this.facing = { x: 1, y: 0 };

    this.dashCooldownTime = gameState.getDashCooldown(DASH_COOLDOWN);
    this.dashing = false;
    this.dashTimer = 0;
    this.dashCd = 0;
    this.dashDir = { x: 1, y: 0 };
    this.trailTimer = 0;
    this.trail = [];
    this.nearMissFlash = 0;
    this.dashDeniedFlash = 0;
  }

  update(dt, input, arena) {
    if (this.invuln > 0) this.invuln -= dt;
    if (this.dashCd > 0) this.dashCd -= dt;
    if (this.dashDeniedFlash > 0) this.dashDeniedFlash -= dt;
    if (this.nearMissFlash > 0) this.nearMissFlash -= dt;

    const axis = input.getAxis();

    if (!this.dashing) {
      if (input.wasPressed('Space')) this.tryDash(axis);
      this.moveWalk(dt, axis);
    }

    if (this.dashing) {
      this.dashTimer -= dt;
      this.x += this.dashDir.x * DASH_SPEED * dt;
      this.y += this.dashDir.y * DASH_SPEED * dt;
      this.trailTimer -= dt;
      if (this.trailTimer <= 0) {
        this.trailTimer = DASH_TRAIL_INTERVAL;
        this.trail.push({ x: this.x, y: this.y, t: 1 });
        if (this.trail.length > 24) this.trail.shift();
      }
      if (this.dashTimer <= 0) {
        this.dashing = false;
        this.vx = this.dashDir.x * BASE_SPEED * 0.6;
        this.vy = this.dashDir.y * BASE_SPEED * 0.6;
      }
    } else {
      this.trailTimer = 0;
    }

    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].t -= dt * 2.4;
      if (this.trail[i].t <= 0) this.trail.splice(i, 1);
    }

    arena.resolveWalls(this);
  }

  tryDash(axis) {
    if (this.dashCd > 0) {
      this.dashDeniedFlash = 0.3;
      this.game.audio.play('dashDenied');
      return;
    }
    let dx = axis.x;
    let dy = axis.y;
    if (dx === 0 && dy === 0) {
      dx = this.facing.x;
      dy = this.facing.y;
    }
    this.dashDir = { x: dx, y: dy };
    this.facing = { x: dx, y: dy };
    this.dashing = true;
    this.dashTimer = DASH_TIME;
    this.dashCd = this.dashCooldownTime;
    this.game.audio.play('dash');
    this.game.addShake(2.5);
  }

  moveWalk(dt, axis) {
    const targetVx = axis.x * BASE_SPEED;
    const targetVy = axis.y * BASE_SPEED;
    const rate = (axis.x !== 0 || axis.y !== 0) ? ACCEL : FRICTION;
    this.vx = approach(this.vx, targetVx, rate * dt);
    this.vy = approach(this.vy, targetVy, rate * dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (axis.x !== 0 || axis.y !== 0) this.facing = { x: axis.x, y: axis.y };
  }

  canBeHit() {
    return !this.dashing && this.invuln <= 0;
  }

  isInvulnerable() {
    return this.dashing || this.invuln > 0;
  }

  get dashCooldownRatio() {
    return this.dashCd > 0 ? 1 - this.dashCd / this.dashCooldownTime : 1;
  }
}

function approach(value, target, step) {
  if (value < target) return Math.min(value + step, target);
  return Math.max(value - step, target);
}
