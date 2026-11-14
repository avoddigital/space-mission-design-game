import { describe, it, expect } from 'vitest';
import { mulberry32, hashDesign } from '../src/engine/random.js';

describe('mulberry32', () => {
  it('gives the same numbers for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const listA = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(listA);
    expect(listA.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it('gives different numbers for different seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('hashDesign', () => {
  const design = { partIds: ['a', 'b'], orbitId: 'leo', rocketId: 'small' };

  it('ignores the order in which parts were picked', () => {
    expect(hashDesign({ ...design, partIds: ['b', 'a'] }, 'earth')).toBe(hashDesign(design, 'earth'));
  });

  it('changes when any choice or the scenario changes', () => {
    const base = hashDesign(design, 'earth');
    expect(hashDesign({ ...design, rocketId: 'big' }, 'earth')).not.toBe(base);
    expect(hashDesign({ ...design, partIds: ['a'] }, 'earth')).not.toBe(base);
    expect(hashDesign(design, 'mars')).not.toBe(base);
  });
});
