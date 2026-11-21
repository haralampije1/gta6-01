// Pedestrians: wander, flee mayhem, die under fire or under tires.
import { player } from "./player.js";
import { WORLD_W, WORLD_H, collidesRect } from "./world.js";

export const peds = [];

export function spawnPeds(n = 26) {
  for (let i = 0; i < n; i++) {
    peds.push({
      x: 50 + Math.random() * (WORLD_W - 100),
      y: 50 + Math.random() * (WORLD_H - 100),
      color: "#cbd5e1",
      state: "wander",
      target: { x: 0, y: 0 },
      timer: Math.random() * 60,
      speed: 1.0 + Math.random() * 1.0,
      dead: false,
      life: 0,
    });
  }
}

export function updatePeds(dt, s) {
  for (let i = peds.length - 1; i >= 0; i--) {
    const p = peds[i];
    if (p.dead) {
      p.life--;
      if (p.life <= 0) peds.splice(i, 1);
      continue;
    }
    if (s.wanted > 0 && Math.hypot(p.x - player.x, p.y - player.y) < 250) {
      const a = Math.atan2(p.y - player.y, p.x - player.x);
      p.target = { x: p.x + Math.cos(a) * 200, y: p.y + Math.sin(a) * 180 };
      p.speed = 2.4;
    } else {
      p.timer--;
      if (p.timer <= 0) {
        p.target = { x: p.x + (Math.random() - 0.5) * 220, y: p.y + (Math.random() - 0.5) * 220 };
        p.timer = 50 + Math.random() * 70;
        p.speed = 1.0 + Math.random() * 1.2;
      }
    }
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 8) {
      const nx = p.x + Math.cos(Math.atan2(dy, dx)) * p.speed * dt * 60;
      const ny = p.y + Math.sin(Math.atan2(dy, dx)) * p.speed * dt * 60;
      if (!collidesRect(nx - 4, p.y - 4, 8, 18)) p.x = nx;
      if (!collidesRect(p.x - 4, ny - 4, 8, 18)) p.y = ny;
      else p.timer = 0;
    } else p.timer = 0;
  }
}

export function drawPeds(ctx) {
  for (const p of peds) {
    ctx.fillStyle = p.dead ? "#64748b" : p.color;
    ctx.fillRect(p.x - 5, p.y - 9, 10, 18);
    if (!p.dead) {
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(p.x - 1, p.y - 10, 2, 3);
    }
  }
}

export function hitPed(x, y, r, s) {
  let hit = false;
  for (const p of peds) {
    if (p.dead) continue;
    if (Math.hypot(p.x - x, p.y - y) < r + 12) {
      p.dead = true;
      p.life = 40;
      s.wanted = Math.min(4, s.wanted + 1);
      s.money += 5;
      hit = true;
    }
  }
  return hit;
}
