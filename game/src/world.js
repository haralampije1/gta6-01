// Grand City — the 4000 by 4000 city.
// The grid is roads every 100 pixels with rectangular buildings between
// them. Everything is seeded from one PRNG, so a reload shows the exact
// same blocks, windows, traffic and pedestrian placement every time.
// Every frame draws the lot and updates cars, peds, bullets, the player
// on foot and the chasing camera.
// Re-authored by build agent.
import { addCar, cars, cam, updateCars, drawCars, enterCar } from "./cars.js";
import { peds, updatePeds, drawPeds } from "./peds.js";
import { updateBullets, drawBullets } from "./weapons.js";
import { updateMissions } from "./missions.js";
import { player } from "./player.js";
import { keys } from "./input.js";

export const WORLD_W = 4000;
export const WORLD_H = 4000;
export const BLOCK = 100;
export const buildings = []; // {x, y, w, h, lights: [x, y, ...], corner}
export const zones = [];     // {x, y, w, h, kind, text}

const PALETTE = ["#4a5568", "#c53030", "#2f855a", "#ed8936", "#48bb78", "#718096", "#9f7aea"];

let seed = 0x243f6a88 | 0;
export function nextRand() {
  seed ^= seed << 13; seed = seed | 0;
  seed ^= seed >>> 17; seed = seed | 0;
  seed ^= seed << 5;   seed = seed | 0;
  return (seed >>> 0) / 0x100000000;
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
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return b;
  }
  return null;
}

export function initWorld(_state) {
  buildings.length = 0;
  zones.length = 0;
  cars.length = 0;
  peds.length = 0;

  const cols = WORLD_W / BLOCK;
  const rows = WORLD_H / BLOCK;
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      if (nextRand() > 0.58) continue;
      const w = 30 + nextRand() * 76;
      const h = 30 + nextRand() * 76;
      const b = {
        x: tx * BLOCK + 10 + nextRand() * (BLOCK - 20 - w),
        y: ty * BLOCK + 10 + nextRand() * (BLOCK - 20 - h),
        w, h, lights: [], corner: nextRand() < 0.09,
      };
      for (let yy = b.y + 6; yy < b.y + b.h - 5; yy += 9) {
        for (let xx = b.x + 6; xx < b.x + b.w - 5; xx += 8) {
          if (nextRand() < 0.55) b.lights.push(xx, yy);
        }
      }
      buildings.push(b);
    }
  }

  zones.push({ x: 600,  y: 600,  w: 120, h: 120, kind: "start",  text: "START" });
  zones.push({ x: 3400, y: 3200, w: 170, h: 130, kind: "docks",  text: "DOCKS" });
  zones.push({ x: 800,  y: 3400, w: 150, h: 140, kind: "garage", text: "GARAGE" });
  zones.push({ x: 2600, y: 800,  w: 130, h: 120, kind: "bank",   text: "BANK" });

  for (let i = 0; i < 16; i++) {
    const h = nextRand() < 0.5;
    const x = h ? (nextRand() < 0.5 ? -70 : WORLD_W + 70) : 60 + nextRand() * (WORLD_W - 120);
    const y = h ? 60 + nextRand() * (WORLD_H - 120) : (nextRand() < 0.5 ? -70 : WORLD_H + 70);
    const c = addCar(x, y, "traffic", PALETTE[Math.floor(nextRand() * PALETTE.length)]);
    c.target = {
      x: h ? (x < WORLD_W / 2 ? WORLD_W + 120 : -120) : x,
      y: h ? y : (y < WORLD_H / 2 ? WORLD_H + 120 : -120),
    };
    c.angle = Math.atan2(c.target.y - c.y, c.target.x - c.x);
    c.speed = 1.4 + nextRand() * 1.6;
  }

  for (let i = 0; i < 26; i++) {
    let placed = false;
    for (let t = 0; t < 12 && !placed; t++) {
      const x = 40 + nextRand() * (WORLD_W - 80);
      const y = 40 + nextRand() * (WORLD_H - 80);
      if (!collidesRect(x - 4, y - 8, 8, 18)) {
        peds.push({
          x, y, color: "#cbd5e1", state: "wander", target: { x, y },
          timer: 30 + nextRand() * 60, speed: 1.0 + nextRand(),
          dead: false, life: 0,
        });
        placed = true;
      }
    }
  }
}

export function drawWorld(ctx, s) {
  ctx.fillStyle = "#0f131d";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  ctx.fillStyle = "#2d3442";
  for (let gx = BLOCK; gx < WORLD_W; gx += BLOCK) ctx.fillRect(gx - 3, 0, 6, WORLD_H);
  for (let gy = BLOCK; gy < WORLD_H; gy += BLOCK) ctx.fillRect(0, gy - 3, WORLD_W, 6);

  for (const b of buildings) {
    ctx.fillStyle = "#272e39";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = "#fde68a";
    for (let i = 0; i < b.lights.length; i += 2) ctx.fillRect(b.lights[i], b.lights[i + 1], 3, 4);
    if (b.corner) {
      ctx.fillStyle = "#ff7a5a";
      ctx.fillRect(b.x + b.w - 9, b.y + 6, 5, 8);
    }
    ctx.strokeStyle = "#1c222d";
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  }

  for (const z of zones) {
    ctx.fillStyle = z.kind === "start" ? "#4ade80" : z.kind === "docks" ? "#fbbf24"
      : z.kind === "garage" ? "#f472b6" : "#38bdf8";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(z.x, z.y, z.w, z.h);
    ctx.fillStyle = "#050505";
    ctx.font = "bold 13px system-ui,-apple-system,Segoe UI,sans-serif";
    ctx.fillText(z.text, z.x + 8, z.y + z.h / 2 + 5);
  }

  drawCars(ctx);
  drawPeds(ctx);
  drawBullets(ctx);

  if (!player.inCar && player.health > 0) {
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
      player.vx = mx / d * 170;
      player.vy = my / d * 170;
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

function sayWorld(s, t) { s.msg = t; s.msgTime = performance.now(); }
