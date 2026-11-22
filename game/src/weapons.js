// Bullets and shooting: player on foot, police shooting back.
import { collidesRect } from "./world.js";
import { cars } from "./cars.js";
import { peds } from "./peds.js";
import { player, hitPlayer } from "./player.js";
import { gunshot } from "./audio.js";

export const bullets = [];
let policeShootT = 0;

export function shootBullet(x, y, angle) {
  bullets.push({ x, y, vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10, life: 70 });
}

export function updateBullets(dt, s) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    b.life--;
    if (b.life <= 0) { bullets.splice(i, 1); continue; }
    if (collidesRect(b.x - 3, b.y - 3, 6, 6)) { bullets.splice(i, 1); continue; }

    let hit = false;
    for (const c of cars) {
      if (!c.alive || c === player.car) continue;
      if (Math.hypot(b.x - c.x, b.y - c.y) < 19) {
        bullets.splice(i, 1);
        c.speed *= 0.25;
        s.wanted = Math.min(4, s.wanted + 1);
        gunshot();
        hit = true;
        break;
      }
    }
    if (hit) continue;

    for (const p of peds) {
      if (p.dead) continue;
      if (Math.hypot(b.x - p.x, b.y - p.y) < 13) {
        bullets.splice(i, 1);
        p.dead = true;
        p.life = 40;
        s.wanted = Math.min(4, s.wanted + 1);
        s.money += 5;
        gunshot();
        hit = true;
        break;
      }
    }
    if (hit) continue;

    if (!player.inCar && Math.hypot(b.x - player.x, b.y - player.y) < 14) {
      bullets.splice(i, 1);
      hitPlayer(25, 0);
      gunshot();
    }
  }

  policeShootT--;
  if (s.wanted > 0 && policeShootT <= 0) {
    policeShootT = 65;
    const pcs = cars.filter(c => c.type === "police" && c.alive);
    if (pcs.length) {
      const p = pcs[Math.floor(Math.random() * pcs.length)];
      const a = Math.atan2(player.y - p.y, player.x - p.x);
      bullets.push({ x: p.x, y: p.y, vx: Math.cos(a) * 6.5, vy: Math.sin(a) * 6.5, life: 55 });
    }
  }
}

export function drawBullets(ctx) {
  ctx.fillStyle = "#ffd166";
  for (const b of bullets) ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
}
