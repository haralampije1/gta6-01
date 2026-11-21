// The city: blocks of buildings joined by roads. Everything here is drawn
// first, so every actor lands on top of it. Drives the per-frame update of
// every live system: cars, pedestrians, bullets and missions.
import { cars, updateCars, drawCars } from "./cars.js";
import { peds, updatePeds, drawPeds } from "./peds.js";
import { bullets, updateBullets, drawBullets, hitPed } from "./weapons.js";
import { updateMissions } from "./missions.js";
import { player, hitPlayer } from "./player.js";
import { keys } from "./input.js";

export const WORLD_W = 4000;
export const WORLD_H = 4000;
export const BLOCK = 100;
export const buildings = [];   // {x, y, w, h}
export const zones = [];       // mission zones {x, y, w, h, kind, text}

const rng = (() => { let s = 0x9e3779b9; return () => { s = (s + 0x9e3779b9) | 0; s = (s ^ (s << 13)) | 0; s = (s ^ (s >> 17)) | 0; s = (s ^ (s << 5)) | 0; return (s >>> 0) / 0x100000000; }; })();

export function initWorld(state) {
  buildings.length = 0;
  zones.length = 0;
  const bx = Math.floor(WORLD_W / BLOCK);
  const by = Math.floor(WORLD_H / BLOCK);
  for (let by = 0; by < by; by++) {
    for (let bx = 0; bx < bx; bx++) {
      if (Math.random() > 0.62) continue;
      const w = 30 + Math.random() * 64;
      const h = 30 + Math.random() * 64;
      buildings.push({ x: bx * BLOCK + 10 + Math.random() * (BLOCK - 20 - w), y: by * BLOCK + 10 + Math.random() * (BLOCK - 20 - h), w, h });
    }
  }
  zones.push({ x: 600, y: 600, w: 120, h: 120, kind: "start", text: "START" });
  zones.push({ x: 3400, y: 3200, w: 140, h: 140, kind: "docks", text: "DOCKS" });
  zones.push({ x: 800, y: 3400, w: 140, h: 140, kind: "garage", text: "GARAGE" });
  zones.push({ x: 2600, y: 800, w: 120, h: 120, kind: "bank", text: "BANK" });
}

export function collidesRect(x, y, w, h) {
  for (const b of buildings) {
    if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) return b;
  }
  return null;
}

export function collidesCircle(x, y, r) {
  for (const b of buildings) {
    const cx = Math.max(b.x, Math.min(x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(y, b.y + b.h));
    if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return b;
  }
  return null;
}

export function drawWorld(ctx, s) {
  ctx.fillStyle = "#0f131d";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Road grid.
  ctx.fillStyle = "#2d3442";
  for (let gx = BLOCK; gx < WORLD_W; gx += BLOCK) ctx.fillRect(gx - 3, 0, 6, WORLD_H);
  for (let gy = BLOCK; gy < WORLD_H; gy += BLOCK) ctx.fillRect(0, gy - 3, WORLD_W, 6);

  // Buildings.
  ctx.fillStyle = "#272e39";
  for (const b of buildings) ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = "#e8dcc4";
  for (const b of buildings) {
    const wx = 5, wy = 7;
    for (let yy = b.y + 6; yy < b.y + b.h - 4; yy += wy) {
      for (let xx = b.x + 6; xx < b.x + b.w - 4; xx += wx) {
        if (Math.random() > 0.72) continue;
        ctx.fillRect(xx, yy, 3, 4);
      }
    }
  }
  ctx.fillStyle = "#1c222d";
  for (const b of buildings) ctx.strokeRect(b.x, b.y, b.w, b.h);

  // Corners lights.
  ctx.fillStyle = "#ff7a5a";
  for (const b of buildings) {
    if (Math.random() > 0.92) ctx.fillRect(b.x + b.w - 9, b.y + 6, 5, 8);
  }

  // Mission zones.
  ctx.fillStyle = "#22c55e";
  for (const z of zones) {
    ctx.fillStyle = z.kind === "start" ? "#4ade80" : z.kind === "docks" ? "#fbbf24" : z.kind === "garage" ? "#f472b6" : "#38bdf8";
    ctx.globalAlpha = 0.45;
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.font = "13px system-ui,-apple-system,Segoe UI,sans-serif";
    ctx.fillText(z.text, z.x + 6, z.y + z.h / 2 + 4);
  }

  drawCars(ctx);
  drawPeds(ctx);
  drawBullets(ctx);

  if (!player.inCar) {
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(player.x, player.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(player.angle) * 8, player.y + Math.sin(player.angle) * 8, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function updateWorld(dt, s) {
  updateCars(dt, s);
  updatePeds(dt, s);
  updateBullets(dt, s);
  updateMissions(dt, s, (t) => { sayWorld(s, t); });

  if (!player.inCar && player.health > 0) {
    let mx = 0, my = 0;
    if (keys.ArrowUp || keys.KeyW) my -= 1;
    if (keys.ArrowDown || keys.KeyS) my += 1;
    if (keys.ArrowLeft || keys.KeyA) mx -= 1;
    if (keys.ArrowRight || keys.KeyD) mx += 1;
    if (mx !== 0 || my !== 0) {
      const d = Math.hypot(mx, my);
      player.vx = mx / d * 165;
      player.vy = my / d * 165;
      player.angle = Math.atan2(my, mx);
    } else {
      player.vx = player.vy = 0;
    }
    const nx = player.x + player.vx * dt;
    const ny = player.y + player.vy * dt;
    if (!collidesRect(player.x - 6, player.y - 9, 12, 18)) {
      player.x = nx; player.y = ny;
    } else {
      player.vx *= 0.3; player.vy *= 0.3;
    }
  }
}

function sayWorld(s, t) { s.msg = t; s.msgTime = nowMs(); }
function nowMs() { return performance.now(); }
