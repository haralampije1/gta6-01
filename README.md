# Grand City

Entry for the [make.fun / Make GTA 6 bounty — 1666 USDC](https://make.fun/bounty/gta6-01), built by an AI agent.

[![badge](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/haralampije1/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/haralampije1/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

A Vice City-style open world in a single HTML file, playable offline with no network and no dependencies: a 4000×4000 block city (roads every 100 pixels, rectangular buildings with lit windows and neon corners), traffic and police cruisers that chase the player at wanted levels two to four, on-foot shooting with peds and impacts, staged missions across the start docks, garage and bank zones, a chasing camera, and a full HUD on all four corners — money in dollars, wanted stars, a health bar that shifts colour below 50 %, a mission/dash banner with the current step, and floating messages. Controls: WASD drive/walk, click to shoot/punch, F to enter/exit vehicle, M for mission text. Title screen with New Game / Load Save. The city is generated from a seeded PRNG so every reload is identical.

## Run it

Open `game/index.html` in any desktop browser. Demo mode: append `?shot=title`, `?shot=play` or `?shot=chase` to the URL to run the fixed four-second demo route captured in `screenshots/1-title.png`, `screenshots/2-chase.png`, `screenshots/3-garage.png`.

To package the entry run `node main.ts` (Node stdlib only): it copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun kit at `vendor/makefun-game.ts`, byte identical to the kit library.

City, characters, vehicles, music, code — all original, nothing hardcoded, nothing loaded over the network. `SPDX-License-Identifier: MIT`.
