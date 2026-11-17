import { CONFIG, PALETTE, PATH_WAYPOINTS, TOWER_TYPES, ENEMY_TYPES } from './config.js';
import { createRng, randInt } from './random.js';

let nextTowerId = 1;
let nextEnemyId = 1;
let nextProjectileId = 1;

// Precompute path pixel points and total path length
function buildPathGeometry() {
  const points = PATH_WAYPOINTS.map(wp => ({
    col: wp.col,
    row: wp.row,
    x: wp.col * CONFIG.tileSize + CONFIG.tileSize / 2,
    y: CONFIG.hudHeight + wp.row * CONFIG.tileSize + CONFIG.tileSize / 2
  }));

  let totalLength = 0;
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    segments.push({
      p1,
      p2,
      startDist: totalLength,
      endDist: totalLength + len,
      len
    });
    totalLength += len;
  }

  // Precompute path tile set for placement validation
  const pathTiles = new Set();
  for (const seg of segments) {
    const c1 = seg.p1.col;
    const r1 = seg.p1.row;
    const c2 = seg.p2.col;
    const r2 = seg.p2.row;
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    const minR = Math.min(r1, r2);
    const maxR = Math.max(r1, r2);
    for (let c = minC; c <= maxC; c++) {
      for (let r = minR; r <= maxR; r++) {
        pathTiles.add(`${c},${r}`);
      }
    }
  }

  return { points, segments, totalLength, pathTiles };
}

const pathGeo = buildPathGeometry();

export function getPathPosition(dist) {
  if (dist <= 0) return pathGeo.segments[0].p1;
  if (dist >= pathGeo.totalLength) return pathGeo.segments[pathGeo.segments.length - 1].p2;

  for (const seg of pathGeo.segments) {
    if (dist >= seg.startDist && dist <= seg.endDist) {
      const t = (dist - seg.startDist) / seg.len;
      return {
        x: seg.p1.x + (seg.p2.x - seg.p1.x) * t,
        y: seg.p1.y + (seg.p2.y - seg.p1.y) * t
      };
    }
  }
  return pathGeo.segments[pathGeo.segments.length - 1].p2;
}

export function createWorld(seed = 42) {
  const rng = createRng(seed);
  return {
    state: 'title', // 'title' | 'playing' | 'won' | 'lost'
    wave: 0,
    seeds: CONFIG.startSeeds,
    hearts: CONFIG.startHearts,
    score: 0,
    towers: [],
    enemies: [],
    projectiles: [],
    particles: [],
    floaters: [],
    selectedShopTower: 'sun',
    spawnQueue: [],
    spawnTimer: 0,
    waveActive: false,
    time: 0,
    rng,
    pathTiles: pathGeo.pathTiles,
    totalPathLength: pathGeo.totalLength,
    sfx: null
  };
}

export function buildWave(world, waveNum) {
  world.spawnQueue = [];
  const hpMult = 1 + 0.22 * (waveNum - 1);

  let countBeetle = 6 + waveNum * 3;
  let countWasp = waveNum >= 3 ? 4 + Math.floor(waveNum * 2) : 0;
  let countBrute = waveNum >= 5 ? Math.floor((waveNum - 4) * 1.5) + 1 : 0;

  if (waveNum === 1) {
    countBeetle = 8;
    countWasp = 0;
    countBrute = 0;
  } else if (waveNum === 2) {
    countBeetle = 12;
    countWasp = 3;
    countBrute = 0;
  }

  const queue = [];
  for (let i = 0; i < countBeetle; i++) queue.push('beetle');
  for (let i = 0; i < countWasp; i++) queue.push('wasp');
  for (let i = 0; i < countBrute; i++) queue.push('brute');

  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(world.rng() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }

  world.spawnQueue = queue.map(typeId => {
    const proto = ENEMY_TYPES[typeId];
    return {
      typeId,
      hp: Math.round(proto.hp * hpMult),
      maxHp: Math.round(proto.hp * hpMult),
      speed: proto.speed,
      reward: proto.reward,
      radius: proto.radius,
      color: proto.color
    };
  });
}

export function startWave(world) {
  if (world.waveActive || world.state !== 'playing') return;
  if (world.wave >= CONFIG.totalWaves) return;
  world.wave++;
  buildWave(world, world.wave);
  world.waveActive = true;
  world.spawnTimer = 0;
  addFloater(world, CONFIG.canvasWidth / 2, CONFIG.hudHeight + 30, `Wave ${world.wave} Commencing!`, PALETTE.gold);
  if (world.sfx && typeof world.sfx.waveStart === 'function') {
    world.sfx.waveStart();
  }
}

export function placeTower(world, col, row) {
  if (world.state !== 'playing') return;
  if (col < 0 || col >= CONFIG.gridCols || row < 0 || row >= CONFIG.gridRows) return;
  
  const tileKey = `${col},${row}`;
  if (world.pathTiles.has(tileKey)) {
    addFloater(world, col * 64 + 32, CONFIG.hudHeight + row * 64 + 32, 'Cannot build on path!', PALETTE.hpRed);
    return;
  }

  const occupied = world.towers.some(t => t.col === col && t.row === row);
  if (occupied) {
    addFloater(world, col * 64 + 32, CONFIG.hudHeight + row * 64 + 32, 'Tile occupied!', PALETTE.hpRed);
    return;
  }

  const towerDef = TOWER_TYPES[world.selectedShopTower];
  if (!towerDef) return;

  if (world.seeds < towerDef.cost) {
    addFloater(world, col * 64 + 32, CONFIG.hudHeight + row * 64 + 32, 'Not enough seeds!', PALETTE.hpRed);
    return;
  }

  world.seeds -= towerDef.cost;
  const x = col * CONFIG.tileSize + CONFIG.tileSize / 2;
  const y = CONFIG.hudHeight + row * CONFIG.tileSize + CONFIG.tileSize / 2;

  world.towers.push({
    id: nextTowerId++,
    typeId: towerDef.id,
    name: towerDef.name,
    col,
    row,
    x,
    y,
    range: towerDef.range,
    damage: towerDef.damage,
    fireRate: towerDef.fireRate,
    projectileSpeed: towerDef.projectileSpeed,
    splashRadius: towerDef.splashRadius || 0,
    slowFactor: towerDef.slowFactor || 1,
    slowDuration: towerDef.slowDuration || 0,
    color: towerDef.color,
    cooldown: 0
  });

  addFloater(world, x, y, `-${towerDef.cost} 🌱`, PALETTE.gold);
  spawnParticles(world, x, y, towerDef.color, 12, 60);
  if (world.sfx && typeof world.sfx.click === 'function') {
    world.sfx.click();
  }
}

export function addFloater(world, x, y, text, color) {
  world.floaters.push({
    x,
    y,
    text,
    color,
    life: 1.0,
    maxLife: 1.0
  });
}

export function spawnParticles(world, x, y, color, count = 8, speed = 80) {
  for (let i = 0; i < count; i++) {
    const angle = world.rng() * Math.PI * 2;
    const spd = speed * (0.3 + world.rng() * 0.7);
    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      color,
      size: 2 + world.rng() * 3,
      life: 0.3 + world.rng() * 0.4,
      maxLife: 0.7
    });
  }
}

export function updateWorld(world, dt) {
  if (world.state !== 'playing') return;

  world.time += dt;

  // 1. Spawning
  if (world.waveActive && world.spawnQueue.length > 0) {
    world.spawnTimer -= dt;
    if (world.spawnTimer <= 0) {
      const proto = world.spawnQueue.shift();
      const startPos = getPathPosition(0);
      world.enemies.push({
        id: nextEnemyId++,
        ...proto,
        x: startPos.x,
        y: startPos.y,
        dist: 0,
        slowTimer: 0,
        slowFactor: 1
      });
      world.spawnTimer = 0.75 + world.rng() * 0.35;
    }
  }

  // Check wave cleared
  if (world.waveActive && world.spawnQueue.length === 0 && world.enemies.length === 0) {
    world.waveActive = false;
    const bonus = 25 + world.wave * 10;
    world.seeds += bonus;
    world.score += bonus * 15;
    addFloater(world, CONFIG.canvasWidth / 2 - 60, CONFIG.hudHeight + 40, `Wave ${world.wave} Cleared! +${bonus} 🌱`, PALETTE.gold);
    
    if (world.wave >= CONFIG.totalWaves) {
      world.state = 'won';
      if (world.sfx && typeof world.sfx.win === 'function') {
        world.sfx.win();
      }
    }
  }

  // 2. Update Enemies
  for (let i = world.enemies.length - 1; i >= 0; i--) {
    const e = world.enemies[i];
    if (e.slowTimer > 0) {
      e.slowTimer -= dt;
    }
    const currentSpeed = e.slowTimer > 0 ? e.speed * e.slowFactor : e.speed;
    e.dist += currentSpeed * dt;

    const pos = getPathPosition(e.dist);
    e.x = pos.x;
    e.y = pos.y;

    if (e.dist >= world.totalPathLength) {
      world.hearts -= 1;
      addFloater(world, e.x, e.y, '-1 ❤️', PALETTE.hpRed);
      world.enemies.splice(i, 1);
      if (world.sfx && typeof world.sfx.leak === 'function') {
        world.sfx.leak();
      }
      if (world.hearts <= 0) {
        world.state = 'lost';
        if (world.sfx && typeof world.sfx.lose === 'function') {
          world.sfx.lose();
        }
      }
    }
  }

  // 3. Update Towers
  for (const t of world.towers) {
    t.cooldown -= dt;
    if (t.cooldown <= 0) {
      let bestTarget = null;
      let maxDist = -1;

      for (const e of world.enemies) {
        const d = Math.hypot(e.x - t.x, e.y - t.y);
        if (d <= t.range) {
          if (e.dist > maxDist) {
            maxDist = e.dist;
            bestTarget = e;
          }
        }
      }

      if (bestTarget) {
        world.projectiles.push({
          id: nextProjectileId++,
          x: t.x,
          y: t.y,
          targetId: bestTarget.id,
          speed: t.projectileSpeed,
          damage: t.damage,
          splashRadius: t.splashRadius,
          slowFactor: t.slowFactor,
          slowDuration: t.slowDuration,
          color: t.color
        });
        t.cooldown = 1 / t.fireRate;
        if (world.sfx && typeof world.sfx.shoot === 'function') {
          world.sfx.shoot(t.typeId);
        }
      }
    }
  }

  // 4. Update Projectiles
  for (let i = world.projectiles.length - 1; i >= 0; i--) {
    const p = world.projectiles[i];
    const target = world.enemies.find(e => e.id === p.targetId);

    if (!target) {
      world.projectiles.splice(i, 1);
      continue;
    }

    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const dist = Math.hypot(dx, dy);
    const step = p.speed * dt;

    if (dist <= step) {
      world.projectiles.splice(i, 1);
      if (world.sfx && typeof world.sfx.hit === 'function') {
        world.sfx.hit();
      }

      const applyHit = (enemy) => {
        enemy.hp -= p.damage;
        spawnParticles(world, enemy.x, enemy.y, p.color, 4, 40);

        if (p.slowFactor < 1) {
          enemy.slowFactor = p.slowFactor;
          enemy.slowTimer = p.slowDuration;
        }

        if (enemy.hp <= 0) {
          world.seeds += enemy.reward;
          world.score += enemy.reward * 10;
          addFloater(world, enemy.x, enemy.y, `+${enemy.reward} 🌱`, PALETTE.gold);
          spawnParticles(world, enemy.x, enemy.y, PALETTE.gold, 10, 70);
          if (world.sfx && typeof world.sfx.kill === 'function') {
            world.sfx.kill();
          }
          if (world.sfx && typeof world.sfx.coin === 'function') {
            world.sfx.coin();
          }
          const idx = world.enemies.indexOf(enemy);
          if (idx !== -1) world.enemies.splice(idx, 1);
        }
      };

      if (p.splashRadius > 0) {
        for (const e of [...world.enemies]) {
          const d = Math.hypot(e.x - target.x, e.y - target.y);
          if (d <= p.splashRadius) {
            applyHit(e);
          }
        }
        spawnParticles(world, target.x, target.y, PALETTE.magenta, 16, 100);
      } else {
        applyHit(target);
      }

    } else {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }
  }

  // 5. Update Particles
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const pt = world.particles[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.life -= dt;
    if (pt.life <= 0) {
      world.particles.splice(i, 1);
    }
  }

  // 6. Update Floaters
  for (let i = world.floaters.length - 1; i >= 0; i--) {
    const f = world.floaters[i];
    f.y -= 25 * dt;
    f.life -= dt;
    if (f.life <= 0) {
      world.floaters.splice(i, 1);
    }
  }
}
