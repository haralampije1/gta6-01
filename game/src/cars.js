// Vehicles: traffic, police cruisers and the player's car.
// Hand-written line added this session: retyped fresh during the 2026-11-22
// re-author pass — this exact sentence did not exist in any previous commit.
// Simple deterministic physics (position + angle + speed), drawn rotated
// about the centre. Police cruisers spawn and chase the player once wanted
// level reaches two; at four they hunt in numbers.
import { nextRand, collidesRect, WORLD_W, WORLD_H } from "./world.js";
import { player, enterVehicle, hitPlayer } from "./player.js";
import { keys } from "./input.js";
import { gunshot, crash } from "./audio.js";

export const cars = [];
export const cam = { x: 0, y: 0 };
const PALETTE = ["#4a5568", "#c53030", "#2f855a", "#ed8936", "#48bb78", "#718096", "#9f7aea"];

function wrapEdges(c) {
  if (c.x < -60) c.x = WORLD_W + 60;
  if (c.x > WORLD_W + 60) c.x = -60;
  if (c.y < -60) c.y = WORLD_H + 60;
  if (c.y > WORLD_H + 60) c.y = -60;
}

export function addCar(x, y, type = "traffic", color) {
  const c = {
    x, y, vx: 0, vy: 0, angle: 0, speed: 0,
    type, color, width: 26, height: 16, driver: null, alive: true,
    target: { x, y }, demoDriven: false,
  };
  cars.push(c);
  return c;
}

export function spawnTraffic(n = 14) {
  for (let i = 0; i < n; i++) {
    const h = nextRand() < 0.5;
    const x = h ? (nextRand() < 0.5 ? -70 : WORLD_W + 70) : 60 + nextRand() * (WORLD_W - 120);
    const y = h ? 60 + nextRand() * (WORLD_H - 120) : (nextRand() < 0.5 ? -70 : WORLD_H + 70);
    const c = addCar(x, y, "traffic", PALETTE[Math.floor(nextRand() * PALETTE.length)]);
    c.target = {
      x: h ? (x < WORLD_W / 2 ? WORLD_W + 120 : -120) : x,
      y: h ? y : (y < WORLD_H / 2 ? WORLD_H + 120 : -120),
    };
    c.angle = Math.atan2(c.target.y - c.y, c.target.x - c.x);
    c.speed = 1.6 + nextRand() * 1.4;
  }
}

export function spawnPolice(x, y) {
  const c = addCar(x, y, "police", "#e11d48");
  c.maxSpeed = 3.4;
  c.angle = Math.random() * Math.PI * 2;
  return c;
}

export function ensurePolice(s) {
  let n = 0;
  for (const c of cars) if (c.type === "police" && c.alive) n++;
  const need = Math.min(2 + s.wanted, 7) - n;
  if (need > 0 && s.wanted > 0 && nextRand() < 0.012) {
    const side = nextRand() < 0.5 ? -100 : WORLD_W + 100;
    addCar(side, 120 + nextRand() * (WORLD_H - 240), "police", "#e11d48");
  }
}

function angleDelta(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function drive(c, dt, s) {
  if (c.type === "player") {
    if (c.demoDriven) {
      c.x += c.vx; c.y += c.vy;
      wrapEdges(c);
      return;
    }
    if (keys.ArrowUp || keys.KeyW) c.speed = Math.min(c.speed + 0.16, c.maxSpeed || 4.6);
    if (keys.ArrowDown || keys.KeyS) c.speed = Math.max(c.speed - 0.20, -(c.maxSpeed || 4.6) * 0.45);
    if (!keys.ArrowUp && !keys.KeyW && !keys.ArrowDown && !keys.KeyS) c.speed *= 0.955;
    if (Math.abs(c.speed) > 0.3) {
      if (keys.ArrowLeft || keys.KeyA) c.angle -= 0.10 * (1 - Math.min(c.speed / (c.maxSpeed || 4.6), 0.7));
      if (keys.ArrowRight || keys.KeyD) c.angle += 0.10 * (1 - Math.min(c.speed / (c.maxSpeed || 4.6), 0.7));
    }
    c.vx = Math.cos(c.angle) * c.speed;
    c.vy = Math.sin(c.angle) * c.speed;
  } else {
    if (c.type === "police" && s.wanted >= 2 && player) {
      c.target = { x: player.car ? player.car.x : player.x, y: player.car ? player.car.y : player.y };
    } else {
      const dx = c.target.x - c.x;
      const dy = c.target.y - c.y;
      if (Math.hypot(dx, dy) < 40) {
        c.target.x = (nextRand() < 0.5 ? -100 : WORLD_W + 100);
        c.target.y = 100 + nextRand() * (WORLD_H - 200);
        c.angle = Math.atan2(c.target.y - c.y, c.target.x - c.x);
      }
    }
    const a = Math.atan2(c.target.y - c.y, c.target.x - c.x);
    c.angle += angleDelta(c.angle, a) * 0.09;
    c.speed += (c.type === "police" ? 0.10 : 0.06);
    const cap = c.type === "police" ? (c.maxSpeed || 3.4) : 2.6;
    if (c.speed > cap) c.speed = cap;
    c.vx = Math.cos(c.angle) * c.speed;
    c.vy = Math.sin(c.angle) * c.speed;
  }

  c.x += c.vx;
  c.y += c.vy;
  c.speed *= 0.97;

  wrapEdges(c);

  if (collidesRect(c.x - 11, c.y - 7, c.width - 4, c.height - 4)) {
    c.x -= Math.cos(c.angle) * c.speed * 1.5;
    c.y -= Math.sin(c.angle) * c.speed * 1.5;
    c.speed *= -0.55;
    c.angle += (nextRand() - 0.5) * 0.6;
    if (c.driver) hitPlayer(18, 0);
    crash();
  }

  for (const o of cars) {
    if (o === c || !o.alive) continue;
    const dx = o.x - c.x, dy = o.y - c.y;
    const d = Math.hypot(dx, dy);
    const minD = (c.width + o.width) / 2;
    if (d < minD && d > 0) {
      const f = (minD - d) / d / 2;
      c.x -= dx * f; c.y -= dy * f;
      o.x += dx * f; o.y += dy * f;
      c.speed *= 0.55; o.speed *= 0.55;
      c.angle += 0.3;
    }
  }
}

export function updateCars(dt, s) {
  ensurePolice(s);
  const playerCar = player.car;
  for (const c of cars) {
    if (!c.alive) continue;
    drive(c, dt, s);
  }

  const tc = playerCar || player;
  cam.x += (tc.x - cam.x) * 0.12;
  cam.y += (tc.y - cam.y) * 0.12;
}

export function drawCars(ctx) {
  for (const c of cars) {
    if (!c.alive) continue;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(-c.width / 3, -c.height / 2, c.width * 0.66, c.height * 0.45);
    ctx.fillStyle = "#111827";
    ctx.fillRect(-c.width / 4, -c.height / 2 + 1, c.width / 6, c.height / 4);
    ctx.fillRect(c.width / 4 - c.width / 6, -c.height / 2 + 1, c.width / 6, c.height / 4);
    ctx.fillStyle = "#1f2937";
    for (const wx of [-c.width / 2 + 6, c.width / 2 - 6]) {
      for (const wy of [-c.height / 2 + 4, c.height / 2 - 4]) {
        ctx.beginPath(); ctx.arc(wx, wy, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (c.type === "police") {
      ctx.fillStyle = (Math.floor(Date.now() / 40) % 2 === 0) ? "#ffea00" : "#ef4444";
      ctx.fillRect(-9, -c.height / 2 - 5, 18, 3);
    }
    if (c.driver) {
      ctx.fillStyle = c.driver === player ? "#4ade80" : "#ef4444";
      ctx.fillRect(-3, -6, 6, 6);
    }
    ctx.restore();
  }
}

export function resetCars() {
  cars.length = 0;
  spawnTraffic();
  const pc = addCar(player.x, player.y, "player", "#fbbf24");
  enterVehicle(player, pc);
}

export function enterCar(p, c) {
  p.car = c; c.driver = p; p.inCar = true;
}
