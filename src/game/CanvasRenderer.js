import { FINISH_HOME_X, GOAL_X } from './constants.js';

const PALETTES = [
  ['#8fd7e8', '#d9f1e9'],
  ['#75c2dc', '#ffe0a3'],
  ['#155b7b', '#0b2944'],
  ['#25365f', '#d76572'],
  ['#bb7c78', '#f2c48f'],
  ['#17253f', '#593c58'],
];

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    this.context = context;
  }

  async load() {
    return Promise.resolve();
  }

  draw(world) {
    const context = this.context;
    const width = world.viewWidth;
    if (this.canvas.width !== width * 2) this.canvas.width = width * 2;
    if (this.canvas.height !== 480) this.canvas.height = 480;
    context.setTransform(2, 0, 0, 2, 0, 0);
    context.imageSmoothingEnabled = false;
    this.drawSky(world, width);
    this.drawScenery(world, width);
    this.drawBlocks(world, width);
    this.drawPipes(world);
    this.drawEntities(world, width);
    if (!world.underground) this.drawFinish(world);
    this.drawPlayer(world);
    this.drawParticles(world);
    if (world.underground) this.drawOceanRoom(world);
  }

  drawSky(world, width) {
    const context = this.context;
    if (world.underground) {
      const gradient = context.createLinearGradient(0, 0, 0, 240);
      gradient.addColorStop(0, '#061a31');
      gradient.addColorStop(1, '#0b3b5a');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, 240);
      return;
    }
    const progress = Math.min(100, Math.max(0, (world.player.x / GOAL_X) * 100));
    const index = Math.min(PALETTES.length - 1, Math.floor(progress / 18));
    const [top, bottom] = PALETTES[index];
    const gradient = context.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, 240);
  }

  drawScenery(world, width) {
    const context = this.context;
    const progress = Math.min(100, Math.max(0, (world.player.x / GOAL_X) * 100));
    if (world.underground) {
      context.fillStyle = '#9ed9dc22';
      for (let i = 0; i < 18; i += 1) {
        const x = (i * 47 - world.camera * 0.25 + world.clock * (i % 3 + 2) * 4) % (width + 30);
        const y = 28 + ((i * 37) % 145);
        context.beginPath();
        context.arc(x, y, 1 + (i % 3), 0, Math.PI * 2);
        context.stroke();
      }
      return;
    }
    context.fillStyle = progress > 52 ? '#fff4dcaa' : '#fff9d9cc';
    context.beginPath();
    context.arc(width - 68, 52, progress > 62 ? 14 : 22, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = progress > 62 ? '#f3b33d' : '#ffffff77';
    for (let i = 0; i < 22; i += 1) {
      const x = ((i * 83 - world.camera * 0.16) % (width + 40)) - 20;
      const y = 24 + ((i * 29) % 120);
      const pulse = 1 + ((Math.floor(world.clock * 5 + i) % 2));
      context.fillRect(Math.round(x), y, pulse, pulse);
    }
    // Layered distant hills become a quiet city toward the end.
    for (let i = -1; i < 9; i += 1) {
      const x = i * 86 - (world.camera * 0.28) % 86;
      context.fillStyle = progress > 62 ? '#20284466' : '#4e8b6655';
      context.beginPath();
      context.arc(x + 42, 191, 42 + (i % 2) * 10, Math.PI, 0);
      context.fill();
    }
    // Champagne-gold and dusty-rose pixel flowers line the path.
    for (let i = -1; i < 15; i += 1) {
      const x = i * 73 - (world.camera * 0.72) % 73;
      context.fillStyle = '#356b52';
      context.fillRect(Math.round(x), 190, 1, 8);
      context.fillStyle = i % 2 ? '#d76572' : '#f3b33d';
      context.fillRect(Math.round(x - 2), 187, 5, 3);
      context.fillRect(Math.round(x - 1), 185, 3, 6);
    }
  }

  drawBlocks(world, width) {
    const context = this.context;
    for (const block of world.blocks) {
      if (block.removed || block.x < world.camera - 16 || block.x > world.camera + width) continue;
      const x = Math.round(block.x - world.camera);
      const y = Math.round(block.y - Math.sin(block.bump * Math.PI) * 5);
      const underground = world.underground;
      const ground = block.type === 'ground';
      context.fillStyle = underground ? (ground ? '#09263f' : '#164c68') : (ground ? '#274d46' : '#fff0cf');
      context.fillRect(x, y, 16, 16);
      context.fillStyle = underground ? '#2b7891' : (ground ? '#4e8b66' : '#d79b67');
      context.fillRect(x, y, 16, 3);
      context.fillRect(x, y, 3, 16);
      context.fillStyle = underground ? '#061a31' : '#173934';
      context.fillRect(x + 13, y + 3, 3, 13);
      context.fillRect(x + 3, y + 13, 10, 3);
      if (block.type === 'question') {
        this.pixelHeart(x + 5, y + 4, block.type === 'used' ? '#9d8e7a' : '#d76572', 1);
      } else if (block.type === 'used') {
        context.fillStyle = '#806f61';
        context.fillRect(x + 6, y + 6, 4, 4);
      } else if (!ground) {
        context.fillStyle = underground ? '#8bcbd0' : '#f3b33d';
        context.fillRect(x + 5, y + 5, 2, 2);
        context.fillRect(x + 10, y + 9, 2, 2);
      }
    }
  }

  drawPipes(world) {
    const context = this.context;
    for (const pipe of world.pipes) {
      const x = Math.round(pipe.x - world.camera);
      context.fillStyle = '#20596b';
      context.fillRect(x + 3, pipe.y, 26, pipe.h);
      context.fillStyle = '#4da0ac';
      context.fillRect(x, pipe.y, 32, 8);
      context.fillRect(x + 7, pipe.y + 8, 4, pipe.h - 8);
      context.fillStyle = '#10182655';
      context.fillRect(x + 25, pipe.y + 8, 4, pipe.h - 8);
    }
  }

  drawEntities(world, width) {
    const context = this.context;
    for (const coin of world.coinsList) {
      if (!coin.collected) this.pixelHeart(coin.x - world.camera + 2, coin.y + Math.sin(world.clock * 5) * 2, '#f3b33d', 2);
    }
    for (const item of world.items) {
      const x = Math.round(item.x - world.camera);
      const y = Math.round(item.y);
      context.fillStyle = '#f8e7c4'; context.fillRect(x + 2, y + 8, 12, 8);
      context.fillStyle = item.kind === 'life' ? '#4da0ac' : '#d76572';
      context.fillRect(x, y + 2, 16, 8); context.fillRect(x + 3, y, 10, 3);
      context.fillStyle = '#fff4dc'; context.fillRect(x + 4, y + 3, 3, 3); context.fillRect(x + 10, y + 4, 2, 2);
    }
    for (const enemy of world.enemies) {
      if (enemy.x < world.camera - 32 || enemy.x > world.camera + width + 32 || enemy.dead > 0.65) continue;
      const x = Math.round(enemy.x - world.camera);
      const y = Math.round(enemy.y + (enemy.dead ? 9 : 0));
      if (enemy.kind === 'shell') {
        context.fillStyle = '#397f51'; context.fillRect(x + 1, y + 5, 14, 10);
        context.fillStyle = '#f3b33d'; context.fillRect(x + 4, y + 7, 8, 5);
      } else if (enemy.kind === 'crawler') {
        context.fillStyle = '#397f51'; context.fillRect(x + 2, y, 11, 20);
        context.fillStyle = '#f3b33d'; context.fillRect(x + 4, y + 3, 7, 7);
        context.fillStyle = '#101826'; context.fillRect(x + (enemy.vx > 0 ? 9 : 4), y + 5, 2, 2);
      } else {
        context.fillStyle = '#6c4734'; context.fillRect(x + 2, y + 3, 11, 10); context.fillRect(x + 4, y, 7, 16);
        context.fillStyle = '#fff4dc'; context.fillRect(x + 4, y + 5, 2, 2); context.fillRect(x + 9, y + 5, 2, 2);
        context.fillStyle = '#101826'; context.fillRect(x + 4, y + 14, 3, 2); context.fillRect(x + 9, y + 14, 3, 2);
      }
    }
  }

  drawFinish(world) {
    const context = this.context;
    const x = GOAL_X - world.camera;
    context.fillStyle = '#fff4dc';
    context.fillRect(x + 5, 42, 3, 166);
    context.fillStyle = '#d76572';
    context.beginPath();
    context.moveTo(x + 8, world.flagY);
    context.lineTo(x - 16, world.flagY + 8);
    context.lineTo(x + 8, world.flagY + 18);
    context.fill();
    this.pixelHeart(x - 7, world.flagY + 6, '#fff4dc', 1);
    this.drawHome(FINISH_HOME_X - world.camera, 146);
  }

  drawHome(x, y) {
    const context = this.context;
    context.fillStyle = '#fff4dc';
    context.fillRect(x, y + 22, 54, 40);
    context.fillStyle = '#d76572';
    context.beginPath();
    context.moveTo(x - 6, y + 23);
    context.lineTo(x + 27, y);
    context.lineTo(x + 60, y + 23);
    context.fill();
    context.fillStyle = '#0b3b5a';
    context.fillRect(x + 23, y + 38, 12, 24);
    context.fillStyle = '#f3b33d';
    context.fillRect(x + 7, y + 34, 9, 9);
    context.fillRect(x + 40, y + 34, 9, 9);
  }

  drawPlayer(world) {
    const player = world.player;
    if (player.invincible > 0 && Math.floor(world.clock * 15) % 2) return;
    const x = Math.round(player.x - world.camera);
    const height = player.big ? 32 : 18;
    const y = Math.round(player.y + player.h - height);
    const context = this.context;
    context.save();
    if (player.facing < 0) { context.translate(x + 12, 0); context.scale(-1, 1); }
    else context.translate(x, 0);
    const stride = player.grounded && Math.abs(player.vx) > 8 ? Math.floor(player.walk) % 2 : 0;
    context.fillStyle = '#1b2432';
    context.fillRect(3, y, 7, player.big ? 5 : 4);
    context.fillRect(2, y + 3, 9, player.big ? 8 : 6);
    context.fillStyle = '#e8b08a';
    context.fillRect(4, y + (player.big ? 6 : 4), 6, player.big ? 7 : 5);
    context.fillStyle = '#101826';
    context.fillRect(5, y + (player.big ? 6 : 4), 6, 2);
    context.fillRect(5, y + (player.big ? 9 : 6), 2, 2);
    if (player.big) {
      context.fillStyle = '#fff4dc'; context.fillRect(2, y + 13, 10, 12);
      context.fillStyle = '#0b3b5a'; context.fillRect(0, y + 14, 3, 10); context.fillRect(11, y + 14, 3, 10);
      context.fillStyle = '#253044'; context.fillRect(2, y + 24, 10, 5);
      context.fillRect(2 + stride, y + 29, 4, 3); context.fillRect(8 - stride, y + 29, 4, 3);
    } else {
      context.fillStyle = '#fff4dc'; context.fillRect(3, y + 9, 8, 6);
      context.fillStyle = '#0b3b5a'; context.fillRect(2, y + 10, 3, 6); context.fillRect(9, y + 10, 3, 6);
      context.fillStyle = '#253044'; context.fillRect(3 + stride, y + 15, 3, 3); context.fillRect(8 - stride, y + 15, 3, 3);
    }
    context.restore();
  }

  drawParticles(world) {
    const context = this.context;
    for (const particle of world.particles) {
      if (particle.kind === 'heart') this.pixelHeart(particle.x - world.camera, particle.y, '#d76572', 2);
      else {
        context.fillStyle = '#fff4dc';
        context.font = '700 7px monospace';
        context.fillText(particle.text || '', particle.x - world.camera, particle.y);
      }
    }
  }

  drawOceanRoom(world) {
    const context = this.context;
    context.fillStyle = '#fff4dc';
    context.font = '700 8px monospace';
    context.fillText('HIDDEN ROOM', 32, 50);
    context.fillStyle = '#9ed9dc';
    context.font = '7px Arial';
    context.fillText('探索完毕后，走到右侧按 ↓ 返回', 32, 65);
    for (let i = 0; i < 4; i += 1) {
      const x = 120 + i * 70;
      const y = 82 + Math.sin(world.clock * 2 + i) * 7;
      context.fillStyle = i % 2 ? '#d7657299' : '#73cbd199';
      context.beginPath();
      context.arc(x, y, 10, Math.PI, 0);
      context.fill();
      context.fillRect(x - 10, y, 20, 4);
      context.strokeStyle = '#fff4dc88';
      for (let j = -6; j <= 6; j += 6) {
        context.beginPath();
        context.moveTo(x + j, y + 4);
        context.lineTo(x + j + Math.sin(world.clock * 4 + j) * 3, y + 16);
        context.stroke();
      }
    }
  }

  pixelHeart(x, y, color, scale = 1) {
    const context = this.context;
    context.fillStyle = color;
    const shape = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
    shape.forEach((row, rowIndex) => {
      [...row].forEach((cell, columnIndex) => {
        if (cell === '1') context.fillRect(Math.round(x + columnIndex * scale), Math.round(y + rowIndex * scale), scale, scale);
      });
    });
  }
}
