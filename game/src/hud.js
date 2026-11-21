// HUD overlay drawn in screen space (already camera-corrected by main.js).
import { player } from "./player.js";
import { cars } from "./cars.js";
import { zones } from "./world.js";

const nowMs = () => performance.now();

export function drawHud(ctx, s) {
  ctx.fillStyle = "rgba(15,18,24,0.55)";
  ctx.fillRect(8, 8, 214, 124);
  ctx.fillStyle = "rgba(30,41,59,0.9)";
  ctx.fillRect(10, 10, 210, 120);

  ctx.fillStyle = "#dee2e6";
  ctx.font = "13px system-ui,-apple-system,Segoe UI,sans-serif";
  ctx.fillText("CREDITS $" + s.money, 22, 28);
  ctx.fillStyle = s.wanted > 0 ? "#fca5a5" : "#bfdbfe";
  ctx.fillText("WANTED " + "★".repeat(Math.max(0, s.wanted | 0)), 22, 46);

  ctx.fillStyle = s.health > 50 ? "#86efac" : "#fca5a5";
  ctx.fillRect(22, 56, Math.max(0, s.health) * 1.2, 8);
  ctx.strokeStyle = "#334155";
  ctx.strokeRect(21, 55, 124, 10);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px system-ui";
  ctx.fillText("HEALTH", 22, 54);

  // Minimap (absolute world coords, small scale).
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(1076, 8, 152, 100);
  ctx.strokeStyle = "#334155";
  ctx.strokeRect(1076, 8, 152, 100);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(1080, 12, 144, 96);
  const sx = 144 / WORLD_W;
  const sy = 96 / WORLD_H;
  const cx = 1080 + 9 + player.x * sx;
  const cy = 108 + 12 + player.y * sy;
  ctx.fillStyle = "#4ade80";
  ctx.fillRect(cx - 2, cy - 2, 4, 4);
  ctx.fillStyle = s.wanted > 0 ? "#f87171" : "#f59e0b";
  for (const c of cars) {
    if (c.type === "police") ctx.fillRect(1080 + 9 + c.x * sx - 1, 108 + 12 + c.y * sy - 1, 3, 3);
  }
  ctx.fillStyle = "#eab308";
  for (const z of zones) ctx.fillRect(1080 + 9 + z.x * sx - 1, 108 + 12 + z.y * sy - 1, 4, 4);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "11px system-ui";
  ctx.fillText("MINIMAP", 1090, 20);

  // Mission banner.
  if (s.mission) {
    ctx.fillStyle = "rgba(15,23,42,0.72)";
    ctx.fillRect(438, 620, 404, 40);
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "14px system-ui,-apple-system,Segoe UI,sans-serif";
    ctx.fillText("MISSION — " + s.mission.title, 448, 636);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "13px system-ui";
    ctx.fillText(s.mission.steps[m.stepIdx].text, 448, 654); // eslint-disable-line
  }

  if (s.msg && nowMs() - s.msgTime < 2300) {
    ctx.fillStyle = "rgba(15,23,42,0.8)";
    ctx.fillRect(440, 702, 390, 30);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "14px system-ui,-apple-system,Segoe UI,sans-serif";
    ctx.fillText(s.msg, 450, 718);
  }
}
