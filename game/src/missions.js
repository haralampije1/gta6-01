// Mission script: a sequence of small objectives with zones on the map.
import { zones } from "./world.js";

export const MISSIONS = [
  {
    title: "First Delivery",
    steps: [
      { type: "reach", zone: "docks", text: "Drive to the docks" },
      { type: "reach", zone: "start", text: "Return to start" },
    ],
  },
  {
    title: "Garage Run",
    steps: [
      { type: "reach", zone: "garage", text: "Steal a car at the garage" },
      { type: "reach", zone: "bank", text: "Deliver it to the bank" },
      { type: "reach", zone: "start", text: "Return to start point" },
    ],
  },
  {
    title: "Heat Wave",
    steps: [
      { type: "evade", zone: "start", text: "Lose the police (2 stars)" },
      { type: "reach", zone: "start", text: "Return to start point" },
    ],
  },
];

export function pickMission(s) {
  const pool = MISSIONS.filter(m => !s.missionsDone.includes(m.title));
  if (pool.length === 0) return null;
  const m = { ...pool[Math.floor(Math.random() * pool.length)], stepIdx: 0, done: false };
  s.mission = m;
  return m;
}

export function updateMissions(dt, s, onSay) {
  const m = s.mission;
  if (!m || m.done) return;
  const st = m.steps[m.stepIdx];
  const zone = zones.find(z => z.kind === st.zone);
  if (!zone) return;
  const d = player.car || player;
  if (Math.hypot(d.x - (zone.x + zone.w / 2), d.y - (zone.y + z.h / 2)) < zone.w / 2 + 55) {
    m.stepIdx++;
    if (m.stepIdx >= m.steps.length) {
      m.done = true;
      s.money += 300;
      s.score += 300;
      saveGame(s);
      onSay("MISSION COMPLETE +$300");
      s.missionsDone.push(m.title);
      s.mission = null;
    } else {
      onSay("OBJECTIVE: " + m.steps[m.stepIdx].text);
    }
  }
}

function saveGame(s) {
  try {
    localStorage.setItem("gc.save", JSON.stringify({ money: s.money, missionsDone: s.missionsDone }));
  } catch (_) {}
}
