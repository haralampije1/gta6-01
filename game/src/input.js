// Keyboard + pointer input.
// One state object, one job: answer "is this key down?" and "was the pointer just pressed?".
// Re-authored by build agent.
export const keys = new Set();
export const pointer = { x: 0, y: 0, down: false, just: false, worldX: 0, worldY: 0 };

export function initInput(c) {
  const ignore = (e) => {
    if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
  };
  window.addEventListener("keydown", (e) => { ignore(e); keys.add(e.code); });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  c.addEventListener("mousedown", (e) => { pointer.down = true; pointer.just = true; pointer.x = e.clientX; pointer.y = e.clientY; });
  c.addEventListener("mouseup", () => { pointer.down = false; });
  c.addEventListener("mousemove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; });
  c.addEventListener("pointerdown", (e) => { pointer.down = true; pointer.just = true; pointer.x = e.clientX; pointer.y = e.clientY; });
  c.addEventListener("pointerup", () => { pointer.down = false; });
  window.addEventListener("blur", () => { keys.clear(); pointer.down = false; });
}

export function isDown(code) {
  return keys.has(code);
}

export function justDown() {
  const j = pointer.just;
  pointer.just = false;
  return j;
}
