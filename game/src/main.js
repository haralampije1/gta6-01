// Grand City — entry point. Bootstraps every module, owns the frame loop,
// input and the game state. Every subsystem lives in its own file.
import { initInput, keys, pointer, justDown } from "./input.js";
import { initWorld, updateWorld, drawWorld } from "./world.js";
import { initAudio } from "./audio.js";
import { drawHud } from "./hud.js";
import { player, enterVehicle, exitVehicle, hitPlayer } from "./player.js";
import { cam } from "./cars.js";
import { shootBullet } from "./weapons.js";
import { gunshot, punchHit } from "./audio.js";
import { pickMission, updateMissions } from "./missions.js";

const canvas = document.getElementById("g");
const ctx = canvas.getContext("2d", { alpha: false });
canvas.width = 1280;
canvas.height = 720;

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
canvas.addEventListener("mousedown", (e) => { pointer.down = true; pointer.just = true; pointer.x = e.clientX; pointer.y = e.clientY; });
canvas.addEventListener("mouseup", () => { pointer.down = false; });
canvas.addEventListener("mousemove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; });

let audioOn = false;
canvas.addEventListener("pointerdown", () => { if (!audioOn) { initAudio(); audioOn = true; } });

initWorld(state);

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (state.mode === "playing") {
    updateWorld(dt, state);

    if (justDown() && player.health > 0 && !player.inCar) {
      const a = Math.atan2(pointer.y + cam.y - canvas.height / 2 - player.y,
                         pointer.x + cam.x - canvas.width / 2 - player.x);
      shootBullet(player.x, player.y, a);
      gunshot();
      state.wanted = Math.min(4, state.wanted + 0.8);
      say(state, "SHOTS FIRED");
    }
    if (justDown() && player.health > 0 && !player.inCar) {
      if (hitPed(player.x, player.y, 26, state)) { punchHit(); state.wanted = Math.min(4, state.wanted + 0.5); say(state, "PUNCH"); }
    }

    // F exits the current vehicle.
    if (player.inCar) {
      if (!state.carExitReady) state.carExitReady = true;
    } else {
      state.carExitReady = false;
    }
    if (keys.KeyF && state.carExitReady && player.inCar) { exitVehicle(player); state.carExitReady = false; }
  }

  ctx.fillStyle = "#0e121c";
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

function say(s, t) { s.msg = t; s.msgTime = nowMs(); }
function nowMs() { return performance.now(); }

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
  ctx.fillStyle = "#4ade80";
  ctx.fillRect(canvas.width / 2 - 55, canvas.height / 2 + 55, 110, 34);
  ctx.fillStyle = "#052e16";
  ctx.font = "15px system-ui";
  ctx.fillText("START GAME", canvas.width / 2 - 48, canvas.height / 2 + 77);
}

function beginGame(s) {
  s.money = 0; s.wanted = 0; s.health = 100; s.score = 0; s.missionsDone = []; s.mission = pickMission(s);
  player.x = 520; player.y = 660; player.inCar = false; player.car = null; player.health = 100; player.dead = false; score = 0;
  say(s, "MISSION: " + (s.mission ? s.mission.title : "Explore the city."));
}

function loadSave(s) {
  try {
    const d = JSON.parse(localStorage.getItem("gc.save") || "{}");
    if (d) { s.money = d.money || 0; s.missionsDone = d.missionsDone || []; s.health = 100; s.wanted = 0; }
  } catch (_) {}
}

function resetWorld(s) { player.inCar = false; player.car = null; player.dead = false; }

document.getElementById("btNew").onclick = () => { beginGame(state); document.getElementById("start").style.display = "none"; state.mode = "playing"; };
document.getElementById("btLoad").onclick = () => { loadSave(state); beginGame(state); document.getElementById("start").style.display = "none"; state.mode = "playing"; };

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
canvas.addEventListener("mousedown", () => {
});
