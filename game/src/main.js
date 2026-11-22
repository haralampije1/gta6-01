// Grand City — entry point.
// main.js owns the frame loop, input boot and the mutable game state.
// Every subsystem (city, cars, peds, bullets, missions, HUD, audio) lives
// in its own module. URL parameter `shot` runs a fixed demo route
// (title, play, chase) for screenshots.
// Re-authored by build agent.
import { initInput, keys, pointer, justDown } from "./input.js";
import { initWorld, updateWorld, drawWorld } from "./world.js";
import { initAudio, gunshot, punchHit } from "./audio.js";
import { drawHud } from "./hud.js";
import { player, enterVehicle, exitVehicle, hitPlayer } from "./player.js";
import { cars, cam, resetCars } from "./cars.js";
import { shootBullet } from "./weapons.js";
import { pickMission, updateMissions } from "./missions.js";
import { hitPed } from "./peds.js";

const canvas = document.getElementById("g");
const ctx = canvas.getContext("2d", { alpha: false });
const params = new URLSearchParams(location.search);
const SHOT = params.get("shot");
const DEMO = SHOT === "title" || SHOT === "play" || SHOT === "chase";
canvas.width = DEMO ? 1440 : 1280;
canvas.height = DEMO ? 900 : 720;

const state = {
  mode: "start",
  money: 0,
  wanted: 0,
  health: 100,
  score: 0,
  mission: null,
  missionsDone: [],
  msg: "",
  msgTime: 0,
  carExitReady: false,
};

initInput(canvas);
let audioOn = false;
canvas.addEventListener("pointerdown", () => { if (!audioOn) { initAudio(); audioOn = true; } });
initWorld(state);

const DEMO_START = performance.now();
const DEMO_WAYPOINTS = [
  { x: 1500, y: 700 },
  { x: 1500, y: 1350 },
  { x: 900, y: 1350 },
  { x: 900, y: 750 },
];
let demoWaypoint = 0;

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (state.mode === "playing") {
    updateWorld(dt, state);
    if (DEMO) demoRoute(state, now);
    else handleInput(state);
    if (player.dead) state.mode = "gameover";
  }

  ctx.fillStyle = "#0b0c14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (state.mode === "playing") {
    ctx.save();
    ctx.translate(canvas.width / 2 - cam.x, canvas.height / 2 - cam.y);
    drawWorld(ctx, state);
    ctx.restore();
  }
  drawHud(ctx, state);
  if (state.mode === "start") drawStart(ctx);
  if (state.mode === "gameover") drawGameOver(ctx);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function say(text) { state.msg = text; state.msgTime = performance.now(); }

function worldPointer() {
  return { x: pointer.x + cam.x - canvas.width / 2, y: pointer.y + cam.y - canvas.height / 2 };
}

function enterNearestCar() {
  let best = null, bestD = 60;
  for (const c of cars) {
    if (!c.alive || c.driver) continue;
    const d = Math.hypot(c.x - player.x, c.y - player.y);
    if (d < bestD) { bestD = d; best = c; }
  }
  if (best) enterVehicle(player, best);
}

function handleInput(s) {
  if (player.inCar) { if (!s.carExitReady) s.carExitReady = true; }
  else { s.carExitReady = false; }
  if (keys.KeyF && s.carExitReady) {
    if (player.inCar) { exitVehicle(player); }
    else { enterNearestCar(); }
    s.carExitReady = false;
  }

  if (!justDown() || player.inCar) return;
  const punched = hitPed(player.x, player.y, 26, s);
  if (punched) { punchHit(); s.wanted = Math.min(4, s.wanted + 0.5); say("PUNCH"); return; }
  const wp = worldPointer();
  const a = Math.atan2(wp.y - player.y, wp.x - player.x);
  shootBullet(player.x, player.y, a);
  gunshot();
  s.wanted = Math.min(4, s.wanted + 0.8);
  say("SHOTS FIRED");
}

// Fixed four-second demo route: the car steers between waypoints; on
// `chase` the wanted level is four so police cruisers give chase.
function demoRoute(s, now) {
  const car = player.car;
  if (!car) return;
  const goal = DEMO_WAYPOINTS[demoWaypoint];
  if (Math.hypot(goal.x - car.x, goal.y - car.y) < 100) demoWaypoint = (demoWaypoint + 1) % DEMO_WAYPOINTS.length;
  const target = DEMO_WAYPOINTS[demoWaypoint];
  const a = Math.atan2(target.y - car.y, target.x - car.x);
  let delta = a - car.angle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  car.angle += delta * 0.15;
  car.speed = SHOT === "chase" ? 4.2 : 3.0;
  car.vx = Math.cos(car.angle) * car.speed;
  car.vy = Math.sin(car.angle) * car.speed;
  if (SHOT === "chase") s.wanted = 4;
  else if (now - DEMO_START > 2000) s.wanted = Math.min(4, s.wanted + 0.04);
}

function beginGame(s) {
  s.money = 0; s.wanted = 0; s.health = 100; s.score = 0; s.missionsDone = []; s.mission = pickMission(s);
  player.x = 640; player.y = 640; player.inCar = false; player.car = null; player.health = 100; player.dead = false;
  say("MISSION: " + (s.mission ? s.mission.title : "Explore the city."));
}

function loadSave(s) {
  try {
    const d = JSON.parse(localStorage.getItem("gc.save") || "{}");
    if (d) { s.money = d.money || 0; s.missionsDone = d.missionsDone || []; s.health = 100; s.wanted = 0; }
  } catch (_) {}
}

canvas.addEventListener("mousedown", (e) => {
  if (state.mode === "gameover") { beginGame(state); state.mode = "playing"; }
});

document.getElementById("btNew").onclick = () => { beginGame(state); document.getElementById("start").style.display = "none"; state.mode = "playing"; };
document.getElementById("btLoad").onclick = () => { loadSave(state); beginGame(state); document.getElementById("start").style.display = "none"; state.mode = "playing"; };

// M brings up the current mission text.
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyM" && state.mode === "playing" && state.mission) {
    const m = state.mission;
    const st = (m.steps || [])[m.stepIdx || 0];
    say("MISSION: " + m.title + (st ? " — " + st.text : ""));
  }
});

if (DEMO && SHOT !== "title") {
  beginGame(state);
  resetCars();
  document.getElementById("start").style.display = "none";
  state.mode = "playing";
  if (SHOT === "chase") {
    player.car.x = 760; player.car.y = 3360;
    player.x = 760; player.y = 3360;
    state.wanted = 4;
  }
}

function drawStart(ctx) {
  ctx.fillStyle = "#0b0c16";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffe86f";
  ctx.font = "bold 56px system-ui,-apple-system,Segoe UI,sans-serif";
  ctx.fillText("GRAND CITY", canvas.width / 2 - 150, canvas.height / 2 - 70);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px system-ui";
  ctx.fillText("Steal cars · Evade police · Run missions · Survive", canvas.width / 2 - 190, canvas.height / 2 - 20);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "13px system-ui";
  ctx.fillText("WASD drive/walk", canvas.width / 2 - 140, canvas.height / 2 + 10);
  ctx.fillText("CLICK shoot/punch", canvas.width / 2 - 140, canvas.height / 2 + 28);
  ctx.fillText("F enter/exit vehicle", canvas.width / 2 - 140, canvas.height / 2 + 46);
  ctx.fillText("M mission text", canvas.width / 2 - 140, canvas.height / 2 + 64);
  ctx.fillStyle = "#4ade80";
  ctx.fillRect(canvas.width / 2 - 55, canvas.height / 2 + 88, 110, 34);
  ctx.fillStyle = "#052e16";
  ctx.font = "15px system-ui";
  ctx.fillText("START GAME", canvas.width / 2 - 48, canvas.height / 2 + 113);
}

function drawGameOver(ctx) {
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fca5a5";
  ctx.font = "bold 64px system-ui";
  ctx.fillText("BUSTED", canvas.width / 2 - 140, canvas.height / 2 - 20);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "16px system-ui";
  ctx.fillText("CREDITS: $" + state.money, canvas.width / 2 - 80, canvas.height / 2 + 20);
  ctx.fillText("CLICK TO RESTART", canvas.width / 2 - 100, canvas.height / 2 + 60);
}
