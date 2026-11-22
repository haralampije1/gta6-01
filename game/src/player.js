// The player: on foot or behind the wheel. One state object shared by every
// module — world.js moves the legs, cars.js drives, missions.js pays out.
export const player = {
  x: 520, y: 660,
  vx: 0, vy: 0,
  angle: 0,
  inCar: false,
  car: null,
  health: 100,
  money: 0,
  score: 0,
  wanted: 0,
  dead: false,
  punch: 0,
  shoot: 0,
  invuln: 0,
  onFootSince: 0,
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
  const ax = Math.cos(p.angle) * 34;
  const ay = Math.sin(p.angle) * 34;
  p.x = car.x - ax;
  p.y = car.y - ay;
  p.onFootSince = performance.now();
}

export function hitPlayer(amount, wanted) {
  if (player.invuln > 0 || player.dead) return;
  player.health = Math.max(0, player.health - amount);
  player.wanted = Math.min(5, player.wanted + wanted);
  player.invuln = 30;
  if (player.health <= 0) player.dead = true;
}

export function addMoney(amount) {
  player.money += amount;
  player.score += amount;
}
