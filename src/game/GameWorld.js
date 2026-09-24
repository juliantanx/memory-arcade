import { MEMORIES } from '../content/story.js';
import { DEFAULT_FAILURE_LIMIT, GOAL_X, OVERWORLD_WIDTH, UNDERGROUND_WIDTH } from './constants.js';
import { createOverworldLevel, createUndergroundLevel } from './level.js';

function createPlayer(overrides = {}) {
  return { x: 40, y: 192, w: 12, h: 16, vx: 0, vy: 0, grounded: true, big: false,
    facing: 1, invincible: 0, coyote: 0, jumpBuffer: 0, walk: 0, ...overrides };
}

function choose(list, random) {
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}

function createRunPlan(random) {
  const level = createOverworldLevel();
  const eligible = level.blocks.filter((item) => !['ground', 'stair'].includes(item.type) && item.content !== 'spark');
  const ranges = [[8, 31], [38, 59], [61, 87], [90, 112], [122, 147], [155, 174]];
  const selected = ranges.map(([from, to]) => choose(eligible.filter((item) => item.x / 16 >= from && item.x / 16 < to), random));
  const plan = selected.map((item, index) => ({ key: `${item.x}:${item.y}`, type: 'memory', id: MEMORIES[index].id }));
  const remaining = eligible.filter((item) => !plan.some((entry) => entry.key === `${item.x}:${item.y}`));
  const voucher = choose(remaining, random);
  plan.push({ key: `${voucher.x}:${voucher.y}`, type: 'voucher', id: 'hidden-voucher' });
  return {
    reveals: plan,
    secretPipeIndex: Math.floor(random() * level.pipes.length),
    mysteryIndex: Math.floor(random() * 28),
  };
}

export class GameWorld {
  constructor({ random = Math.random, failureLimit = DEFAULT_FAILURE_LIMIT } = {}) {
    this.random = random;
    const requestedLimit = failureLimit === undefined ? DEFAULT_FAILURE_LIMIT : Number(failureLimit);
    this.failureLimit = Math.max(1, Math.min(99, Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_FAILURE_LIMIT));
    this.runPlan = createRunPlan(random);
    this.status = 'ready'; this.score = 0; this.coins = 0; this.lives = this.failureLimit;
    this.time = 400; this.camera = 0; this.viewWidth = 512; this.clock = 0;
    this.underground = false; this.deathTimer = 0; this.winTimer = 0; this.flagY = 48;
    this.previousJump = false; this.pipeCooldown = 0; this.overworld = null;
    this.player = createPlayer(); this.events = []; this.activeMemory = null;
    this.memoryMarkers = MEMORIES.map(({ id }) => ({ id, seen: false }));
    this.voucherFound = false; this.mysteryFound = false; this.roomUsed = false;
    this.entrancePipeIndex = null; this.revealedKeys = new Set();
    this.safeCheckpoint = { x: 40, y: 192 };
    this.loadOverworld();
  }

  loadLevel(level) {
    this.blocks = level.blocks; this.pipes = level.pipes; this.enemies = level.enemies;
    this.items = level.items; this.coinsList = level.coinsList; this.particles = level.particles;
  }

  loadOverworld() {
    const level = createOverworldLevel();
    level.pipes.forEach((pipe, index) => { pipe.secret = index === this.runPlan.secretPipeIndex; });
    for (const item of level.blocks) {
      const key = `${item.x}:${item.y}`;
      const reveal = this.runPlan.reveals.find((entry) => entry.key === key);
      if (reveal) item.reveal = reveal;
      if (this.revealedKeys.has(key)) { item.reveal = undefined; item.type = 'used'; item.content = undefined; }
    }
    this.loadLevel(level);
  }

  snapshot() {
    const memoriesSeen = this.memoryMarkers.filter((item) => item.seen).length;
    return {
      status: this.status, score: this.score, coins: this.coins, lives: this.lives, time: this.time,
      progress: Math.min(100, Math.max(0, ((this.underground ? 912 : this.player.x) / GOAL_X) * 100)),
      world: this.underground ? '1-2' : '1-1', big: this.player.big,
      activeMemory: this.activeMemory, memoriesSeen, memoryCount: MEMORIES.length,
      voucherFound: this.voucherFound, mysteryFound: this.mysteryFound,
      hiddenRewardsFound: Number(this.voucherFound) + Number(this.mysteryFound), hiddenRewardCount: 2,
      roomUsed: this.roomUsed, failureLimit: this.failureLimit,
    };
  }

  start() { this.status = 'playing'; }
  emit(event) { this.events.push(event); }
  consumeEvents() { const events = this.events; this.events = []; return events; }
  continueReveal() {
    if (!['memory', 'voucher', 'mystery'].includes(this.status)) return;
    this.activeMemory = null; this.status = 'playing'; this.previousJump = true;
  }
  assembleFragments() {
    if (this.status !== 'results' || this.memoryMarkers.some((item) => !item.seen)) return false;
    this.status = 'assembling'; this.emit('assemble'); return true;
  }
  revealFinale() { if (this.status === 'assembling') this.status = 'finale'; }
  celebrate() { if (this.status === 'finale') { this.status = 'celebrated'; this.emit('celebrate'); } }
  unlockGift() { if (this.status === 'celebrated' && this.mysteryFound) { this.status = 'unlocked'; this.emit('powerup'); } }

  addScore(points, x = this.player.x, y = this.player.y) {
    this.score += points; this.particles.push({ x, y, vx: 0, vy: -22, life: 0.8, kind: 'text', text: String(points) });
  }
  collectCoin(x, y) { this.coins += 1; this.addScore(200, x, y); this.emit('coin'); }
  nearbySolids(entity) {
    return [...this.blocks.filter((item) => !item.removed && Math.abs(item.x - entity.x) < 64 && Math.abs(item.y - entity.y) < 80)
      .map((item) => ({ x: item.x, y: item.y, w: 16, h: 16, block: item })),
    ...this.pipes.map((pipe) => ({ x: pipe.x, y: pipe.y, w: 32, h: pipe.h }))];
  }
  overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  move(entity, delta, stopOnWall = false) {
    const solids = this.nearbySolids(entity); entity.x += entity.vx * delta; let hitWall = false;
    for (const solid of solids) if (this.overlaps(entity, solid)) {
      if (entity.vx > 0) entity.x = solid.x - entity.w; else if (entity.vx < 0) entity.x = solid.x + solid.w;
      hitWall = true; if (stopOnWall) entity.vx = 0;
    }
    const previousY = entity.y; entity.y += entity.vy * delta; entity.grounded = false; let hitBlock;
    for (const solid of solids) if (this.overlaps(entity, solid)) {
      if (entity.vy >= 0 && previousY + entity.h <= solid.y + 2) {
        entity.y = solid.y - entity.h; entity.vy = 0; entity.grounded = true;
      } else if (entity.vy < 0 && previousY >= solid.y + solid.h - 2) {
        entity.y = solid.y + solid.h; entity.vy = 0; if (stopOnWall && solid.block) hitBlock = solid.block;
      }
    }
    if (hitBlock) this.hitBlock(hitBlock); return hitWall;
  }

  revealBlock(block) {
    if (!block.reveal) return false;
    const reveal = block.reveal; const key = `${block.x}:${block.y}`;
    this.revealedKeys.add(key); block.reveal = undefined; block.type = 'used'; block.content = undefined;
    this.player.vx = 0;
    if (reveal.type === 'memory') {
      const marker = this.memoryMarkers.find((item) => item.id === reveal.id);
      if (!marker.seen) marker.seen = true;
      this.activeMemory = reveal.id; this.status = 'memory'; this.emit('memory');
    } else {
      this.voucherFound = true; this.status = 'voucher'; this.emit('powerup');
    }
    this.addScore(500, block.x, block.y - 16);
    this.particles.push({ x: block.x + 3, y: block.y - 12, vx: 0, vy: -120, life: 0.55, kind: 'heart' });
    return true;
  }

  hitBlock(block) {
    if (block.bump > 0 || ['ground', 'stair', 'used'].includes(block.type)) return;
    block.bump = 1; this.emit('bump');
    for (const enemy of this.enemies) if (enemy.dead === 0 && Math.abs(enemy.x - block.x) < 17 && Math.abs(enemy.y + enemy.h - block.y) < 5) {
      enemy.dead = 0.01; this.addScore(100, enemy.x, enemy.y);
    }
    if (this.revealBlock(block)) return;
    if (block.content) {
      const content = block.content; block.type = 'used'; block.content = undefined;
      if (content === 'coin') {
        this.collectCoin(block.x, block.y - 16);
        this.particles.push({ x: block.x + 2, y: block.y - 12, vx: 0, vy: -130, life: 0.48, kind: 'coin' });
      } else {
        this.items.push({ x: block.x, y: block.y, w: 16, h: 16, vx: 38, vy: 0, grounded: false, kind: content, emerge: 1 }); this.emit('powerup');
      }
    } else if (block.type === 'brick' && this.player.big) {
      block.removed = true; this.addScore(50, block.x, block.y); this.emit('break');
      for (const [vx, vy] of [[-60, -180], [60, -180], [-45, -100], [45, -100]]) this.particles.push({ x: block.x + 4, y: block.y + 4, vx, vy, life: 0.7, kind: 'brick' });
    }
  }

  hurt() {
    if (this.status !== 'playing' || this.player.invincible > 0) return;
    if (this.player.big) { this.player.big = false; this.player.y += 16; this.player.h = 16; this.player.invincible = 2; this.emit('hurt'); }
    else this.die();
  }
  die() {
    if (this.status !== 'playing') return; this.status = 'dying'; this.lives = Math.max(0, this.lives - 1);
    this.deathTimer = 0; this.player.vx = 0; this.player.vy = -245; this.emit('death');
  }
  respawn() {
    if (this.lives <= 0) { this.status = 'gameover'; return; }
    this.underground = false; this.overworld = null; this.loadOverworld();
    this.camera = Math.max(0, this.safeCheckpoint.x - 64);
    this.player = createPlayer({ x: this.safeCheckpoint.x, y: this.safeCheckpoint.y, invincible: 1.6 });
    this.time = 400; this.status = 'playing'; this.previousJump = true;
  }

  enterRoom(pipeIndex) {
    this.entrancePipeIndex = pipeIndex; this.roomUsed = true;
    this.overworld = { blocks: this.blocks, pipes: this.pipes, enemies: this.enemies, items: this.items, coinsList: this.coinsList, particles: this.particles };
    this.underground = true; this.loadLevel(createUndergroundLevel(this.runPlan.mysteryIndex, this.mysteryFound));
    Object.assign(this.player, { x: 40, y: 112, vx: 0, vy: 0 }); this.camera = 0; this.pipeCooldown = 0.8; this.emit('pipe');
  }
  leaveRoom() {
    if (!this.overworld) return; Object.assign(this, this.overworld); this.overworld = null; this.underground = false;
    const pipe = this.pipes[this.entrancePipeIndex];
    Object.assign(this.player, { x: pipe.x + 10, y: pipe.y - this.player.h, vx: 0, vy: 0 });
    this.camera = Math.max(0, this.player.x - this.viewWidth * 0.35);
    this.safeCheckpoint = { x: Math.max(40, pipe.x - 24), y: 192 };
    this.pipeCooldown = 1.5; this.emit('pipe');
  }
  tryPipe(input) {
    if (!input.down || !this.player.grounded || this.pipeCooldown > 0) return false;
    const center = this.player.x + 6;
    const index = this.pipes.findIndex((pipe) => pipe.secret && center >= pipe.x + 7 && center <= pipe.x + 25 && Math.abs(this.player.y + this.player.h - pipe.y) < 2);
    if (index < 0) return false;
    if (this.underground) this.leaveRoom(); else if (!this.roomUsed) this.enterRoom(index); else return false;
    return true;
  }

  win() {
    this.status = 'winning'; this.winTimer = 0; this.player.vx = 0; this.player.x = GOAL_X + 1;
    const points = this.player.y < 65 ? 5000 : this.player.y < 120 ? 2000 : this.player.y < 165 ? 800 : 100;
    this.addScore(points, GOAL_X - 14, this.player.y); this.emit('win');
  }
  updateParticles(delta) {
    for (const item of this.particles) { item.life -= delta; item.x += item.vx * delta; item.y += item.vy * delta; if (['brick', 'coin', 'heart'].includes(item.kind)) item.vy += 450 * delta; }
    this.particles = this.particles.filter((item) => item.life > 0);
  }
  updateDying(delta) { this.deathTimer += delta; if (this.deathTimer > 0.25) { this.player.vy += 650 * delta; this.player.y += this.player.vy * delta; } if (this.deathTimer > 1.9) this.respawn(); }
  updateWinning(delta) {
    this.winTimer += delta; this.flagY = Math.min(176, this.flagY + 65 * delta);
    if (this.winTimer < 2) { this.player.y = Math.min(192 - this.player.h, this.player.y + 85 * delta); this.player.grounded = false; }
    else { this.player.grounded = true; this.player.y = 208 - this.player.h; this.player.x = Math.min(GOAL_X + 112, this.player.x + 55 * delta); this.player.walk += delta * 10; }
    if (this.winTimer >= 4.7) { this.score += Math.ceil(this.time) * 50; this.time = 0; this.status = 'results'; }
  }
  updatePlayer(delta, input) {
    const player = this.player; player.invincible = Math.max(0, player.invincible - delta);
    player.coyote = player.grounded ? 0.085 : Math.max(0, player.coyote - delta);
    player.jumpBuffer = input.jump && !this.previousJump ? 0.11 : Math.max(0, player.jumpBuffer - delta); this.previousJump = input.jump;
    const direction = Number(input.right) - Number(input.left); const maxSpeed = input.run ? 156 : 100;
    if (direction) { player.vx += direction * 680 * delta; player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx)); player.facing = direction; }
    else player.vx = Math.abs(player.vx) < 900 * delta ? 0 : player.vx - Math.sign(player.vx) * 900 * delta;
    if (player.jumpBuffer > 0 && player.coyote > 0) { player.vy = -345; player.grounded = false; player.coyote = 0; player.jumpBuffer = 0; this.emit('jump'); }
    if (!input.jump && player.vy < -145) player.vy = -145;
    player.vy = Math.min(460, player.vy + (player.vy < 0 && input.jump ? 700 : 1000) * delta); player.walk += Math.abs(player.vx) * delta * 0.095;
  }
  updateItems(delta) {
    for (const item of this.items) {
      if (item.emerge > 0) { item.emerge = Math.max(0, item.emerge - delta * 1.4); item.y -= 16 * delta * 1.4; continue; }
      item.vy = Math.min(460, item.vy + 900 * delta); if (this.move(item, delta)) item.vx = -item.vx;
      if (!this.overlaps(this.player, item)) continue; item.y = 500;
      if (item.kind === 'life') { this.lives += 1; this.emit('life'); }
      else if (this.player.big) this.emit('grow');
      else { this.player.big = true; this.player.h = 32; this.player.y -= 16; this.player.invincible = 0.75; this.emit('grow'); }
      this.addScore(1000, this.player.x, this.player.y);
    }
    this.items = this.items.filter((item) => item.y < 280);
  }
  updateCoins() {
    for (const coin of this.coinsList) if (!coin.collected && this.overlaps(this.player, { x: coin.x + 2, y: coin.y, w: 12, h: 16 })) {
      coin.collected = true;
      if (coin.kind === 'mystery') { this.mysteryFound = true; this.status = 'mystery'; this.player.vx = 0; this.addScore(1000, coin.x, coin.y); this.emit('powerup'); }
      else this.collectCoin(coin.x, coin.y);
    }
  }
  updateEnemies(delta, input, previousPlayerBottom) {
    for (const enemy of this.enemies) {
      if (enemy.dead > 0) { enemy.dead += delta; continue; }
      if (enemy.x < this.camera + this.viewWidth + 20) enemy.active = true; if (!enemy.active) continue;
      enemy.safe = Math.max(0, enemy.safe - delta); enemy.vy = Math.min(450, enemy.vy + 900 * delta);
      if (this.move(enemy, delta)) { enemy.vx = -enemy.vx; enemy.dir = -enemy.dir; }
      if (enemy.y > 280) { enemy.dead = 2; continue; }
      if (!this.overlaps(this.player, enemy) || this.player.invincible > 0) continue;
      if (this.player.vy >= 0 && previousPlayerBottom <= enemy.y + 7) {
        this.player.y = enemy.y - this.player.h; this.player.vy = input.jump ? -270 : -190; this.player.grounded = false; this.emit('stomp');
        if (enemy.kind === 'slime') { enemy.dead = 0.01; this.addScore(100, enemy.x, enemy.y); }
        else if (enemy.kind === 'crawler') { enemy.kind = 'shell'; enemy.y += enemy.h - 16; enemy.h = 16; enemy.vx = 0; this.addScore(200, enemy.x, enemy.y); }
        else { enemy.vx = enemy.vx ? 0 : this.player.x < enemy.x ? 220 : -220; enemy.safe = 0.18; }
      } else if (enemy.kind === 'shell' && enemy.vx === 0) { enemy.vx = this.player.x < enemy.x ? 220 : -220; enemy.safe = 0.18; this.emit('stomp'); }
      else if (enemy.safe <= 0) { this.hurt(); if (this.status !== 'playing') break; }
    }
  }
  resolveEnemyCollisions(delta) {
    for (let i = 0; i < this.enemies.length; i += 1) {
      const enemy = this.enemies[i]; if (enemy.dead || !enemy.active) continue;
      for (let j = i + 1; j < this.enemies.length; j += 1) {
        const other = this.enemies[j]; if (other.dead || !other.active || !this.overlaps(enemy, other)) continue;
        if (enemy.kind === 'shell' && enemy.vx) { other.dead = 0.01; this.addScore(200, other.x, other.y); }
        else if (other.kind === 'shell' && other.vx) { enemy.dead = 0.01; this.addScore(200, enemy.x, enemy.y); }
        else { enemy.vx = -enemy.vx; other.vx = -other.vx; enemy.x += enemy.vx * delta; other.x += other.vx * delta; }
      }
    }
  }
  updateSafeCheckpoint() {
    if (this.underground || !this.player.grounded || this.player.x < 40) return;
    const foot = this.player.y + this.player.h;
    if (Math.abs(foot - 208) > 1) return;
    const samples = [
      this.player.x - 16,
      this.player.x + 1,
      this.player.x + this.player.w / 2,
      this.player.x + this.player.w - 1,
      this.player.x + this.player.w + 16,
    ];
    const hasGround = (x) => this.blocks.some((block) =>
      block.type === 'ground' && !block.removed && block.y === 208 && x >= block.x && x < block.x + 16,
    );
    if (!samples.every(hasGround)) return;
    const enemyNear = this.enemies.some((item) => !item.dead && Math.abs(item.x - this.player.x) < 48);
    if (!enemyNear) this.safeCheckpoint = { x: Math.round(this.player.x), y: 192 };
  }
  step(delta, input) {
    if (this.status === 'ready') { this.clock += delta; return; }
    if (['paused', 'gameover', 'results', 'assembling', 'finale', 'celebrated', 'unlocked', 'memory', 'voucher', 'mystery'].includes(this.status)) return;
    this.clock += delta; this.pipeCooldown = Math.max(0, this.pipeCooldown - delta);
    for (const block of this.blocks) block.bump = Math.max(0, block.bump - delta * 6); this.updateParticles(delta);
    if (this.status === 'dying') { this.updateDying(delta); return; }
    if (this.status === 'winning') { this.updateWinning(delta); return; }
    this.time = Math.max(0, this.time - delta * 2.5); if (this.time <= 0) { this.die(); return; }
    this.updatePlayer(delta, input); const previousPlayerBottom = this.player.y + this.player.h; this.move(this.player, delta, true);
    if (this.status !== 'playing') return;
    this.player.x = Math.max(this.camera, this.player.x); if (this.player.x === this.camera && this.player.vx < 0) this.player.vx = 0;
    if (this.player.y > 265) { this.die(); return; }
    if (!this.underground && this.player.x >= GOAL_X - 2) { this.win(); return; }
    if (this.tryPipe(input)) return;
    this.updateItems(delta); this.updateCoins(); if (this.status !== 'playing') return;
    this.updateEnemies(delta, input, previousPlayerBottom); this.resolveEnemyCollisions(delta);
    this.enemies = this.enemies.filter((enemy) => enemy.dead < 1 && enemy.x > this.camera - 80);
    this.updateSafeCheckpoint();
    const width = this.underground ? UNDERGROUND_WIDTH : OVERWORLD_WIDTH;
    this.camera = Math.max(0, Math.min(width - this.viewWidth, Math.max(this.camera, this.player.x - this.viewWidth * 0.35)));
  }
}
