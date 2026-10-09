const W = 960;
const H = 640;

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    ctx.imageSmoothingEnabled = false;
    this.particles = [];
    this.bgT = 0;
    this.lastRender = 0;
    this.hatchPattern = this.makeHatchPattern();
  }

  makeHatchPattern() {
    const c = document.createElement('canvas');
    c.width = 8;
    c.height = 8;
    const p = c.getContext('2d');
    p.strokeStyle = 'rgba(255,59,107,0.35)';
    p.lineWidth = 1.6;
    p.beginPath();
    p.moveTo(-2, 10);
    p.lineTo(10, -2);
    p.moveTo(-2, 2);
    p.lineTo(2, -2);
    p.moveTo(6, 10);
    p.lineTo(10, 6);
    p.stroke();
    return this.ctx.createPattern(c, 'repeat');
  }

  burst(x, y, color, n, gameState) {
    const cap = gameState && gameState.settings.reducedEffects ? n / 2 : n;
    for (let i = 0; i < cap; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 130;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        t: 0.4 + Math.random() * 0.3,
        max: 0.7,
        size: 1.5 + Math.random() * 2.5,
        color,
      });
    }
    if (this.particles.length > 220) this.particles.splice(0, this.particles.length - 220);
  }

  render(game, hud) {
    const now = game.time;
    const dt = Math.min(0.1, now - this.lastRender || 0.016);
    this.lastRender = now;
    this.bgT += dt;
    const reduced = game.gameState.settings.reducedEffects;
    const ctx = this.ctx;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05060f';
    ctx.fillRect(0, 0, W, H);

    const inGame = game.arena && game.player;
    ctx.save();
    ctx.translate(game.shakeX, game.shakeY);

    if (inGame) {
      this.drawArena(game, reduced);
      this.drawEntities(game, reduced);
      this.drawPlayer(game, reduced);
      this.drawParticles(dt, reduced);
      this.drawPopups(game.scoring.popups, dt);
      this.drawArenaMessage(game);
      hud.draw(game);
    } else {
      this.drawTitleBackground(reduced);
      this.drawParticles(dt, reduced);
    }
    ctx.restore();

    this.drawWipe(game);
  }

  drawTitleBackground(reduced) {
    const ctx = this.ctx;
    ctx.fillStyle = '#070a1c';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(78,242,255,0.05)';
    ctx.lineWidth = 1;
    const grid = 48;
    const drift = (this.bgT * 12) % grid;
    ctx.beginPath();
    for (let x = -grid + drift; x < W; x += grid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = -grid + drift; y < H; y += grid) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();

    if (!reduced) {
      for (let i = 0; i < 5; i++) {
        const t = this.bgT * 0.35 + i * 1.7;
        const x = ((Math.sin(t) + 1) / 2) * W;
        const y = ((Math.cos(t * 0.7) + 1) / 2) * H;
        ctx.fillStyle = i % 2 ? 'rgba(154,107,255,0.08)' : 'rgba(78,242,255,0.08)';
        ctx.beginPath();
        ctx.arc(x, y, 60 + Math.sin(t * 2) * 20, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawArena(game, reduced) {
    const ctx = this.ctx;
    const arena = game.arena;

    ctx.fillStyle = '#070a1c';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(78,242,255,0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 16; x < W; x += 32) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 16; y < H; y += 32) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    const accent = arena.accent;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(16, 16, W - 32, H - 32);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(22, 22, W - 44, H - 44);

    for (const wall of arena.walls) {
      ctx.fillStyle = '#0d1330';
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = 'rgba(78,242,255,0.10)';
      ctx.fillRect(wall.x, wall.y, wall.w, 3);
      ctx.strokeStyle = 'rgba(78,242,255,0.30)';
      ctx.lineWidth = 1;
      ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
    }

    const spawn = arena.spawn;
    ctx.strokeStyle = 'rgba(78,242,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(spawn.x - 12, spawn.y - 12, 24, 24);
  }

  drawEntities(game, reduced) {
    const ctx = this.ctx;
    const arena = game.arena;

    for (const h of arena.hazards) {
      if (h.type === 'static') this.drawStaticZone(h, reduced);
      else if (h.type === 'moving') this.drawMovingHazard(h, reduced);
      else this.drawRotatingHazard(h, reduced);
    }

    for (const g of arena.gates) this.drawGate(g, reduced);

    for (const s of arena.switches) this.drawSwitch(s, arena.nearSwitch === s, reduced);

    for (const s of arena.shards) if (!s.taken) this.drawShard(s, reduced);

    this.drawExit(arena, reduced);
  }

  drawStaticZone(z, reduced) {
    const ctx = this.ctx;
    const pulse = reduced ? 0.5 : 0.44 + Math.sin(z.pulse) * 0.14;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = z.dashable ? 'rgba(154,107,255,0.16)' : 'rgba(255,59,107,0.14)';
    ctx.fillRect(z.x, z.y, z.w, z.h);
    if (!z.dashable) {
      ctx.fillStyle = this.hatchPattern;
      ctx.fillRect(z.x, z.y, z.w, z.h);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = z.dashable ? '#9a6bff' : '#ff3b6b';
    ctx.lineWidth = z.crossedFlash > 0 ? 3 : 1.5;
    ctx.strokeRect(z.x + 0.5, z.y + 0.5, z.w - 1, z.h - 1);

    if (z.dashable) {
      ctx.strokeStyle = 'rgba(154,107,255,0.7)';
      ctx.lineWidth = 2;
      const midX = z.cx;
      const midY = z.cy;
      for (let d = -1; d <= 1; d += 2) {
        ctx.beginPath();
        if (z.w >= z.h) {
          ctx.moveTo(midX - 10 * d, midY - 8);
          ctx.lineTo(midX + 4 * d, midY);
          ctx.lineTo(midX - 10 * d, midY + 8);
        } else {
          ctx.moveTo(midX - 8, midY - 10 * d);
          ctx.lineTo(midX, midY + 4 * d);
          ctx.lineTo(midX + 8, midY - 10 * d);
        }
        ctx.stroke();
      }
    }
  }

  drawMovingHazard(h, reduced) {
    const ctx = this.ctx;
    const stretch = reduced ? 0 : Math.min(18, Math.hypot(h.x2 - h.x1, h.y2 - h.y1) / h.period / 30);
    const dx = Math.sign(h.x2 - h.x1);
    const dy = Math.sign(h.y2 - h.y1);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = h.color;
    if (dx !== 0 && h.x1 !== h.x2) ctx.fillRect(Math.min(h.x, h.x - dx * stretch) - h.radius, h.y - 4, stretch + h.radius * 2, 8);
    else if (h.y1 !== h.y2) ctx.fillRect(h.x - 4, Math.min(h.y, h.y - dy * stretch) - h.radius, 8, stretch + h.radius * 2);
    ctx.globalAlpha = 1;

    ctx.shadowBlur = reduced ? 0 : 12;
    ctx.shadowColor = h.color;
    ctx.fillStyle = h.color;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(h.x1, h.y1);
    ctx.lineTo(h.x2, h.y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawRotatingHazard(h, reduced) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255,79,216,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(h.cx, h.cy, h.orbit, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,79,216,0.5)';
    ctx.fillRect(h.cx - 3, h.cy - 3, 6, 6);

    const a0 = h.startAngle + h.t * h.angSpeed;
    for (let i = 0; i < h.armCount; i++) {
      const ang = a0 + (i * Math.PI * 2) / h.armCount;
      const x = h.cx + Math.cos(ang) * h.orbit;
      const y = h.cy + Math.sin(ang) * h.orbit;
      ctx.strokeStyle = 'rgba(255,79,216,0.30)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(h.cx, h.cy);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.shadowBlur = reduced ? 0 : 10;
      ctx.shadowColor = h.color;
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.arc(x, y, h.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, h.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawGate(g, reduced) {
    const ctx = this.ctx;
    const pulse = reduced ? 0.5 : 0.5 + Math.sin(g.phase) * 0.3;
    const alpha = g.passed ? 0.25 : pulse;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#9a6bff';
    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.globalAlpha = Math.min(1, alpha + 0.3);
    if (g.flash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = g.flash;
      ctx.fillRect(g.x - 3, g.y - 3, g.w + 6, g.h + 6);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#c9a6ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(g.x + 0.5, g.y + 0.5, g.w - 1, g.h - 1);
  }

  drawSwitch(s, isNear, reduced) {
    const ctx = this.ctx;
    const pulse = 0.5 + Math.sin(s.phase) * 0.4;
    const col = s.on ? '#7dff8a' : '#ffd54a';
    ctx.save();
    ctx.translate(s.x, s.y);

    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.globalAlpha = s.on ? 0.9 : pulse;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + Math.PI / 6;
      const px = Math.cos(a) * s.r;
      const py = Math.sin(a) * s.r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = s.on ? '#7dff8a' : 'rgba(255,213,74,0.25)';
    ctx.fillRect(-4, -4, 8, 8);
    if (s.on) {
      ctx.fillStyle = '#0a2010';
      ctx.fillRect(-2, -2, 4, 4);
    }

    if (s.timed && s.on) {
      ctx.strokeStyle = '#7dff8a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, s.r + 6, -Math.PI / 2, -Math.PI / 2 + (s.timer / s.duration) * Math.PI * 2);
      ctx.stroke();
    }

    if (isNear && !s.on) {
      ctx.fillStyle = '#ffd54a';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.globalAlpha = pulse;
      ctx.fillText('[E]', 0, -s.r - 10);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawShard(s, reduced) {
    const ctx = this.ctx;
    const bob = reduced ? 0 : Math.sin(s.phase) * 3;
    const rot = s.phase * 0.8;
    ctx.save();
    ctx.translate(s.x, s.y + bob);
    ctx.rotate(rot);
    ctx.shadowBlur = reduced ? 0 : 10;
    ctx.shadowColor = '#ffd54a';
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    ctx.moveTo(0, -s.r);
    ctx.lineTo(s.r * 0.62, 0);
    ctx.lineTo(0, s.r);
    ctx.lineTo(-s.r * 0.62, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff8d0';
    ctx.beginPath();
    ctx.moveTo(0, -s.r * 0.45);
    ctx.lineTo(s.r * 0.28, 0);
    ctx.lineTo(0, s.r * 0.45);
    ctx.lineTo(-s.r * 0.28, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawExit(arena, reduced) {
    const ctx = this.ctx;
    const exit = arena.exit;
    const open = arena.isExitOpen();
    const col = open ? '#4ef2ff' : '#3d5a99';
    ctx.save();
    ctx.translate(exit.x, exit.y);

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, exit.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.setLineDash(open ? [] : [5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, exit.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (open) {
      const spin = reduced ? 0 : exit.phase * 1.4;
      ctx.save();
      ctx.rotate(spin);
      ctx.strokeStyle = 'rgba(78,242,255,0.8)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, exit.r + 5 + i * 4, i * 2.1, i * 2.1 + 1.2);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = '#4ef2ff';
      ctx.shadowBlur = reduced ? 0 : 14;
      ctx.shadowColor = '#4ef2ff';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, -2);
      ctx.lineTo(-5, 3);
      ctx.lineTo(0, 7);
      ctx.lineTo(5, 3);
      ctx.lineTo(5, -2);
      ctx.moveTo(-5, -2);
      ctx.lineTo(-2, -6);
      ctx.lineTo(2, -6);
      ctx.lineTo(5, -2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPlayer(game, reduced) {
    const ctx = this.ctx;
    const p = game.player;
    const color = game.gameState.getDroneColor();

    for (const t of p.trail) {
      ctx.globalAlpha = t.t * 0.5;
      ctx.fillStyle = color;
      const s = 3 + t.t * 6;
      ctx.fillRect(t.x - s / 2, t.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;

    const blink = p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.35;

    if (p.shield > 0) {
      ctx.strokeStyle = 'rgba(78,242,255,0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = reduced ? 0 : (p.dashing ? 18 : 9);
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    const ang = Math.atan2(p.facing.y, p.facing.x);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(p.radius + 2, 0);
    ctx.lineTo(-p.radius * 0.8, -p.radius * 0.85);
    ctx.lineTo(-p.radius * 0.35, 0);
    ctx.lineTo(-p.radius * 0.8, p.radius * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (p.dashDeniedFlash > 0) {
      ctx.strokeStyle = `rgba(255,59,107,${p.dashDeniedFlash * 2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawParticles(dt, reduced) {
    const ctx = this.ctx;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.t -= dt;
      if (pt.t <= 0) { this.particles.splice(i, 1); continue; }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.94;
      pt.vy *= 0.94;
      ctx.globalAlpha = Math.min(1, pt.t / pt.max);
      ctx.fillStyle = pt.color;
      const s = pt.size * (pt.t / pt.max);
      ctx.fillRect(pt.x - s / 2, pt.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  drawPopups(popups, dt) {
    const ctx = this.ctx;
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.textAlign = 'center';
    for (const p of popups) {
      p.y -= dt * 26;
      ctx.globalAlpha = Math.min(1, p.t);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  drawArenaMessage(game) {
    const arena = game.arena;
    if (arena.messageTimer <= 0 || !arena.message) return;
    const ctx = this.ctx;
    const a = Math.min(1, arena.messageTimer / 1.2);
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = 'rgba(5,6,15,0.8)';
    ctx.fillRect(W / 2 - 260, 44, 520, 34);
    ctx.strokeStyle = arena.accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(W / 2 - 260.5, 44.5, 521, 34);
    ctx.fillStyle = '#dfeaff';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(arena.message, W / 2, 66);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  drawWipe(game) {
    if (game.wipe <= 0 || game.wipeDir === 0) return;
    const ctx = this.ctx;
    const cover = game.wipeDir === 1 ? game.wipe : 1 - game.wipe;
    const maxR = Math.hypot(W, H) / 2;
    ctx.save();
    ctx.fillStyle = '#05060f';
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.arc(W / 2, H / 2, maxR * (1 - cover), 0, Math.PI * 2);
    ctx.fill('evenodd');
    ctx.restore();
  }
}
