import { describe, it, expect } from 'vitest';
import { issueRoute, firstError, redesignStep } from '../src/engine/phases.js';
import { ISSUE_CODES } from '../src/engine/validation.js';

const error = (code, extra = {}) => ({ code, severity: 'error', ...extra });
const warning = (code) => ({ code, severity: 'warning' });

describe('issueRoute', () => {
  it('has a route for every engine issue code', () => {
    for (const code of ISSUE_CODES) {
      const route = issueRoute({ code, type: 'power' });
      expect([1, 2, 3, 4, 5], code).toContain(route.step);
    }
  });

  it('follows PRD table 7.3', () => {
    expect(issueRoute(error('PAYLOAD_TOO_HEAVY'))).toEqual({ phase: 'launch', step: 3 });
    expect(issueRoute(error('OVER_BUDGET'))).toEqual({ phase: 'launch', step: 2 });
    expect(issueRoute(error('ORBIT_NOT_ALLOWED'))).toEqual({ phase: 'transfer', step: 3 });
    expect(issueRoute(error('POWER_DEFICIT'))).toEqual({ phase: 'operations', step: 2 });
    expect(issueRoute(error('OVER_TIME'))).toEqual({ phase: 'operations', step: 3 });
    expect(issueRoute(error('NO_COMMS'))).toEqual({ phase: 'data', step: 2 });
  });

  it('sends a missing antenna to the data phase and other missing parts to operations', () => {
    expect(issueRoute(error('MISSING_REQUIRED_TYPE', { type: 'comms' })).phase).toBe('data');
    expect(issueRoute(error('MISSING_REQUIRED_TYPE', { type: 'power' })).phase).toBe('operations');
  });
});

describe('firstError and redesignStep', () => {
  it('picks the error of the earliest phase, ignoring warnings', () => {
    const issues = [error('NO_COMMS'), warning('LOW_MASS_MARGIN'), error('POWER_DEFICIT'), error('OVER_BUDGET')];
    expect(firstError(issues).code).toBe('OVER_BUDGET');
    expect(redesignStep(issues)).toBe(2);
  });

  it('goes to step 3 for a launch problem', () => {
    expect(redesignStep([error('POWER_DEFICIT'), error('PAYLOAD_TOO_HEAVY')])).toBe(3);
  });

  it('returns no error and step 2 when there are only warnings', () => {
    expect(firstError([warning('DATA_BACKLOG')])).toBeNull();
    expect(redesignStep([warning('DATA_BACKLOG')])).toBe(2);
  });
});
