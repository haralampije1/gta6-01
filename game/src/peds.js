// Pedestrians: spawn on sidewalks, wander aimlessly, flee when shots ring out,
// fall to gunfire or tires, then fade away behind a chalk outline.
// Re-authored by build agent.
import { player } from "./player.js";
import { WORLD_W, WORLD_H, collidesRect } from "./world.js";

export const peds = [];

export function spawnPeds(n = 26) {
  const placed = [];
  let tries = 0;
  while (placed.length < n && tries < n * 40) {
    tries++;
    const x = 40 + Math.random() * (WORLD_W - 80);
    const y = 40 + Math.random() * (WORLD_H - 80);
    if (collidesRect(x - 4, y - 8, 8, 18)) continue;
    placed.push({
      x, y,
      color: ["#cbd5e1", "#e2e8f0", "#94a3b8"][Math.floor(Math.random() * 3)],
      state: "wander",
      target: { x, y },
      timer: 20 + Math.random() * 80,
      speed: 0.8 + Math.random() * 1.4,
      dead: false,
      life: 0,
      face: Math.random() * Math.PI * 2,
    });
  }
  peds.push(...placed);
}

export function updatePeds(dt, s) {
  const step = dt * 60;
  for (let i = peds.length - 1; i >= 0; i--) {
    const p = peds[i];
    if (p.dead) {
      p.life -= step;
      if (p.life <= 0) peds.splice(i, 1);
      continue;
    }
    const near = Math.hypot(p.x - player.x, p.y - player.y);
    if (s.wanted > 0 && near < 300) {
      const a = Math.atan2(p.y - player.y, p.x - player.x);
      p.target = { x: p.x - Math.cos(a) * 260, y: p.y - Math.sin(a) * 260 };
      p.speed = 2.6;
    } else {
      p.timer -= step;
      if (p.timer <= 0) {
        p.target = { x: p.x + (Math.random() - 0.5) * 200, y: p.y + (Math.random() - 0.5) * 200 };
        p.timer = 40 + Math.random() * 90;
        p.speed = 0.9 + Math.random() * 1.2;
      }
    }
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 6) {
      p.face = Math.atan2(dy, dx);
      const nx = p.x + Math.cos(p.face) * p.speed * step;
      const ny = p.y + Math.sin(p.face) * p.speed * step;
      if (!collidesRect(nx - 4, p.y - 8, 8, 18)) p.x = nx;
      if (!collidesRect(p.x - 4, ny - 8, 8, 18)) p.y = ny;
      else p.timer = 0;
    } else p.timer = 0;
  }
}

export function drawPeds(ctx) {
  for (const p of peds) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.face);
    if (p.dead) {
      ctx.fillStyle = "#64748b";
      ctx.fillRect(-6, -10, 4, 16);
      ctx.fillRect(2, -10, 4, 16);
      ctx.strokeStyle = "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(0, 6);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(-5, -10, 10, 18);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(-2, -12, 4, 4);
      ctx.fillStyle = "#475569";
      ctx.fillRect(-4, -6, 3, 10);
      ctx.fillRect(1, -6, 3, 10);
    }
    ctx.restore();
  }
}

export function hitPed(x, y, r, s) {
  let hit = false;
  for (const p of peds) {
    if (p.dead) continue;
    if (Math.hypot(p.x - x, p.y - y) < r + 12) {
      p.dead = true;
      p.life = 50;
      s.wanted = Math.min(5, s.wanted + 1);
      s.money += 10;
      hit = true;
    }
  }
  return hit;
}
