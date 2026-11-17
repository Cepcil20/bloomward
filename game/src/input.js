import { CONFIG, TOWER_TYPES } from './config.js';

export function attachInput(canvas, world, ui, actions) {
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ui.mouseX = x;
    ui.mouseY = y;
    ui.hoverCol = Math.floor(x / CONFIG.tileSize);
    ui.hoverRow = Math.floor((y - CONFIG.hudHeight) / CONFIG.tileSize);
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (world.state === 'title' || world.state === 'won' || world.state === 'lost') {
      if (world.state === 'title') {
        if (actions.onPrimary) actions.onPrimary();
      } else {
        if (actions.onRestart) actions.onRestart();
      }
      return;
    }

    if (world.state === 'playing') {
      // Check shop panel click (x >= CONFIG.shopXStart)
      if (x >= CONFIG.shopXStart) {
        const relY = y - CONFIG.hudHeight - 10;
        const cardHeight = 110;
        let index = 0;
        for (const key of Object.keys(TOWER_TYPES)) {
          const cardY = 20 + index * (cardHeight + 12);
          if (relY >= cardY && relY <= cardY + cardHeight) {
            if (actions.onShopSelect) actions.onShopSelect(key);
            break;
          }
          index++;
        }

        // Start wave button at bottom of shop panel
        const btnY = CONFIG.canvasHeight - 60;
        if (y >= btnY && y <= btnY + 44) {
          if (actions.onPrimary) actions.onPrimary();
        }
        return;
      }

      // Check garden grid click (x < 768, y >= CONFIG.hudHeight)
      if (x < CONFIG.shopXStart && y >= CONFIG.hudHeight) {
        const col = Math.floor(x / CONFIG.tileSize);
        const row = Math.floor((y - CONFIG.hudHeight) / CONFIG.tileSize);
        if (actions.onPlace) actions.onPlace(col, row);
      }
    }
  });

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (world.state === 'title') {
        if (actions.onPrimary) actions.onPrimary();
      } else if (world.state === 'playing') {
        if (actions.onPrimary) actions.onPrimary();
      } else if (world.state === 'won' || world.state === 'lost') {
        if (actions.onRestart) actions.onRestart();
      }
    } else if (e.code === 'Digit1') {
      if (actions.onShopSelect) actions.onShopSelect('sun');
    } else if (e.code === 'Digit2') {
      if (actions.onShopSelect) actions.onShopSelect('frost');
    } else if (e.code === 'Digit3') {
      if (actions.onShopSelect) actions.onShopSelect('thorn');
    } else if (e.code === 'KeyP') {
      if (actions.onPause) actions.onPause();
    } else if (e.code === 'KeyR') {
      if (actions.onRestart) actions.onRestart();
    } else if (e.code === 'KeyM') {
      if (actions.onMute) actions.onMute();
    }
  });
}
