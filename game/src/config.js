export const CONFIG = {
  canvasWidth: 960,
  canvasHeight: 640,
  hudHeight: 56,
  gridCols: 12,
  gridRows: 8,
  tileSize: 64,
  shopXStart: 768,
  shopWidth: 192,
  totalWaves: 12,
  startSeeds: 150,
  startHearts: 10,
};

// Grid waypoints winding across the 12x8 garden
// Each waypoint is in grid column and row
export const PATH_WAYPOINTS = [
  { col: 0, row: 1 },
  { col: 3, row: 1 },
  { col: 3, row: 6 },
  { col: 7, row: 6 },
  { col: 7, row: 2 },
  { col: 10, row: 2 },
  { col: 10, row: 5 },
  { col: 11, row: 5 }
];

export const TOWER_TYPES = {
  sun: {
    id: 'sun',
    name: 'Sunflower',
    cost: 50,
    range: 110,
    damage: 6,
    fireRate: 3.0, // attacks per second
    projectileSpeed: 320,
    color: '#ffd700', // gold
    description: 'Rapid golden seed shooter'
  },
  frost: {
    id: 'frost',
    name: 'Frost Fern',
    cost: 75,
    range: 100,
    damage: 3,
    fireRate: 2.0,
    projectileSpeed: 280,
    slowFactor: 0.5,
    slowDuration: 1.2,
    color: '#00ffff', // cyan
    description: 'Chills pests, slowing movement'
  },
  thorn: {
    id: 'thorn',
    name: 'Thorn Cannon',
    cost: 100,
    range: 130,
    damage: 16,
    fireRate: 0.8,
    projectileSpeed: 240,
    splashRadius: 46,
    color: '#ff00ff', // magenta
    description: 'Heavy explosive spike burst'
  }
};

export const ENEMY_TYPES = {
  beetle: {
    id: 'beetle',
    name: 'Glow Beetle',
    hp: 22,
    speed: 42,
    reward: 6,
    radius: 14,
    color: '#8b4513'
  },
  wasp: {
    id: 'wasp',
    name: 'Night Wasp',
    hp: 13,
    speed: 78,
    reward: 8,
    radius: 11,
    color: '#ff4500'
  },
  brute: {
    id: 'brute',
    name: 'Root Brute',
    hp: 95,
    speed: 24,
    reward: 18,
    radius: 20,
    color: '#2e8b57'
  }
};

export const PALETTE = {
  bgDeep: '#08110b',
  bgGarden: '#0f2214',
  gridLine: 'rgba(46, 139, 87, 0.15)',
  pathColor: '#1a3822',
  pathBorder: '#295335',
  hudBg: '#050b07',
  hudBorder: '#1c3822',
  textLight: '#e0ffe8',
  textMuted: '#7ba688',
  gold: '#ffd700',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  hpGreen: '#2ecc71',
  hpRed: '#e74c3c'
};
