import { CONFIG, TOWER_TYPES } from './config.js';
import { buildWave, updateWorld } from './world.js';

let nextTowerId = 100;

export function setupShot(world, params) {
  const shot = params.get('shot');
  if (shot === 'title') {
    world.state = 'title';
  } else if (shot === 'play') {
    world.state = 'playing';
    world.wave = 6;
    world.seeds = 85;
    world.hearts = CONFIG.startHearts;

    const towerDefs = [
      { typeId: 'sun', col: 1, row: 0 },
      { typeId: 'sun', col: 2, row: 0 },
      { typeId: 'frost', col: 2, row: 2 },
      { typeId: 'thorn', col: 4, row: 3 },
      { typeId: 'thorn', col: 8, row: 3 }
    ];

    for (const td of towerDefs) {
      const def = TOWER_TYPES[td.typeId];
      world.towers.push({
        id: nextTowerId++,
        typeId: def.id,
        name: def.name,
        col: td.col,
        row: td.row,
        x: td.col * CONFIG.tileSize + CONFIG.tileSize / 2,
        y: CONFIG.hudHeight + td.row * CONFIG.tileSize + CONFIG.tileSize / 2,
        range: def.range,
        damage: def.damage,
        fireRate: def.fireRate,
        projectileSpeed: def.projectileSpeed,
        splashRadius: def.splashRadius || 0,
        slowFactor: def.slowFactor || 1,
        slowDuration: def.slowDuration || 0,
        color: def.color,
        cooldown: 0
      });
    }

    buildWave(world, world.wave);
    world.waveActive = true;
    world.spawnTimer = 0;

    // Advance updateWorld in fixed 1/30 steps for 8 simulated seconds (240 steps)
    const steps = 8 * 30;
    const dt = 1 / 30;
    for (let s = 0; s < steps; s++) {
      updateWorld(world, dt);
    }
  } else if (shot === 'end') {
    world.state = 'won';
    world.score = 2450;
    world.wave = 12;
    world.hearts = 6;
  }
}
