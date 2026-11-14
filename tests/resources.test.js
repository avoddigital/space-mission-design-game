import { describe, it, expect } from 'vitest';
import { sumResources } from '../src/engine/resources.js';

describe('sumResources', () => {
  it('returns zeros for an empty list', () => {
    expect(sumResources([])).toEqual({ massKg: 0, powerW: 0, costMUsd: 0, dataGbPerDay: 0 });
  });

  it('adds every resource and treats missing fields as 0', () => {
    const parts = [
      { massKg: 10, powerW: 20, costMUsd: 5, dataGbPerDay: 1 },
      { massKg: 2.5, powerW: 5 },
    ];
    expect(sumResources(parts)).toEqual({ massKg: 12.5, powerW: 25, costMUsd: 5, dataGbPerDay: 1 });
  });
});
