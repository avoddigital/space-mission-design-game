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

describe('rockets and launch pad', async () => {
  const { createRocket, rocketStyle } = await import('../src/view3d/rocket.js');
  const { createLaunchPad } = await import('../src/view3d/launchPad.js');
  const { rockets } = await import('../src/data/rockets.js');

  it('gives each rocket in the data its own silhouette', () => {
    expect(rockets.map(rocketStyle)).toEqual(['small', 'medium', 'heavy', 'super-heavy']);
    expect(rocketStyle({ id: 'new-rocket', payloadKg: { LEO: 50000 } })).toBe('heavy');
  });

  it('builds every rocket with a flame and sizes the pad can use', () => {
    for (const rocket of rockets) {
      const built = createRocket(rocket);
      const { flame, height, radius, width, disposables } = built.userData;
      expect(flame.visible, rocket.id).toBe(false);
      expect(height).toBeGreaterThan(0);
      expect(width).toBeGreaterThanOrEqual(radius);
      expect(disposables.length).toBeGreaterThan(0);
    }
  });

  it('builds a pad with swing arms for any rocket size', () => {
    for (const rocket of rockets) {
      const pad = createLaunchPad(createRocket(rocket).userData);
      expect(pad.userData.arms).toHaveLength(3);
      expect(pad.userData.ground).toBeLessThan(0);
    }
  });
});

describe('launch explosion', async () => {
  const THREE = await import('three');
  const { createExplosion } = await import('../src/view3d/explosion.js');

  it('stays hidden until set off, shakes at the blast and calms down after', () => {
    const blast = createExplosion({ size: 2.5, groundY: -0.7 });
    expect(blast.group.visible).toBe(false);
    expect(blast.update(0.1)).toBe(0);
    blast.start(new THREE.Vector3(0, 2, 0));
    expect(blast.group.visible).toBe(true);
    expect(blast.update(0.05)).toBeGreaterThan(0.5);
    for (let step = 0; step < 60; step += 1) blast.update(0.05);
    expect(blast.update(0.05)).toBe(0);
    expect(blast.disposables.length).toBeGreaterThan(0);
  });
});

describe('agency home on the globe', async () => {
  const { PLACES, surfacePoint, turnToFace } = await import('../src/view3d/places.js');
  const { countries } = await import('../src/data/campaign.js');

  it('has a place for every agency country', () => {
    expect(Object.keys(PLACES).sort()).toEqual(countries.map((country) => country.id).sort());
  });

  it('puts latitude and longitude where the Earth map has them', () => {
    // North pole on top (+y); the equator is a circle of radius 1 around it
    expect(surfacePoint(90, 0).y).toBeCloseTo(1);
    const greenwich = surfacePoint(0, 0);
    expect(greenwich.y).toBeCloseTo(0);
    expect(Math.hypot(greenwich.x, greenwich.z)).toBeCloseTo(1);
    // Turning by turnToFace brings the point to the camera side (+z)
    for (const { lat, lon } of Object.values(PLACES)) {
      const point = surfacePoint(lat, lon);
      const turn = turnToFace(lat, lon);
      const z = -point.x * Math.sin(turn) + point.z * Math.cos(turn);
      expect(z).toBeGreaterThan(0);
    }
  });
});

describe('event effects', async () => {
  const { events } = await import('../src/data/events.js');
  const code = (await import('node:fs')).readFileSync('src/view3d/eventEffects.js', 'utf8');

  it('has its own effect for every special event, and a badge for the rest', () => {
    const special = ['solar-storm', 'lunar-eclipse', 'mars-dust-storm', 'ground-station-outage', 'solar-conjunction'];
    for (const id of special) expect(code, id).toContain(`case '${id}'`);
    for (const { id } of events.filter((event) => !special.includes(event.id))) expect(code, id).toContain(`'${id}'`);
  });
});
