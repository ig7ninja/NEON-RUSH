import { LEVELS } from '../data/levels.js';

export class HUD {
  constructor(ctx) {
    this.ctx = ctx;
    this.displayScore = 0;
  }

  draw(game) {
    const ctx = this.ctx;
    const sc = game.scoring;
    const arena = game.arena;
    const p = game.player;
    const level = LEVELS[game.levelIndex];

    this.displayScore += (sc.score - this.displayScore) * 0.2;
    if (Math.abs(sc.score - this.displayScore) < 1) this.displayScore = sc.score;

    ctx.save();
    ctx.font = 'bold 16px "Courier New", monospace';

    // Score
    ctx.fillStyle = '#dfeaff';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE ' + String(Math.round(this.displayScore)).padStart(6, '0'), 28, 38);

    // Multiplier
    if (sc.multiplier > 1) {
      const urgency = sc.comboTimer > 0 ? Math.min(1, sc.comboTimer / 0.8) : 0;
      ctx.fillStyle = urgency < 1 ? '#ff4fd8' : '#9a6bff';
      ctx.fillText('x' + sc.multiplier.toFixed(2).replace(/0$/, ''), 28, 60);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(28, 66, 70, 3);
      ctx.fillStyle = '#ff4fd8';
      ctx.fillRect(28, 66, 70 * (sc.comboTimer / sc.comboWindow), 3);
    }

    // Level name / time (top-right)
    ctx.textAlign = 'right';
    ctx.fillStyle = arena.accent;
    ctx.fillText(level.name, W - 28, 38);
    ctx.fillStyle = '#7a89b8';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText(sc.time.toFixed(1) + 's  /  par ' + level.par, W - 28, 58);

    // Shard counter (top-center)
    const left = arena.remainingShards();
    ctx.textAlign = 'center';
    const shardCol = left === 0 ? '#7dff8a' : '#ffd54a';
    ctx.fillStyle = shardCol;
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillText('SHARDS ' + (arena.shards.length - left) + ' / ' + arena.shards.length, W / 2, 38);

    // Switch / exit status line
    if (arena.switches.length > 0) {
      const on = arena.switchesOn();
      ctx.fillStyle = on === arena.requiredSwitches ? '#7dff8a' : '#ffd54a';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('SWITCHES ' + on + ' / ' + arena.requiredSwitches, W / 2, 56);
    } else if (left === 0) {
      ctx.fillStyle = 'rgba(78,242,255,0.7)';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('EXIT OPEN', W / 2, 56);
    } else {
      ctx.fillStyle = 'rgba(122,137,184,0.7)';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('EXIT SEALED', W / 2, 56);
    }

    // Dash cooldown bar (bottom-left)
    const barW = 150;
    const barX = 28;
    const barY = H - 34;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(barX, barY, barW, 6);
    const ratio = p.dashCooldownRatio;
    ctx.fillStyle = ratio >= 1 ? '#4ef2ff' : 'rgba(78,242,255,0.45)';
    ctx.fillRect(barX, barY, barW * ratio, 6);
    ctx.strokeStyle = 'rgba(78,242,255,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 0.5, barY - 0.5, barW + 1, 7);
    ctx.fillStyle = ratio >= 1 ? '#4ef2ff' : '#7a89b8';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText(ratio >= 1 ? 'DASH READY' : 'DASH CHARGING', barX, barY - 6);

    // Shield pip (bottom-right)
    if (p.shield > 0) {
      ctx.fillStyle = '#4ef2ff';
      ctx.textAlign = 'right';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillText('SHIELD', W - 28, H - 28);
      ctx.strokeStyle = '#4ef2ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(W - 82, H - 32, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

const W = 960;
const H = 640;
