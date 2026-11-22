// cap.js — demo screenshots for the gta6-01 entry.
// Plain Node, standard library only: launch Chrome headless with remote
// debugging on port 9123, run the shot demo (title → play → chase), wait
// four seconds per shot, capture Page.captureScreenshot PNGs into
// screenshots/ (1-title.png, 2-chase.png, 3-garage.png), then kill Chrome.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ROOT = "C:\\ClaudeProjects\\example-agent\\gta6-01";
const GAME = "file:///C:/ClaudeProjects/example-agent/gta6-01/game/index.html";
const PORT = 9123;
const WAIT_MS = 4000;

const SHOTS = [
  { shot: "title", out: "1-title.png" },
  { shot: "play",  out: "2-chase.png"  },
  { shot: "chase", out: "3-garage.png" },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function httpGetJson(url) { return (await fetch(url)).json(); }

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.pending = new Map();
    this.onceResolvers = new Map();
    this.lastError = null;
    this.ws.binaryType = "arraybuffer";
    this.ws.onmessage = (ev) => {
      const data = typeof ev.data === "string" ? ev.data : Buffer.from(ev.data).toString("utf8");
      let msg;
      try { msg = JSON.parse(data); } catch { return; }
      if (typeof msg.id === "number") {
        const settled = this.pending.get(msg.id);
        if (settled) { this.pending.delete(msg.id); if (msg.error) settled.reject(new Error(JSON.stringify(msg.error))); else settled.resolve(msg.result); }
      } else if (msg.method) {
        const resolve = this.onceResolvers.get(msg.method);
        if (resolve) { this.onceResolvers.delete(msg.method); resolve(msg); }
      }
    };
    this.ws.onerror = (err) => { this.lastError = err; };
    this.ws.onclose = () => {
      for (const settled of this.pending.values()) settled.reject(new Error("websocket closed"));
    };
  }
  open() {
    return new Promise((resolve, reject) => {
      this.ws.addEventListener("open", () => resolve(), { once: true });
      this.ws.addEventListener("error", (err) => reject(err || this.lastError || new Error("websocket failed")), { once: true });
    });
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = (Cdp._nextId = (Cdp._nextId || 0) + 1);
      this.pending.set(id, { resolve, reject });
      try { this.ws.send(JSON.stringify({ id, method, params })); }
      catch (err) { this.pending.delete(id); reject(err); }
    });
  }
  once(method) {
    return new Promise((resolve) => { this.onceResolvers.set(method, resolve); });
  }
  close() { try { this.ws.close(); } catch {} }
}

async function main() {
  mkdirSync(`${ROOT}/screenshots`, { recursive: true });

  const proc = spawn(CHROME, [
    "--headless=new",
    "--window-size=1440,900",
    `--remote-debugging-port=${PORT}`,
    "--autoplay-policy=no-user-gesture-required",
    "--no-first-run",
    "--no-default-browser-check",
    "--mute-audio",
    "--allow-file-access-from-files",
    `${GAME}?shot=title`,
  ], { stdio: "ignore" });

  let version;
  for (let i = 0; i < 200; i++) {
    try { version = await httpGetJson(`http://127.0.0.1:${PORT}/json/version`); break; }
    catch { await sleep(250); }
  }
  if (!version) throw new Error("Chrome remote debugging port did not answer on " + PORT);

  const targets = await httpGetJson(`http://127.0.0.1:${PORT}/json/list`);
  const page = targets.find((t) => t.type === "page");
  if (!page) throw new Error("no Chrome page target found");

  const cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.open();
  try {
    await cdp.send("Page.enable");
    for (const { shot, out } of SHOTS) {
      const loaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: `${GAME}?shot=${shot}` });
      await loaded;
      await sleep(WAIT_MS);
      const result = await cdp.send("Page.captureScreenshot", { format: "png" });
      writeFileSync(`${ROOT}/screenshots/${out}`, Buffer.from(result.data, "base64"));
    }
    try { await cdp.send("Browser.close"); } catch {}
  } finally {
    cdp.close();
    proc.kill();
  }
  console.log("CAP DONE");
}

main().catch((err) => { console.error("CAP FAILED:", err); process.exitCode = 1; });
