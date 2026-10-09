import { circleRect, circleCircle, dist } from '../world/Collision.js';

const NEAR_MISS_RANGE = 30;

export class StaticZone {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.w = data.w;
    this.h = data.h;
    this.color = data.color || '#ff3b6b';
    this.dashable = !!data.dashable;
    this.type = 'static';
    this.pulse = Math.random() * Math.PI * 2;
    this.crossedFlash = 0;
  }

  update(dt) {
    this.pulse += dt * 3;
    if (this.crossedFlash > 0) this.crossedFlash -= dt;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  hits(player) {
    return circleRect(player.x, player.y, player.radius, this);
  }
}

export class MovingHazard {
  constructor(data) {
    this.x1 = data.x1;
    this.y1 = data.y1;
    this.x2 = data.x2 ?? data.x1;
    this.y2 = data.y2 ?? data.y1;
    this.radius = data.radius ?? 12;
    this.period = data.period ?? 2.5;
    this.phase = data.phase ?? 0;
    this.color = data.color || '#ff3b6b';
    this.dashable = !!data.dashable;
    this.nearMiss = data.nearMiss !== false;
    this.type = 'moving';
    this.t = 0;
    this.x = this.x1;
    this.y = this.y1;
    this.nearMissed = false;
    this.trailPoints = [];
  }

  update(dt) {
    this.t += dt;
    const u = ((this.t / this.period) + this.phase) % 1;
    const ping = u < 0.5 ? u * 2 : 2 - u * 2;
    const e = ping * ping * (3 - 2 * ping);
    this.x = this.x1 + (this.x2 - this.x1) * e;
    this.y = this.y1 + (this.y2 - this.y1) * e;
  }

  hits(player) {
    return circleCircle(player.x, player.y, player.radius, this.x, this.y, this.radius);
  }

  checkNearMiss(player, scoring) {
    if (!this.nearMiss) return;
    const d = dist(player.x, player.y, this.x, this.y);
    const near = this.radius + player.radius + NEAR_MISS_RANGE;
    if (d < near && d > this.radius + player.radius) {
      if (!this.nearMissed && player.invuln <= 0) {
        this.nearMissed = true;
        scoring.onNearMiss(this, player.dashing);
      }
    } else if (d > near + 10) {
      this.nearMissed = false;
    }
  }
}

export class RotatingHazard {
  constructor(data) {
    this.cx = data.cx;
    this.cy = data.cy;
    this.orbit = data.orbit;
    this.radius = data.radius ?? 10;
    this.armCount = data.arms ?? 1;
    this.angSpeed = data.angSpeed ?? 2;
    this.startAngle = data.startAngle ?? 0;
    this.color = data.color || '#ff4fd8';
    this.dashable = !!data.dashable;
    this.type = 'rotating';
    this.t = 0;
    this.x = this.cx;
    this.y = this.cy;
    this.nearMissed = false;
    this.nearMiss = data.nearMiss !== false;
  }

  update(dt) {
    this.t += dt;
    const a = this.startAngle + this.t * this.angSpeed;
    this.x = this.cx + Math.cos(a) * this.orbit;
    this.y = this.cy + Math.sin(a) * this.orbit;
  }

  hits(player) {
    const a = this.startAngle + this.t * this.angSpeed;
    for (let i = 0; i < this.armCount; i++) {
      const ang = a + (i * Math.PI * 2) / this.armCount;
      const x = this.cx + Math.cos(ang) * this.orbit;
      const y = this.cy + Math.sin(ang) * this.orbit;
      if (circleCircle(player.x, player.y, player.radius, x, y, this.radius)) return true;
    }
    return false;
  }

  checkNearMiss(player, scoring) {
    if (!this.nearMiss) return;
    const d = dist(player.x, player.y, this.x, this.y);
    const near = this.radius + player.radius + NEAR_MISS_RANGE;
    if (d < near && d > this.radius + player.radius) {
      if (!this.nearMissed && player.invuln <= 0) {
        this.nearMissed = true;
        scoring.onNearMiss(this, player.dashing);
      }
    } else if (d > near + 10) {
      this.nearMissed = false;
    }
  }
}

export function createHazard(data) {
  if (data.type === 'static') return new StaticZone(data);
  if (data.type === 'rotating') return new RotatingHazard(data);
  return new MovingHazard(data);
}
