// The player: on foot or inside a car. One state object shared across modules.
export const player = {
  x: 520, y: 660,        // world position
  vx: 0, vy: 0,
  angle: 0,              // facing direction (radians)
  inCar: false,
  car: null,             // reference into cars[]
  health: 100,
  money: 0,
  score: 0,
  wanted: 0,
  dead: false,
  punch: 0,              // melee cooldown frames
  shoot: 0,              // gun cooldown frames
  invuln: 0,             // invulnerability frames after taking damage
};

export function enterVehicle(p, car) {
  if (p.car || !car || car.driver) return false;
  p.car = car;
  car.driver = p;
  p.inCar = true;
  return true;
}

export function exitVehicle(p) {
  if (!p.car) return;
  const car = p.car;
  p.car = null;
  car.driver = null;
  p.inCar = false;
  // Place player beside the car.
  const ax = Math.cos(p.angle) * 34;
  const ay = Math.sin(p.angle) * 34;
  p.x = car.x - ax;
  p.y = car.y - ay;
}

export function hitPlayer(amount, wanted) {
  if (player.invuln > 0 || player.dead) return;
  player.health = Math.max(0, player.health - amount);
  player.wanted = Math.min(4, player.wanted + wanted);
  player.invuln = 24;
  if (player.health <= 0) player.dead = true;
}
