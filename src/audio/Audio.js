export class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfx = null;
    this.masterVol = 0.7;
    this.sfxVol = 0.8;
    this.unlocked = false;
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterVol;
    this.master.connect(this.ctx.destination);
    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = this.sfxVol;
    this.sfx.connect(this.master);
  }

  unlock() {
    this.ensure();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    this.unlocked = true;
  }

  setVolumes(master, sfx) {
    this.masterVol = master;
    this.sfxVol = sfx;
    if (this.master) this.master.gain.value = master;
    if (this.sfx) this.sfx.gain.value = sfx;
  }

  play(name) {
    if (!this.unlocked) return;
    this.ensure();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    switch (name) {
      case 'pickup': this.blip(880, 1320, 0.09, 'square', 0.12); break;
      case 'dash': this.sweep(300, 900, 0.16, 'sawtooth', 0.14); this.noise(0.08, 0.06); break;
      case 'dashDenied': this.blip(220, 160, 0.12, 'square', 0.1); break;
      case 'gate': this.chord([440, 660, 880], 0.18, 'triangle', 0.1); break;
      case 'switch': this.blip(520, 780, 0.12, 'triangle', 0.12); break;
      case 'shield': this.sweep(900, 300, 0.2, 'triangle', 0.14); break;
      case 'fail': this.sweep(320, 60, 0.5, 'sawtooth', 0.18); this.noise(0.3, 0.1); break;
      case 'levelcomplete': this.seq([[523, 0], [659, 0.11], [784, 0.22], [1047, 0.33]], 0.24, 'triangle', 0.12); break;
      case 'menu': this.blip(600, 600, 0.05, 'square', 0.06); break;
      case 'menuConfirm': this.blip(700, 940, 0.08, 'square', 0.09); break;
      default: break;
    }
    void t;
  }

  blip(f1, f2, dur, type, vol) {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.sfx);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  sweep(f1, f2, dur, type, vol) {
    this.blip(f1, f2, dur, type, vol);
  }

  chord(freqs, dur, type, vol) {
    for (const f of freqs) this.blip(f, f * 1.01, dur, type, vol / freqs.length * 1.5);
  }

  seq(notes, noteDur, type, vol) {
    for (const [f, at] of notes) {
      const t = this.ctx.currentTime + at;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
      o.connect(g);
      g.connect(this.sfx);
      o.start(t);
      o.stop(t + noteDur + 0.02);
    }
  }

  noise(dur, vol) {
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfx);
    src.start(t);
  }
}
