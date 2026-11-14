import { describe, it, expect } from 'vitest';
import { checkLaunch } from '../src/engine/compatibility.js';
import { mediumRocket, leo, gto, mars } from './fixtures.js';

describe('checkLaunch', () => {
  it('accepts a payload well under capacity', () => {
    const result = checkLaunch(mediumRocket, leo, 250);
    expect(result).toMatchObject({ ok: true, capacityKg: 1000, marginKg: 750, issues: [] });
    expect(result.marginRatio).toBeCloseTo(0.75);
  });

  it('accepts a payload exactly at capacity, with a low margin warning', () => {
    const result = checkLaunch(mediumRocket, gto, 400);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([
      { code: 'LOW_MASS_MARGIN', severity: 'warning', marginKg: 0, marginPct: 0 },
    ]);
  });

  it('warns below a 10% margin but not at 10%', () => {
    expect(checkLaunch(mediumRocket, leo, 901).issues[0]?.code).toBe('LOW_MASS_MARGIN');
    expect(checkLaunch(mediumRocket, leo, 900).issues).toEqual([]);
  });

  it('rejects a payload that is too heavy', () => {
    const result = checkLaunch(mediumRocket, gto, 401);
    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([
      { code: 'PAYLOAD_TOO_HEAVY', severity: 'error', excessKg: 1, capacityKg: 400 },
    ]);
  });

  it('rejects an orbit the rocket cannot reach', () => {
    const result = checkLaunch(mediumRocket, mars, 100);
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatchObject({ code: 'ROCKET_CANNOT_REACH_ORBIT', rocketId: 'medium', orbitId: 'mars-orbit' });
  });

  it('treats a rocket without the orbit target as unable to reach it', () => {
    const result = checkLaunch({ id: 'tiny', payloadKg: { LEO: 100 } }, gto, 10);
    expect(result.issues[0].code).toBe('ROCKET_CANNOT_REACH_ORBIT');
  });
});
