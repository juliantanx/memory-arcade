export const TILE_SIZE = 16;
export const GOAL_X = 2816;
export const FINISH_HOME_X = GOAL_X + 128;
export const FINISH_HOME_DOOR_X = FINISH_HOME_X + 23;
export const OVERWORLD_WIDTH = 3040;
export const UNDERGROUND_WIDTH = 512;
export const FIXED_STEP = 1 / 120;
export const MEMORY_COUNT = 6;
export const DEFAULT_FAILURE_LIMIT = 3;

export const INITIAL_SNAPSHOT = Object.freeze({
  status: 'ready', score: 0, coins: 0, lives: DEFAULT_FAILURE_LIMIT, time: 400,
  progress: 0, world: '1-1', big: false, activeMemory: null,
  memoriesSeen: 0, memoryCount: MEMORY_COUNT, voucherFound: false,
  mysteryFound: false, hiddenRewardsFound: 0, hiddenRewardCount: 2,
});

export function createInputState() {
  return { left: false, right: false, jump: false, run: false, down: false };
}
