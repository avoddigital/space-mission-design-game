import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { buildSpacecraft, instrumentKind, antennaKind, wingSpan } from '../src/view3d/spacecraft.js';
import { parts } from '../src/data/parts.js';

const partGroups = (craft) => craft.children.filter((child) => child.userData.partId !== 'bus');

describe('buildSpacecraft', () => {
  it('always has a body, even with no parts', () => {
    const craft = buildSpacecraft([]);
    expect(craft.children).toHaveLength(1);
    expect(craft.children[0].userData).toEqual({ partId: 'bus', kind: 'body' });
  });

  it('gives every part in the data tables a known shape (no generic boxes)', () => {
    const craft = buildSpacecraft(parts);
    const groups = partGroups(craft);
    expect(groups.map((group) => group.userData.partId)).toEqual(parts.map((part) => part.id));
    for (const group of groups) {
      expect(group.userData.kind, group.userData.partId).not.toBe('generic');
      expect(group.children.length, group.userData.partId).toBeGreaterThan(0);
    }
  });

  it('turns an unknown instrument into a generic box instead of breaking', () => {
    const craft = buildSpacecraft([{ id: 'mystery-sensor', type: 'instrument', massKg: 5 }]);
    expect(partGroups(craft)[0].userData.kind).toBe('generic');
  });

  it('does not break with more instruments than slots', () => {
    const many = Array.from({ length: 14 }, (_, index) => ({ id: `camera-${index}`, type: 'instrument', massKg: 10 }));
    expect(partGroups(buildSpacecraft(many))).toHaveLength(14);
  });
});

describe('shape rules', () => {
  it('picks the instrument family from the id', () => {
    expect(instrumentKind({ id: 'hd-camera' })).toBe('camera');
    expect(instrumentKind({ id: 'multispectral-imager' })).toBe('camera');
    expect(instrumentKind({ id: 'gamma-ray-spectrometer' })).toBe('spectrometer');
    expect(instrumentKind({ id: 'radar-sounder' })).toBe('radar');
    expect(instrumentKind({ id: 'magnetometer' })).toBe('magnetometer');
  });

  it('picks the antenna from its downlink and the wing size from its power', () => {
    expect(antennaKind({ downlinkGbPerDay: 1 })).toBe('whip');
    expect(antennaKind({ downlinkGbPerDay: 20 })).toBe('small-dish');
    expect(antennaKind({ downlinkGbPerDay: 100 })).toBe('big-dish');
    expect(wingSpan({ powerGenW: 800 })).toBeGreaterThan(wingSpan({ powerGenW: 150 }));
  });
});

describe('3D layer is read-only (CLAUDE.md, 3D layer)', () => {
  it('never imports the game state or the UI', () => {
    for (const file of readdirSync('src/view3d').filter((name) => name.endsWith('.js'))) {
      const code = readFileSync(`src/view3d/${file}`, 'utf8');
      expect(code, file).not.toMatch(/from ['"][^'"]*\/(state|ui)\//);
    }
  });

  it('is loaded only on demand, never imported directly by the game', () => {
    const files = ['src/main.js', ...readdirSync('src/ui', { recursive: true }).filter((name) => name.endsWith('.js')).map((name) => `src/ui/${name}`)];
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/^import .*view3d\//m);
    }
  });
});
