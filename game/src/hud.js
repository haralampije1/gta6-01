// HUD overlay drawn in screen space (camera-corrected by main.js).
import { player } from "./player.js";
import { cars } from "./cars.js";
import { zones } from "./world.js";

const nowMs = () => performance.now();

const PANEL = "rgba(15, 23, 42, 0.6)";
const PANEL2 = "rgba(30, 41, 59, 0.95)";
const BORDER = "rgba(148, 163, 184, 0.35)";
const TEXT = "#e2e8f0";
const MUTE = "#94a3b8";
const GOOD = "#86efac";
const BAD = "#fca5a5";
const WANTED = "#f87171";

export function drawHud(ctx, s) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const money = (s.money | 0);
  const wanted = Math.max(0, s.wanted | 0);
  const health = Math.max(0, Math.min(100, s.health | 0));

  // ---- Top-left status panel: money, wanted stars, health bar.
  ctx.save();
  ctx.fillStyle = PANEL;
  ctx.fillRect(12, 12, 240, 120);
  ctx.fillStyle = PANEL2;
  ctx.fillRect(14, 14, 236, 116);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 14, 236, 116);

  ctx.fillStyle = TEXT;
  ctx.font = "bold 14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("$ " + money, 28, 34);

  ctx.fillStyle = wanted ? WANTED : MUTE;
  ctx.fillText("WANTED " + "★".repeat(wanted), 28, 58);

  ctx.fillStyle = MUTE;
  ctx.font = "12px system-ui";
  ctx.fillText("HEALTH", 28, 80);
  ctx.fillStyle = health > 50 ? GOOD : BAD;
  ctx.fillRect(28, 88, health * 2, 10);
  ctx.strokeStyle = "#334155";
  ctx.strokeRect(27, 87, 200, 12);
  ctx.restore();

  // ---- Top-right wanted dispatch notice.
  if (wanted > 0) {
    ctx.save();
    ctx.fillStyle = "rgba(239, 68, 68, 0.14)";
    ctx.fillRect(W - 310, 12, 298, 44);
    ctx.fillStyle = WANTED;
    ctx.font = "bold 15px system-ui";
    ctx.fillText("POLICE PURSUIT — WANTED LEVEL " + wanted, W - 294, 32);
    ctx.restore();
  }

  // ---- Bottom-center mission banner with current step.
  const mission = s.mission;
  if (mission && mission.title) {
    const steps = mission.steps || [];
    const idx = Number.isFinite(s.missionStepIdx) ? s.missionStepIdx : 0;
    const stepText = steps[idx] && steps[idx].text ? steps[idx].text : "";
    const title = "MISSION — " + mission.title;
    const titleW = ctx.measureText(title).width;
    const stepW = ctx.measureText(stepText).width;
    const boxW = Math.max(titleW, stepW) + 56;
    const x = W / 2 - boxW / 2;
    const y = H - 160;

    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
    ctx.fillRect(x, y, boxW, 58);
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "15px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(title, W / 2 - titleW / 2, y + 26);
    if (stepText) {
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "13px system-ui";
      ctx.fillText(stepText, W / 2 - stepW / 2, y + 46);
    }
    ctx.restore();
  }

  // ---- Bottom-center floating message.
  if (s.msg && nowMs() - (s.msgTime || 0) < 2500) {
    const msgW = ctx.measureText(s.msg).width;
    const x = W / 2 - msgW / 2 - 24;
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(x, H - 210, msgW + 48, 34);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(s.msg, W / 2 - msgW / 2, H - 182);
    ctx.restore();
  }
}
