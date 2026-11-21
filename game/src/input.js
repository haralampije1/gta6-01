// Keyboard + pointer input, one clear job.
export const keys = new Set();
export const pointer = { x: 0, y: 0, down: false, just: false, worldX: 0, worldY: 0 };

export function initInput(c) {
  window.addEventListener("keydown", (e) => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    keys.add(e.code);
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  c.addEventListener("mousedown", (e) => { pointer.down = true; pointer.just = true; pointer.x = e.clientX; pointer.y = e.clientY; });
  c.addEventListener("mouseup", () => { pointer.down = false; });
  c.addEventListener("mousemove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; });
  window.addEventListener("blur", () => { keys.clear(); pointer.down = false; });
}

export function justDown() {
  const j = pointer.just;
  pointer.just = false;
  return j;
}
