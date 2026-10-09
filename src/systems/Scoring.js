const COMBO_WINDOW = 2.6;
const MAX_MULT = 4;

export class Scoring {
  constructor(gameState) {
    this.gameState = gameState;
    this.comboWindow = gameState.getComboWindow(COMBO_WINDOW);
    this.reset();
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.multiplier = 1;
    this.comboTimer = 0;
    this.bestCombo = 0;
    this.shardsTaken = 0;
    this.shardsTotal = 0;
    this.nearMisses = 0;
    this.gatesPassed = 0;
    this.gateBonus = 0;
    this.nearMissBonus = 0;
    this.switchBonus = 0;
    this.time = 0;
    this.popups = [];
  }

  startLevel(level) {
    this.reset();
    this.shardsTotal = level.shards ? level.shards.length : 0;
  }

  update(dt, player) {
    this.time += dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.breakCombo(false);
    }
    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].t -= dt;
      if (this.popups[i].t <= 0) this.popups.splice(i, 1);
    }
  }

  addScore(points, x, y, color, label) {
    const total = Math.round(points * this.multiplier);
    this.score += total;
    this.popups.push({
      text: (label ? label + ' ' : '') + '+' + total,
      x, y, t: 1.1, color: color || '#ffd54a',
    });
    return total;
  }

  addShard(shard) {
    this.shardsTaken += 1;
    this.combo += 1;
    this.comboTimer = this.comboWindow;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    this.multiplier = Math.min(MAX_MULT, 1 + this.combo * 0.25);
    this.addScore(100, shard.x, shard.y - 14, '#ffd54a');
  }

  onNearMiss(hazard, duringDash) {
    this.nearMisses += 1;
    const points = duringDash ? 100 : 50;
    this.nearMissBonus += this.addScore(
      points, hazard.x, hazard.y - hazard.radius - 10,
      duringDash ? '#ff4fd8' : '#4ef2ff', duringDash ? 'DASH MISS' : 'NEAR MISS',
    );
    if (duringDash) this.extendCombo();
  }

  onGatePassed(gate) {
    this.gatesPassed += 1;
    this.gateBonus += this.addScore(150, gate.cx, gate.cy - 16, '#9a6bff', 'GATE');
    this.extendCombo();
  }

  addSwitchBonus(sw) {
    this.switchBonus += this.addScore(75, sw.x, sw.y - 20, '#7dff8a', 'SWITCH');
    this.extendCombo();
  }

  extendCombo() {
    this.combo += 1;
    this.comboTimer = this.comboWindow;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    this.multiplier = Math.min(MAX_MULT, 1 + this.combo * 0.25);
  }

  breakCombo() {
    this.combo = 0;
    this.multiplier = 1;
    this.comboTimer = 0;
  }

  finishLevel(level) {
    const par = level.par || 60;
    const speedBonus = this.time < par ? Math.round((par - this.time) * 30) : 0;
    const comboFinishBonus = this.bestCombo >= 6 ? 250 : 0;
    const total = this.score + speedBonus + comboFinishBonus;
    return {
      base: this.score,
      speedBonus,
      comboFinishBonus,
      total,
      time: this.time,
      shardsTaken: this.shardsTaken,
      shardsTotal: this.shardsTotal,
      bestCombo: this.bestCombo,
      nearMisses: this.nearMisses,
      gatesPassed: this.gatesPassed,
      newBest: false,
    };
  }
}
