import { contentAsset } from './assets.js';

// This is the only file most people need to edit. Keep real names, dates and
// private photos out of Git history until you are certain the repository is private.
export const PROJECT = Object.freeze({
  title: '拾光冒险',
  subtitle: 'MEMORY ARCADE',
  mark: 'MA',
  edition: 'COMMUNITY EDITION',
  eyebrow: 'PLAYABLE MEMORY ALBUM',
  sinceLabel: 'YOUR STORY',
  since: '20XX.MM.DD',
  introLeft: 'YOU',
  introMiddle: '遇见',
  introRight: 'ME',
  stageLabel: 'MEMORY ARCADE · STAGE 01',
  footer: '一本还没写完的回忆相册，等待玩家继续探索。',
  footerCode: 'MEMORY ARCHIVE · ROLL 01',
});

export const MEMORIES = Object.freeze([
  {
    id: 'first-page', chapter: '01 / 故事开始', date: 'A DAY TO REMEMBER',
    title: '在这里写下第一段回忆',
    body: '用一两句具体的细节，记录一个对你们重要的瞬间。可以是一次出发，也可以是一个普通的下午。',
    photo: contentAsset('memory-01.svg'), alt: '第一段回忆的占位图', accent: 'rose',
  },
  {
    id: 'small-things', chapter: '02 / 闪光小事', date: 'THE LITTLE THINGS',
    title: '值得记住的，往往是小事',
    body: '换成你自己的文字：一顿饭、一首歌、一句对话，或一次没有计划却意外开心的散步。',
    photo: contentAsset('memory-02.svg'), alt: '第二段回忆的占位图', accent: 'gold',
  },
  {
    id: 'blue-hour', chapter: '03 / 蓝色时刻', date: 'TAKE YOUR TIME',
    title: '有些时刻，时间不用着急',
    body: '这里可以放一段共同旅行、兴趣或成长的记忆。越具体的场景，越能让故事变得真实。',
    photo: contentAsset('memory-03.svg'), alt: '第三段回忆的占位图', accent: 'ocean',
  },
  {
    id: 'unexpected', chapter: '04 / 计划之外', date: 'A HAPPY ACCIDENT',
    title: '意外的路，也会通向好风景',
    body: '记录一个意外发生、后来反而很珍贵的故事。当时的天气、声音或一句话，都很适合写进来。',
    photo: contentAsset('memory-04.svg'), alt: '第四段回忆的占位图', accent: 'gold',
  },
  {
    id: 'ordinary-days', chapter: '05 / 普通日子', date: 'EVERY LITTLE DAY',
    title: '普通的一天，也可以很值得',
    body: '把最日常的一页放在这里。没有大事发生也没关系，共同度过的时间本身就是故事。',
    photo: contentAsset('memory-05.svg'), alt: '第五段回忆的占位图', accent: 'rose',
  },
  {
    id: 'next-level', chapter: '06 / 下一关', date: 'TO BE CONTINUED',
    title: '故事还在继续',
    body: '最后一页可以展望未来，也可以回望一路的成长。这是游戏的终点，但不必是故事的终点。',
    photo: contentAsset('memory-06.svg'), alt: '第六段回忆的占位图', accent: 'green',
  },
]);

export const FINALE = Object.freeze({
  illustration: contentAsset('finale.svg'),
  illustrationAlt: '两位像素玩家的占位插画',
  kicker: 'TO MY FAVORITE PLAYER',
  title: '终点不是结束，是新的开始。',
  letter: [
    '在这里写下你想说的第一句话。',
    '可以回顾一路的故事，也可以说说对未来的期待。',
    '删掉这些示例文字，让这一页真正属于你。',
  ],
  prompt: '最后，我想认真地问你：',
  question: '愿意和我一起\n开启下一关吗？',
  cue: '答案由你决定。',
  acceptLabel: '一起出发',
  players: 'PLAYER 1 ♥ PLAYER 2',
  acceptedText: '新的故事，从今天继续。',
});

export const REWARDS = Object.freeze({
  voucher: {
    code: 'NO. YOUR-STORY-01',
    title: '隐藏代金券',
    revealTitle: '一张特别体验券',
    description: '把这里替换成你准备的惊喜，例如旅行、晚餐或共同完成的小心愿。',
  },
  gift: {
    label: 'HIDDEN REWARD',
    title: '一份留给未来的礼物',
    description: '你可以完全删除这项奖励，或替换成自己准备的内容。',
    image: contentAsset('reward.svg'),
    imageAlt: '隐藏奖励占位图',
    details: ['YOUR MESSAGE', '20XX.MM.DD'],
  },
});

export function getMemory(id) {
  return MEMORIES.find((memory) => memory.id === id);
}
