export class Shard {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.r = 9;
    this.taken = false;
    this.phase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.phase += dt * 3.2;
  }
}

export class DashGate {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.w = data.w ?? 14;
    this.h = data.h ?? 14;
    this.passed = false;
    this.flash = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.type = 'gate';
  }

  update(dt) {
    this.phase += dt * 2.4;
    if (this.flash > 0) this.flash -= dt;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
}

export class Switch {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.r = 13;
    this.on = false;
    this.timed = !!data.timed;
    this.duration = data.duration ?? 5;
    this.timer = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.type = 'switch';
  }

  update(dt) {
    this.phase += dt * 2;
    if (this.timed && this.on) {
      this.timer -= dt;
      if (this.timer <= 0) this.on = false;
    }
  }

  activate() {
    this.on = true;
    if (this.timed) this.timer = this.duration;
  }
}

export class Exit {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.r = 18;
    this.phase = 0;
  }

  update(dt) {
    this.phase += dt;
  }
}
