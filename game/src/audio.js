// Audio — a pure Web Audio synth, nothing loaded over the network.
// Engine idle and rev, police siren wail, a looped music pattern,
// gunshot, punch and crash, all sketched from raw waveforms.
// Re-authored by build agent.
let ctx;
let master;

let engineOsc, engineGain;
let sirenOsc, sirenGain;
let sirenTick = 0;

const MUSIC = [0, 2, 4, 5, 7, 5, 4, 2];
let musicNote = 0;
let musicNext = 0;
const musicDeadlines = [];

const noteFreq = (n) => 440 * Math.pow(2, (n - 69) / 12);

export function initAudio() {
  if (ctx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  ctx = new Ctx();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  engineOsc = ctx.createOscillator();
  engineOsc.type = "sawtooth";
  engineGain = ctx.createGain();
  engineGain.gain.value = 0;
  engineOsc.connect(engineGain).connect(master);
  engineOsc.start();

  sirenOsc = ctx.createOscillator();
  sirenOsc.type = "square";
  sirenGain = ctx.createGain();
  sirenGain.gain.value = 0;
  sirenOsc.connect(sirenGain).connect(master);
  sirenOsc.start();

  const drone = ctx.createOscillator();
  drone.type = "triangle";
  drone.frequency.value = 110;
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.025;
  drone.connect(droneGain).connect(master);
  drone.start();

  musicNext = ctx.currentTime + 0.1;
  musicTick(ctx.currentTime);
}

function musicTick(now) {
  if (!ctx) return;
  while (musicNext <= now + 0.2) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const m = MUSIC[musicNote % MUSIC.length];
    o.type = "sine";
    o.frequency.value = noteFreq(58 + m);
    g.gain.setValueAtTime(0, musicNext);
    g.gain.linearRampToValueAtTime(0.16, musicNext + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, musicNext + 0.16);
    o.connect(g).connect(master);
    o.start(musicNext);
    o.stop(musicNext + 0.2);
    musicDeadlines.push(musicNext + 0.25);
    musicNote++;
    musicNext += 0.14;
  }
  while (musicDeadlines.length > 0 && musicDeadlines[0] <= now + 0.5) {
    musicDeadlines.shift();
  }
  setTimeout(() => musicTick(ctx.currentTime), 140);
}

export function engineSound(throttle, wanted) {
  if (!engineOsc) return;
  const base = 80 + throttle * 180;
  engineOsc.frequency.value = base + Math.sin(performance.now() / 40) * 5;
  engineGain.gain.value = throttle * 0.4;
  if (wanted > 0) {
    sirenTick++;
    const want = (Math.floor(sirenTick / 22) % 2 === 0) ? 740 : 980;
    sirenOsc.frequency.value = want;
    sirenGain.gain.value = 0.1 + Math.min(wanted, 4) * 0.05;
  } else {
    sirenGain.gain.value = 0;
  }
}

function noiseBuffer(seconds) {
  if (!ctx) return null;
  const len = Math.ceil(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export function gunshot() {
  if (!ctx) return;
  const n = ctx.createBufferSource();
  const g = ctx.createGain();
  n.buffer = noiseBuffer(0.12);
  g.gain.setValueAtTime(0.4, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.12);
  n.connect(g).connect(master);
  n.start();
}

export function punchHit() {
  if (!ctx) return;
  const n = ctx.createBufferSource();
  const g = ctx.createGain();
  n.buffer = noiseBuffer(0.06);
  g.gain.setValueAtTime(0.3, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.06);
  n.connect(g).connect(master);
  n.start();
}

export function crash() {
  if (!ctx) return;
  const n = ctx.createBufferSource();
  const g = ctx.createGain();
  n.buffer = noiseBuffer(0.4);
  g.gain.setValueAtTime(0.55, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  n.connect(g).connect(master);
  n.start();
}
