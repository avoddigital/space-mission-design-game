import { describe, it, expect } from 'vitest';
import { fillText, formatIssue } from '../src/engine/messages.js';
import { ISSUE_CODES } from '../src/engine/validation.js';

describe('fillText', () => {
  it('replaces placeholders and rounds numbers', () => {
    expect(fillText('Needs {missingW} W, {pct}% left', { missingW: 40, pct: 12.4999 })).toBe('Needs 40 W, 12.5% left');
  });

  it('joins lists and keeps unknown placeholders visible', () => {
    expect(fillText('{list} and {missing}', { list: ['a', 'b'] })).toBe('a, b and {missing}');
  });
});

describe('formatIssue', () => {
  const content = {
    issues: {
      PAYLOAD_TOO_HEAVY: { title: 'Too heavy', text: '{excessKg} kg too heavy for {capacityKg} kg.', tip: 'Tip', learn: 'Learn' },
      ROCKET_CANNOT_REACH_ORBIT: { title: 'Cannot reach', text: '{rocketId} cannot reach {orbitId}.', tip: '', learn: '' },
    },
  };

  it('fills the texts with the issue values', () => {
    const result = formatIssue({ code: 'PAYLOAD_TOO_HEAVY', excessKg: 12.25, capacityKg: 300 }, content);
    expect(result).toEqual({ title: 'Too heavy', text: '12.3 kg too heavy for 300 kg.', tip: 'Tip', learn: 'Learn' });
  });

  it('shows names instead of ids when data is given', () => {
    const data = { rockets: [{ id: 'small', name: 'Small Lifter' }], orbits: [{ id: 'mars-orbit', name: 'Mars Orbit' }] };
    const result = formatIssue({ code: 'ROCKET_CANNOT_REACH_ORBIT', rocketId: 'small', orbitId: 'mars-orbit' }, content, data);
    expect(result.text).toBe('Small Lifter cannot reach Mars Orbit.');
  });

  it('returns a generic text instead of breaking when a code has no text', () => {
    const result = formatIssue({ code: 'NEW_CODE' }, content);
    expect(result.title).toBe('Check your design');
    expect(result.text).toContain('NEW_CODE');
  });
});

// Checks Carlos's content.js against the engine. Skipped until the file exists.
const modules = import.meta.glob('../src/data/content.js', { eager: true });
const realContent = modules['../src/data/content.js']?.content;

// Values each issue code provides (see validation.js and compatibility.js).
const ISSUE_VALUES = {
  NO_ROCKET: [],
  NO_ORBIT: [],
  MISSING_REQUIRED_TYPE: ['type'],
  ORBIT_NOT_ALLOWED: ['orbitId', 'allowedOrbits'],
  ROCKET_CANNOT_REACH_ORBIT: ['rocketId', 'orbitId'],
  PAYLOAD_TOO_HEAVY: ['excessKg', 'capacityKg'],
  LOW_MASS_MARGIN: ['marginKg', 'marginPct'],
  POWER_DEFICIT: ['missingW'],
  OVER_BUDGET: ['excessMUsd'],
  OVER_TIME: ['excessDays'],
  NO_COMMS: [],
  DATA_BACKLOG: ['excessGbPerDay'],
  LOW_SCIENCE: ['scienceValue', 'minScience'],
};

describe.skipIf(!realContent)('content.js issue texts', () => {
  it('ISSUE_VALUES lists every engine code', () => {
    expect(Object.keys(ISSUE_VALUES).sort()).toEqual([...ISSUE_CODES].sort());
  });

  it.each(ISSUE_CODES)('%s has title, text, tip and learn', (code) => {
    const entry = realContent.issues?.[code];
    expect(entry, `content.issues.${code} is missing`).toBeDefined();
    for (const field of ['title', 'text', 'tip', 'learn']) {
      expect(typeof entry[field], `content.issues.${code}.${field}`).toBe('string');
      expect(entry[field].length, `content.issues.${code}.${field} is empty`).toBeGreaterThan(0);
    }
  });

  it.each(ISSUE_CODES)('%s leaves no placeholder unfilled', (code) => {
    const values = Object.fromEntries(ISSUE_VALUES[code].map((name) => [name, 1]));
    const result = formatIssue({ code, ...values }, realContent);
    for (const text of Object.values(result)) {
      expect(text, `content.issues.${code} uses a value the engine does not provide`).not.toMatch(/\{\w+\}/);
    }
  });
});
