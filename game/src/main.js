import { createWorld, updateWorld, placeTower, startWave } from './world.js';
import { renderGame } from './render.js';
import { attachInput } from './input.js';
import { createAudio } from './audio.js';
import { setupShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const urlParams = new URLSearchParams(window.location.search);
const seedParam = urlParams.get('seed');
const seed = seedParam !== null ? parseInt(seedParam, 10) : Math.floor(Math.random() * 100000);

let world = createWorld(isNaN(seed) ? 42 : seed);
const audio = createAudio();
world.sfx = audio;

const ui = {
  hoverCol: -1,
  hoverRow: -1,
  mouseX: 0,
  mouseY: 0
};

let paused = false;
let lastTime = performance.now();

const actions = {
  onPlace(col, row) {
    placeTower(world, col, row);
  },
  onShopSelect(kind) {
    if (world.state === 'playing') {
      world.selectedShopTower = kind;
      if (world.sfx && world.sfx.click) world.sfx.click();
    }
  },
  onPrimary() {
    if (world.state === 'title') {
      world.state = 'playing';
      if (world.sfx && world.sfx.click) world.sfx.click();
    } else if (world.state === 'playing') {
      startWave(world);
    } else if (world.state === 'won' || world.state === 'lost') {
      actions.onRestart();
    }
  },
  onPause() {
    paused = !paused;
  },
  onRestart() {
    const newSeed = Math.floor(Math.random() * 100000);
    world = createWorld(newSeed);
    world.sfx = audio;
    world.state = 'playing';
    if (world.sfx && world.sfx.click) world.sfx.click();
  },
  onMute() {
    audio.toggleMute();
  }
};

attachInput(canvas, world, ui, actions);

const shotParam = urlParams.get('shot');
if (shotParam) {
  setupShot(world, urlParams);
  renderGame(ctx, world, ui);
} else {
  function gameLoop(timestamp) {
    const dt = Math.min(0.1, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    if (!paused) {
      updateWorld(world, dt);
    }

    renderGame(ctx, world, ui);
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}
