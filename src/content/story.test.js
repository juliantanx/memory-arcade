import { describe, expect, it } from 'vitest';
import { FINALE, MEMORIES, PROJECT, REWARDS } from './story.js';

describe('public story configuration', () => {
  it('provides six uniquely identified memory chapters', () => {
    expect(MEMORIES).toHaveLength(6);
    expect(new Set(MEMORIES.map((memory) => memory.id)).size).toBe(MEMORIES.length);
    for (const memory of MEMORIES) {
      expect(memory).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        body: expect.any(String),
        photo: expect.any(String),
        alt: expect.any(String),
      });
    }
  });

  it('keeps all top-level presentation sections configurable', () => {
    expect(PROJECT.title).toBeTruthy();
    expect(FINALE.question).toBeTruthy();
    expect(REWARDS.voucher.revealTitle).toBeTruthy();
    expect(REWARDS.gift.image).toBeTruthy();
  });
});
