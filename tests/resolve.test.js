import { describe, it, expect } from 'vitest';
import { resolveDesign } from '../src/engine/resolve.js';
import { camera, antenna, mediumRocket, leo } from './fixtures.js';

const data = { parts: [camera, antenna], rockets: [mediumRocket], orbits: [leo] };

describe('resolveDesign', () => {
  it('turns ids into data objects', () => {
    const mission = resolveDesign({ partIds: ['camera', 'antenna'], rocketId: 'medium', orbitId: 'leo-500' }, data);
    expect(mission).toEqual({ parts: [camera, antenna], rocket: mediumRocket, orbit: leo });
  });

  it('keeps missing choices as null and parts as an empty list', () => {
    expect(resolveDesign({}, data)).toEqual({ parts: [], rocket: null, orbit: null });
  });

  it('throws on unknown ids, because that is a data bug', () => {
    expect(() => resolveDesign({ partIds: ['laser'] }, data)).toThrow('Unknown part id: laser');
    expect(() => resolveDesign({ rocketId: 'tiny' }, data)).toThrow('Unknown rocket id: tiny');
    expect(() => resolveDesign({ orbitId: 'pluto' }, data)).toThrow('Unknown orbit id: pluto');
  });
});
