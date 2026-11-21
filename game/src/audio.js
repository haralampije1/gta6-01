// Pure Web Audio synth: engine idle, police siren, gunshot, punch, crash.
// Nothing is loaded over the network.
let ctx;
let engineOsc, engineGain;
let sirenOsc, sirenGain;

export function initAudio() {
  if (ctx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  ctx = new Ctx();
  engineOsc = ctx.createOscillator();
  engineGain = ctx.createGain();
  engineOsc.frequency.value = 110;
  engineGain.gain.value = 0;
  engineOsc.connect(engineGain).connect(ctx.destination);
  engineOsc.start();
  sirenOsc = ctx.createOscillator();
  sirenGain = ctx.createGain();
  sirenOsc.frequency.value = 880;
  sirenGain.gain.value = 0;
  sirenOsc.connect(sirenGain).connect(ctx.destination);
  sirenOsc.start();
}

export function engineSound(throttle, wanted) {
  if (!engineOsc) return;
  const base = 90 + throttle * 140;
  engineOsc.frequency.value = base + Math.sin(performance.now() / 60) * 4;
  engineGain.gain.value = throttle * 0.35;
  sirenOsc.frequency.value = wanted > 2 ? 920 : 760;
  sirenGain.gain.value = wanted > 0 ? 0.14 : 0;
}

export function gunshot() {
  if (!ctx) return;
  const n = ctx.createBufferSource();
  const g = ctx.createGain();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  n.buffer = buf;
  g.gain.setValueAtTime(0.35, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  n.connect(g).connect(ctx.destination);
  n.start();
}

export function punchHit() { if (!ctx) return; const n = ctx.createBufferSource(); const g = ctx.createGain(); const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (i < d.length / 2 ? 1 : 0); n.buffer = buf; g.gain.setValueAtTime(0.25, ctx.currentTime); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08); n.connect(g).connect(ctx.destination); n.start(); }

export function crash() { if (!ctx) return; const n = ctx.createBufferSource(); const g = ctx.createGain(); const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (i < d.length / 3 ? 1 : 0.2); n.buffer = buf; g.gain.setValueAtTime(0.5, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); n.connect(g).connect(ctx.destination); n.start(); }
