import { CONFIG, TOWER_TYPES, PALETTE, PATH_WAYPOINTS } from './config.js';

export function renderHUD(ctx, world) {
  // Top HUD bar (0 to hudHeight)
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.hudHeight);

  ctx.strokeStyle = PALETTE.hudBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, CONFIG.hudHeight);
  ctx.lineTo(CONFIG.canvasWidth, CONFIG.hudHeight);
  ctx.stroke();

  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = PALETTE.textLight;

  // Seeds
  ctx.fillText(`🌱 Seeds: ${world.seeds}`, 24, 34);

  // Hearts
  ctx.fillStyle = PALETTE.hpRed;
  ctx.fillText(`❤️ Hearts: ${world.hearts}`, 180, 34);

  // Wave
  ctx.fillStyle = PALETTE.textLight;
  ctx.fillText(`🌊 Wave: ${world.wave} / ${CONFIG.totalWaves}`, 340, 34);

  // Score
  ctx.fillText(`⭐ Score: ${world.score}`, 520, 34);
}

export function renderGarden(ctx, world) {
  // Garden background
  ctx.fillStyle = PALETTE.bgGarden;
  ctx.fillRect(0, CONFIG.hudHeight, CONFIG.shopXStart, CONFIG.canvasHeight - CONFIG.hudHeight);

  // Grid lines
  ctx.strokeStyle = PALETTE.gridLine;
  ctx.lineWidth = 1;
  for (let c = 0; c <= CONFIG.gridCols; c++) {
    const x = c * CONFIG.tileSize;
    ctx.beginPath();
    ctx.moveTo(x, CONFIG.hudHeight);
    ctx.lineTo(x, CONFIG.canvasHeight);
    ctx.stroke();
  }
  for (let r = 0; r <= CONFIG.gridRows; r++) {
    const y = CONFIG.hudHeight + r * CONFIG.tileSize;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CONFIG.shopXStart, y);
    ctx.stroke();
  }

  // Render Path
  const points = PATH_WAYPOINTS.map(wp => ({
    x: wp.col * CONFIG.tileSize + CONFIG.tileSize / 2,
    y: CONFIG.hudHeight + wp.row * CONFIG.tileSize + CONFIG.tileSize / 2
  }));

  ctx.strokeStyle = PALETTE.pathBorder;
  ctx.lineWidth = 42;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  ctx.strokeStyle = PALETTE.pathColor;
  ctx.lineWidth = 34;
  ctx.stroke();
}

export function renderShop(ctx, world) {
  // Shop panel background
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(CONFIG.shopXStart, CONFIG.hudHeight, CONFIG.shopWidth, CONFIG.canvasHeight - CONFIG.hudHeight);

  ctx.strokeStyle = PALETTE.hudBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CONFIG.shopXStart, CONFIG.hudHeight);
  ctx.lineTo(CONFIG.shopXStart, CONFIG.canvasHeight);
  ctx.stroke();

  // Shop title
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText('NURSERY SHOP', CONFIG.shopXStart + 24, CONFIG.hudHeight + 30);

  let index = 0;
  const cardHeight = 110;
  for (const [key, t] of Object.entries(TOWER_TYPES)) {
    const cardY = CONFIG.hudHeight + 45 + index * (cardHeight + 12);
    const isSelected = world.selectedShopTower === key;

    // Card background
    ctx.fillStyle = isSelected ? 'rgba(46, 139, 87, 0.3)' : 'rgba(15, 34, 20, 0.8)';
    ctx.strokeStyle = isSelected ? t.color : PALETTE.hudBorder;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.fillRect(CONFIG.shopXStart + 12, cardY, CONFIG.shopWidth - 24, cardHeight);
    ctx.strokeRect(CONFIG.shopXStart + 12, cardY, CONFIG.shopWidth - 24, cardHeight);

    // Tower icon / circle
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(CONFIG.shopXStart + 36, cardY + 36, 16, 0, Math.PI * 2);
    ctx.fill();

    // Tower Name & Cost
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = PALETTE.textLight;
    ctx.fillText(t.name, CONFIG.shopXStart + 64, cardY + 28);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(`Cost: ${t.cost} 🌱`, CONFIG.shopXStart + 64, cardY + 48);

    ctx.fillStyle = PALETTE.textMuted;
    ctx.font = '10px sans-serif';
    ctx.fillText(`Rng: ${t.range} | Dmg: ${t.damage}`, CONFIG.shopXStart + 22, cardY + 76);
    ctx.fillText(`Rate: ${t.fireRate}/s`, CONFIG.shopXStart + 22, cardY + 92);

    index++;
  }

  // Start Wave Button
  const btnX = CONFIG.shopXStart + 16;
  const btnY = CONFIG.canvasHeight - 60;
  const btnW = CONFIG.shopWidth - 32;
  const btnH = 44;

  ctx.fillStyle = world.waveActive ? '#2c3e50' : '#27ae60';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX, btnY, btnW, btnH);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(world.waveActive ? 'WAVE ACTIVE...' : 'START WAVE', btnX + btnW / 2, btnY + 27);
  ctx.textAlign = 'left';
}

export function renderTowers(ctx, world, ui) {
  const mouseX = ui ? ui.mouseX : 0;
  const mouseY = ui ? ui.mouseY : 0;

  for (const t of world.towers) {
    // Tower base
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner symbol
    ctx.fillStyle = '#08110b';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // If mouse is hovering over this tower, show range indicator
    const d = Math.hypot(mouseX - t.x, mouseY - t.y);
    if (d <= 30) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Placement range preview if hovering over grid
  if (mouseX < CONFIG.shopXStart && mouseY >= CONFIG.hudHeight && world.state === 'playing') {
    const col = Math.floor(mouseX / CONFIG.tileSize);
    const row = Math.floor((mouseY - CONFIG.hudHeight) / CONFIG.tileSize);
    const tileKey = `${col},${row}`;
    const x = col * CONFIG.tileSize + CONFIG.tileSize / 2;
    const y = CONFIG.hudHeight + row * CONFIG.tileSize + CONFIG.tileSize / 2;

    const towerDef = TOWER_TYPES[world.selectedShopTower];
    const isPath = world.pathTiles.has(tileKey);
    const occupied = world.towers.some(t => t.col === col && t.row === row);

    ctx.strokeStyle = (isPath || occupied) ? PALETTE.hpRed : (towerDef ? towerDef.color : PALETTE.gold);
    ctx.lineWidth = 2;
    ctx.fillStyle = (isPath || occupied) ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 139, 87, 0.2)';
    ctx.fillRect(col * CONFIG.tileSize, CONFIG.hudHeight + row * CONFIG.tileSize, CONFIG.tileSize, CONFIG.tileSize);
    ctx.strokeRect(col * CONFIG.tileSize, CONFIG.hudHeight + row * CONFIG.tileSize, CONFIG.tileSize, CONFIG.tileSize);

    if (!isPath && !occupied && towerDef) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(x, y, towerDef.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

export function renderEnemies(ctx, world) {
  for (const e of world.enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);

    // Enemy body
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (e.slowTimer > 0) {
      ctx.strokeStyle = PALETTE.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Health bar
    const barW = 28;
    const barH = 4;
    const hpPct = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-barW / 2, -e.radius - 10, barW, barH);
    ctx.fillStyle = hpPct > 0.5 ? PALETTE.hpGreen : PALETTE.hpRed;
    ctx.fillRect(-barW / 2, -e.radius - 10, barW * hpPct, barH);

    ctx.restore();
  }
}

export function renderProjectiles(ctx, world) {
  for (const p of world.projectiles) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.splashRadius > 0 ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function renderParticles(ctx, world) {
  for (const pt of world.particles) {
    ctx.fillStyle = pt.color;
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

export function renderFloaters(ctx, world) {
  ctx.font = 'bold 14px sans-serif';
  for (const f of world.floaters) {
    ctx.fillStyle = f.color;
    ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
    ctx.fillText(f.text, f.x - 20, f.y);
  }
  ctx.globalAlpha = 1.0;
}

export function renderOverlays(ctx, world) {
  if (world.state === 'title') {
    ctx.fillStyle = 'rgba(8, 17, 11, 0.88)';
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    ctx.textAlign = 'center';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText('BLOOMWARD', CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 - 60);

    ctx.font = '22px sans-serif';
    ctx.fillStyle = PALETTE.textLight;
    ctx.fillText('Night Garden Defense', CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 - 20);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = PALETTE.textMuted;
    ctx.fillText('Protect the glowing nocturnal blooms from invading pests.', CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 + 24);

    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Click anywhere or press Space to Start', CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 + 90);
    ctx.textAlign = 'left';
  } else if (world.state === 'won') {
    ctx.fillStyle = 'rgba(8, 17, 11, 0.9)';
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    ctx.textAlign = 'center';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText('VICTORY! GARDEN SAVED!', CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 - 40);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = PALETTE.textLight;
    ctx.fillText(`Final Score: ${world.score}`, CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 + 10);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = PALETTE.textMuted;
    ctx.fillText('Click or press Space to Play Again', CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 + 60);
    ctx.textAlign = 'left';
  } else if (world.state === 'lost') {
    ctx.fillStyle = 'rgba(8, 17, 11, 0.9)';
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    ctx.textAlign = 'center';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = PALETTE.hpRed;
    ctx.fillText('GARDEN OVERRUN', CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 - 40);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = PALETTE.textLight;
    ctx.fillText(`Score Reached: ${world.score} (Wave ${world.wave})`, CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 + 10);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = PALETTE.textMuted;
    ctx.fillText('Click or press Space to Try Again', CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 + 60);
    ctx.textAlign = 'left';
  }
}

export function renderGame(ctx, world, ui) {
  ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
  renderGarden(ctx, world);
  renderTowers(ctx, world, ui);
  renderEnemies(ctx, world);
  renderProjectiles(ctx, world);
  renderParticles(ctx, world);
  renderFloaters(ctx, world);
  renderHUD(ctx, world);
  renderShop(ctx, world);
  renderOverlays(ctx, world);
}
