import { describe, expect, it } from 'vitest';
import { FINISH_HOME_DOOR_X, FINISH_HOME_X, GOAL_X, TILE_SIZE } from './constants.js';
import { GameWorld } from './GameWorld.js';
import { createOverworldLevel, createUndergroundLevel } from './level.js';

const input = { left: false, right: false, jump: false, run: false, down: false };
const blockFor = (world, reveal) => world.blocks.find((item) => `${item.x}:${item.y}` === reveal.key);

describe('open-source level contract', () => {
  it('keeps the original 190-column layout, hazards, pipes and enemies', () => {
    const level = createOverworldLevel();
    expect(level.pipes).toHaveLength(6);
    expect(level.enemies).toHaveLength(14);
    expect(level.enemies.filter((enemy) => enemy.kind === 'slime')).toHaveLength(12);
    expect(level.enemies.filter((enemy) => enemy.kind === 'crawler')).toHaveLength(2);
    for (const column of [34, 35, 71, 72, 73, 119, 120, 150, 151, 152]) {
      expect(level.blocks.some((item) => item.type === 'ground' && item.x === column * 16)).toBe(false);
    }
    expect(level.blocks.filter((item) => item.content === 'spark').map((item) => item.x / 16)).toEqual([18, 75, 139]);
    expect(GOAL_X).toBe(2816);
  });

  it('keeps 28 room collectibles and exactly one unknown item', () => {
    const room = createUndergroundLevel(17);
    expect(room.enemies).toHaveLength(0);
    expect(room.coinsList).toHaveLength(28);
    expect(room.coinsList.filter((item) => item.kind === 'mystery')).toHaveLength(1);
    expect(room.pipes).toEqual([{ x: 400, y: 176, h: 32, secret: true }]);
  });

  it('keeps every reward block reachable while small', () => {
    const level = createOverworldLevel();
    const rewardBlocks = level.blocks.filter((item) =>
      !['ground', 'stair'].includes(item.type) && item.content !== 'spark'
    );
    expect(rewardBlocks.length).toBeGreaterThan(0);
    expect(rewardBlocks.every((item) => item.y >= 6 * TILE_SIZE)).toBe(true);
  });

  it('leaves enough headroom to jump beneath platforms while powered up', () => {
    const minimumHeadroom = 3 * TILE_SIZE;
    for (const level of [createOverworldLevel(), createUndergroundLevel()]) {
      const floors = [
        ...level.blocks
          .filter((item) => item.type === 'ground' && !level.blocks.some((other) =>
            other.type === 'ground' && other.x === item.x && other.y < item.y
          ))
          .map((item) => ({ x: item.x, y: item.y, w: TILE_SIZE })),
        ...level.pipes.map((item) => ({ x: item.x, y: item.y, w: 2 * TILE_SIZE })),
      ];
      const ceilings = level.blocks.filter((item) => !['ground', 'stair'].includes(item.type));
      for (const floor of floors) for (const ceiling of ceilings) {
        const isWall = ceilings.some((item) =>
          item.x === ceiling.x && item.y + TILE_SIZE === floor.y
        );
        if (isWall) continue;
        const overlaps = floor.x < ceiling.x + TILE_SIZE && floor.x + floor.w > ceiling.x;
        const headroom = floor.y - (ceiling.y + TILE_SIZE);
        if (overlaps && headroom >= 0) expect(headroom).toBeGreaterThanOrEqual(minimumHeadroom);
      }
    }
  });

  it('keeps the finish staircase clear of the house', () => {
    const level = createOverworldLevel();
    const finishStairs = level.blocks.filter((item) => item.type === 'stair' && item.x > GOAL_X);
    const lastStairEdge = Math.max(...finishStairs.map((item) => item.x + TILE_SIZE));
    const roofEdge = FINISH_HOME_X - 6;
    expect(lastStairEdge).toBeLessThanOrEqual(roofEdge);
  });
});

describe('randomized run plan', () => {
  it('places six unique memory fragments and one independent voucher', () => {
    const world = new GameWorld({ random: () => 0.37 });
    expect(world.runPlan.reveals).toHaveLength(7);
    expect(new Set(world.runPlan.reveals.map((item) => item.key)).size).toBe(7);
    expect(world.runPlan.reveals.filter((item) => item.type === 'memory')).toHaveLength(6);
    expect(world.runPlan.reveals.filter((item) => item.type === 'voucher')).toHaveLength(1);
    expect(world.pipes.filter((item) => item.secret)).toHaveLength(1);
  });

  it('rerolls on a new game but not when respawning', () => {
    const first = new GameWorld({ random: () => 0.1 });
    const second = new GameWorld({ random: () => 0.9 });
    expect(second.runPlan.reveals.map((item) => item.key)).not.toEqual(first.runPlan.reveals.map((item) => item.key));
    const before = JSON.stringify(first.runPlan);
    first.start(); first.die(); first.respawn();
    expect(JSON.stringify(first.runPlan)).toBe(before);
  });
});

describe('collection and reveal gates', () => {
  it('does not trigger memories from position and reveals only after a block hit', () => {
    const world = new GameWorld({ random: () => 0.3 });
    const reveal = world.runPlan.reveals.find((item) => item.type === 'memory');
    world.start(); world.player.x = blockFor(world, reveal).x;
    world.step(1 / 120, input);
    expect(world.status).toBe('playing');
    world.hitBlock(blockFor(world, reveal));
    expect(world.snapshot()).toMatchObject({ status: 'memory', activeMemory: reveal.id, memoriesSeen: 1 });
    world.continueReveal();
    expect(world.status).toBe('playing');
  });

  it('preserves collected fragments through a checkpoint respawn', () => {
    const world = new GameWorld({ random: () => 0.4 });
    const reveal = world.runPlan.reveals.find((item) => item.type === 'memory');
    world.start(); world.hitBlock(blockFor(world, reveal)); world.continueReveal();
    world.safeCheckpoint = { x: 880, y: 192 }; world.die(); world.respawn();
    expect(world.player.x).toBe(880);
    expect(world.snapshot().memoriesSeen).toBe(1);
    expect(blockFor(world, reveal).type).toBe('used');
  });

  it('collects the voucher independently without changing fragment count', () => {
    const world = new GameWorld({ random: () => 0.6 });
    const voucher = world.runPlan.reveals.find((item) => item.type === 'voucher');
    world.start(); world.hitBlock(blockFor(world, voucher));
    expect(world.snapshot()).toMatchObject({ status: 'voucher', voucherFound: true, memoriesSeen: 0, hiddenRewardsFound: 1 });
  });

  it('blocks the hidden ending until every fragment is collected', () => {
    const world = new GameWorld();
    world.status = 'results';
    expect(world.assembleFragments()).toBe(false);
    expect(world.status).toBe('results');
  });

  it('opens assembly, finale and celebration in strict order', () => {
    const world = new GameWorld({ random: () => 0.2 }); world.start();
    for (const reveal of world.runPlan.reveals.filter((item) => item.type === 'memory')) {
      world.status = 'playing'; world.hitBlock(blockFor(world, reveal)); world.continueReveal();
    }
    world.status = 'results';
    expect(world.assembleFragments()).toBe(true); expect(world.status).toBe('assembling');
    world.revealFinale(); expect(world.status).toBe('finale');
    world.celebrate(); expect(world.status).toBe('celebrated');
  });
});

describe('finish sequence', () => {
  it('walks the player to the relocated house door', () => {
    const world = new GameWorld();
    world.win();
    world.updateWinning(5);
    expect(world.player.x).toBe(FINISH_HOME_DOOR_X);
    expect(world.status).toBe('results');
  });
});

describe('room, failures and enemy behavior', () => {
  it('returns through the same randomized pipe and prevents re-entry', () => {
    const world = new GameWorld({ random: () => 0.51 }); world.start();
    const entranceIndex = world.runPlan.secretPipeIndex; const entrance = world.pipes[entranceIndex];
    Object.assign(world.player, { x: entrance.x + 10, y: entrance.y - world.player.h, grounded: true });
    expect(world.tryPipe({ ...input, down: true })).toBe(true); expect(world.underground).toBe(true);
    const exit = world.pipes[0]; Object.assign(world.player, { x: exit.x + 10, y: exit.y - world.player.h, grounded: true }); world.pipeCooldown = 0;
    expect(world.tryPipe({ ...input, down: true })).toBe(true); expect(world.underground).toBe(false);
    expect(world.player.x).toBe(entrance.x + 10); expect(world.roomUsed).toBe(true); expect(world.mysteryFound).toBe(false);
    world.pipeCooldown = 0; world.player.grounded = true;
    expect(world.tryPipe({ ...input, down: true })).toBe(false);
  });

  it('collects the room mystery as one hidden reward and unlocks only after yes', () => {
    const world = new GameWorld({ random: () => 0.4 }); world.start(); world.enterRoom(world.runPlan.secretPipeIndex);
    const mystery = world.coinsList.find((item) => item.kind === 'mystery');
    Object.assign(world.player, { x: mystery.x, y: mystery.y }); world.updateCoins();
    expect(world.snapshot()).toMatchObject({ status: 'mystery', mysteryFound: true, hiddenRewardsFound: 1 });
    world.status = 'celebrated'; world.unlockGift(); expect(world.status).toBe('unlocked');
  });

  it('allows three failures by default and keeps the limit configurable', () => {
    const defaults = new GameWorld();
    expect(defaults.snapshot()).toMatchObject({ lives: 3, failureLimit: 3 });
    const world = new GameWorld({ failureLimit: 4 }); world.start();
    for (let count = 0; count < 3; count += 1) { world.die(); world.respawn(); expect(world.status).toBe('playing'); }
    world.die(); world.respawn();
    expect(world.snapshot()).toMatchObject({ status: 'gameover', lives: 0, failureLimit: 4 });
    expect(new GameWorld({ failureLimit: 99 }).failureLimit).toBe(99);
    expect(new GameWorld({ failureLimit: 100 }).failureLimit).toBe(99);
    expect(new GameWorld({ failureLimit: 0 }).failureLimit).toBe(1);
  });

  it('grows the player after collecting a spark', () => {
    const world = new GameWorld(); world.start();
    world.items.push({ x: world.player.x, y: world.player.y, w: 16, h: 16, vx: 0, vy: 0, grounded: false, kind: 'spark', emerge: 0 });
    world.updateItems(0);
    expect(world.player).toMatchObject({ big: true, h: 32, y: 176 });
  });

  it('never records a river edge as a safe respawn point', () => {
    const world = new GameWorld(); world.start();
    Object.assign(world.player, { x: 510, y: 192, grounded: true });
    world.updateSafeCheckpoint();
    expect(world.safeCheckpoint).toEqual({ x: 510, y: 192 });
    Object.assign(world.player, { x: 525, y: 192, grounded: true });
    world.updateSafeCheckpoint();
    expect(world.safeCheckpoint).toEqual({ x: 510, y: 192 });
    world.die(); world.respawn();
    expect(world.player).toMatchObject({ x: 510, y: 192, vx: 0 });
  });

  it('preserves the moving shell collision behavior', () => {
    const world = new GameWorld();
    const shell = world.enemies.find((item) => item.kind === 'crawler'); const target = world.enemies.find((item) => item.kind === 'slime');
    Object.assign(shell, { kind: 'shell', h: 16, vx: 220, active: true, x: 300, y: 192 });
    Object.assign(target, { active: true, x: 306, y: 192 });
    world.resolveEnemyCollisions(1 / 120);
    expect(target.dead).toBeGreaterThan(0);
  });
});
