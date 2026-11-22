// Mission script: small staged objectives with a per-stage countdown timer and
// a money bonus on completion. A stage that times out abandons the mission,
// but the city never waits — the next one can always be picked up.
// Re-authored by build agent.
import { player } from "./player.js";
import { zones } from "./world.js";

export const MISSIONS = [
  {
    title: "First Delivery",
    bonus: 500,
    steps: [
      { type: "reach", zone: "docks",   text: "DELIVER THE PACKAGE — THE DOCKS", seconds: 90 },
      { type: "reach", zone: "start",   text: "RETURN TO START",                 seconds: 90 },
    ],
  },
  {
    title: "Garage Run",
    bonus: 750,
    steps: [
      { type: "reach", zone: "garage",  text: "STEAL A CAR — THE GARAGE",        seconds: 110 },
      { type: "reach", zone: "bank",    text: "DROP IT AT THE BANK",             seconds: 110 },
      { type: "reach", zone: "start",   text: "BACK TO START POINT",             seconds: 110 },
    ],
  },
  {
    title: "Heat Wave",
    bonus: 1000,
    steps: [
      { type: "evade", zone: "start",   text: "LOSE THE POLICE — HEAT TWO STARS", seconds: 120 },
      { type: "reach", zone: "start",   text: "RETURN TO START POINT",           seconds: 90 },
    ],
  },
];

export function pickMission(s) {
  const pool = MISSIONS.filter((m) => !s.missionsDone.includes(m.title));
  if (pool.length === 0) return null;
  const m = { ...pool[Math.floor(Math.random() * pool.length)], stepIdx: 0, timer: 0, done: false };
  s.mission = m;
  m.timer = m.steps[0].seconds;
  return m;
}

export function updateMissions(dt, s, onSay) {
  const m = s.mission;
  if (!m || m.done) return;
  const st = m.steps[m.stepIdx];
  if (!st) return;

  m.timer -= dt;
  if (m.timer <= 0) {
    m.done = true;
    s.mission = null;
    onSay("STAGE LOST — TIME OUT");
    return;
  }

  const zone = zones.find((z) => z.kind === st.zone);
  if (!zone) return;
  const d = player.car || player;
  const reached = Math.hypot(d.x - (zone.x + zone.w / 2), d.y - (zone.y + zone.h / 2)) < zone.w / 2 + 55;
  if ((st.type === "reach" && reached) || (st.type === "evade" && s.wanted === 0)) {
    m.stepIdx++;
    s.missionStepIdx = m.stepIdx;
    if (m.stepIdx >= m.steps.length) {
      m.done = true;
      s.money += m.bonus;
      s.score += m.bonus;
      s.missionsDone.push(m.title);
      s.mission = null;
      onSay("MISSION COMPLETE — +" + m.bonus);
    } else {
      m.timer = m.steps[m.stepIdx].seconds;
      onSay("STAGE CLEAR — " + m.steps[m.stepIdx].text);
    }
  }
}
