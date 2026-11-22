// Vehicles: traffic, police and the player's car. Physics is simple and
// deterministic (position + angle + speed), drawn rotated around the centre.
import { player, enterVehicle } from "./player.js";
import { keys } from "./input.js";
import { collidesCircle, collidesRect, WORLD_W, WORLD_H } from "./world.js";
import { gunshot, crash } from "./audio.js";
import { hitPlayer } from "./player.js";

export const cars = [];
export const cam = { x: 0, y: 0 };
const PALETTE = ["#4a5568", "#c53030", "#2f855a", "#ed8936", "#48bb78", "#718096", "#9f7aea"];

export function addCar(x, y, type = "traffic", color) {
  const c = {
    x, y, vx: 0, vy: 0, angle: 0, speed: 0,
    type, color, width: 26, height: 16, driver: null, alive: true,
    target: { x, y }, ticker: 0,
  };
  cars.push(c);
  return c;
}

export function spawnTraffic(n = 14) {
  for (let i = 0; i < n; i++) {
    const h = Math.random() < 0.5;
    const x = h ? (Math.random() < 0.5 ? -70 : WORLD_W + 70) : 60 + Math.random() * (WORLD_W - 120);
    const y = h ? 60 + Math.random() * (WORLD_H - 120) : (Math.random() < 0.5 ? -70 : WORLD_H + 70);
    const c = addCar(x, y, "traffic", PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    c.target = { x: h ? (x < WORLD_W / 2 ? WORLD_W + 120 : -120) : x,
                 y: h ? y : (y < WORLD_H / 2 ? WORLD_H + 120 : -120) };
    c.angle = Math.atan2(c.target.y - c.y, c.target.x - c.x);
    c.speed = 1.6 + Math.random() * 1.4;
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
  if (need > 0 && s.wanted > 0 && Math.random() < 0.012) {
    const side = Math.random() < 0.5 ? -100 : WORLD_W + 100;
    addPolice(side, 120 + Math.random() * (WORLD_H - 240));
  }
}

function drive(c, dt, s) {
  // Player-controlled car.
  if (c.type === "player") {
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
    // Autonomous traffic / police.
    const dx = c.target.x - c.x;
    const dy = c.target.y - c.y;
    const d = Math.hypot(dx, dy);
    if (d < 40) {
      c.target.x = (Math.random() < 0.5 ? -100 : WORLD_W + 100);
      c.target.y = 100 + Math.random() * (WORLD_H - 200);
      c.angle = Math.atan2(c.target.y - c.y, c.target.x - c.x);
    }
    const a = Math.atan2(dy, dx);
    let delta = a - c.angle;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    c.angle += delta * 0.09;
    c.speed += (c.type === "police" ? 0.10 : 0.06);
    if (c.speed > (c.maxSpeed || (c.type === "police" ? 3.4 : 2.6))) c.speed = c.type === "police" ? 3.4 : 2.6;
    c.vx = Math.cos(c.angle) * c.speed;
    c.vy = Math.sin(c.angle) * c.speed;
  }

  c.x += c.vx;
  c.y += c.vy;
  c.speed *= 0.97;

  // World edges.
  if (c.x < -60) c.x = WORLD_W + 60;
  if (c.x > WORLD_W + 60) c.x = -60;
  if (c.y < -60) c.y = WORLD_H + 60;
  if (c.y > WORLD_H + 60) c.y = -60;

  // Solid collisions: buildings stop the car hard.
  if (collidesRect(c.x - 11, c.y - 7, c.width - 4, c.height - 4)) {
    c.x -= Math.cos(c.angle) * c.speed * 1.5;
    c.y -= Math.sin(c.angle) * c.speed * 1.5;
    c.speed *= -0.55;
    c.angle += (Math.random() - 0.5) * 0.6;
    if (c.driver) hitPlayer(18, 0);
    crash();
  }

  // Other cars: push apart a little.
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

  // Player car vs pedestrians / other cars shooting reaction is handled in
  // weapons.js; here just body-vs-body response versus pedestrians happens in peds.js.

  // Camera follows the player car or the player on foot.
  const tc = player.car || player;
  cam.x += (tc.x - cam.x) * 0.12;
  cam.y += (tc.y - cam.y) * 0.12;
}

export function drawCars(ctx) {
  for (const c of cars) {
    if (!c.alive) continue;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    // body
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
    // roof
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(-c.width / 3, -c.height / 2, c.width * 0.66, c.height * 0.45);
    // windows
    ctx.fillStyle = "#111827";
    ctx.fillRect(-c.width / 4, -c.height / 2 + 1, c.width / 6, c.height / 4);
    ctx.fillRect(c.width / 4 - c.width / 6, -c.height / 2 + 1, c.width / 6, c.height / 4);
    // wheels
    ctx.fillStyle = "#1f2937";
    for (const wx of [-c.width / 2 + 6, c.width / 2 - 6]) {
      for (const wy of [-c.height / 2 + 4, c.height / 2 - 4]) {
        ctx.beginPath(); ctx.arc(wx, wy, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    // police light bar
    if (c.type === "police") {
      ctx.fillStyle = (Math.floor(Date.now() / 40) % 2 === 0) ? "#ffea00" : "#ef4444";
      ctx.fillRect(-9, -c.height / 2 - 5, 18, 3);
    }
    // driver dot
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
