import { TILE_SIZE } from './constants.js';

function block(column, row, type = 'brick', content) {
  return { x: column * TILE_SIZE, y: row * TILE_SIZE, type, content, bump: 0 };
}

function enemy(column, kind = 'slime') {
  const isCrawler = kind === 'crawler';
  return { x: column * TILE_SIZE, y: isCrawler ? 186 : 192, w: 14, h: isCrawler ? 22 : 16,
    vx: isCrawler ? -23 : -22, vy: 0, grounded: true, kind, dead: 0, active: false, dir: -1, safe: 0 };
}

// An original level layout designed for this project. It intentionally avoids
// shipping a recreation of a commercial game's stage or art assets.
export function createOverworldLevel() {
  const blocks = []; const pipes = []; const enemies = [];
  const pits = [[34, 35], [71, 73], [119, 120], [150, 152]];
  const isPit = (column) => pits.some(([from, to]) => column >= from && column <= to);

  for (let column = 0; column < 190; column += 1) {
    if (isPit(column)) continue;
    for (let row = 13; row < 15; row += 1) blocks.push(block(column, row, 'ground'));
  }

  const addBlock = (column, row, type = 'brick', content) => blocks.push(block(column, row, type, content));
  const addRow = (from, to, row, questions = [], gaps = []) => {
    for (let column = from; column <= to; column += 1) {
      if (gaps.includes(column)) continue;
      addBlock(column, row, questions.includes(column) ? 'question' : 'brick', questions.includes(column) ? 'coin' : undefined);
    }
  };

  addRow(9, 14, 9, [10, 13]);
  addBlock(18, 8, 'question', 'spark');
  addRow(25, 30, 6, [27]);
  addRow(39, 44, 9, [40, 43]);
  addRow(52, 58, 6, [55]);
  addRow(62, 68, 9, [64], [66, 67]);
  addBlock(75, 8, 'question', 'spark');
  addRow(79, 86, 6, [81, 85]);
  addRow(91, 96, 9, [93]);
  addRow(104, 111, 6, [106, 110]);
  addRow(123, 128, 9, [124, 127]);
  addBlock(139, 7, 'question', 'spark');
  addRow(141, 146, 6, [143]);
  addRow(156, 163, 9, [158, 162], [160, 161]);
  addRow(168, 173, 6, [170]);

  for (const [column, height] of [[21, 2], [47, 3], [66, 2], [99, 4], [133, 3], [160, 2]]) {
    pipes.push({ x: column * TILE_SIZE, y: 208 - height * TILE_SIZE, h: height * TILE_SIZE, secret: false });
  }

  for (let step = 0; step < 4; step += 1) {
    for (let height = 0; height <= step; height += 1) addBlock(113 + step, 12 - height, 'stair');
  }
  for (let step = 0; step < 5; step += 1) {
    for (let height = 0; height <= step; height += 1) addBlock(178 + step, 12 - height, 'stair');
  }

  for (const column of [16, 28, 41, 57, 63, 82, 95, 108, 125, 144, 157, 171]) enemies.push(enemy(column));
  for (const column of [69, 136]) enemies.push(enemy(column, 'crawler'));

  return { blocks, pipes, enemies, items: [], coinsList: [], particles: [] };
}

export function createUndergroundLevel(mysteryIndex = 0, mysteryCollected = false) {
  const blocks = []; const coinsList = [];
  for (let column = 0; column < 32; column += 1) for (let row = 13; row < 15; row += 1) blocks.push(block(column, row, 'ground'));
  for (let row = 0; row < 13; row += 1) blocks.push(block(0, row));
  for (let column = 5; column < 20; column += 1) blocks.push(block(column, 9));
  let index = 0;
  for (let column = 6; column < 20; column += 1) for (const y of [116, 168]) {
    coinsList.push({ x: column * TILE_SIZE, y, collected: false, kind: index === mysteryIndex && !mysteryCollected ? 'mystery' : 'coin' }); index += 1;
  }
  return { blocks, pipes: [{ x: 400, y: 176, h: 32, secret: true }], enemies: [], items: [], coinsList, particles: [] };
}
