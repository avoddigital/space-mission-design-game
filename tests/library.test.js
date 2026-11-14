import { describe, it, expect } from 'vitest';
import { libraryMissions, libraryTopics, challengeResources, CHECKED_ON } from '../src/data/library.js';
import { content } from '../src/data/content.js';

// The library only shows real, checked facts. These tests guard the rules in src/data/library.js:
// every fact names an official source, and every image comes from the NASA Image and Video Library.

const OFFICIAL_SOURCES = ['nasa.gov', 'spaceappschallenge.org', 'asc-csa.gc.ca'];
const isOfficial = (url) => {
  const { protocol, hostname } = new URL(url);
  return protocol === 'https:' && OFFICIAL_SOURCES.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
};

const entries = [...libraryMissions, ...libraryTopics];

describe('Mission Library data', () => {
  it('has a check date', () => {
    expect(CHECKED_ON).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('gives every fact a text and an official https source', () => {
    for (const entry of entries) {
      expect(entry.facts.length, entry.id).toBeGreaterThan(0);
      for (const fact of entry.facts) {
        expect(fact.text.length, entry.id).toBeGreaterThan(10);
        expect(isOfficial(fact.source), `${entry.id}: ${fact.source}`).toBe(true);
      }
    }
  });

  it('uses only NASA Image Library pictures, with alt text, caption and credit', () => {
    for (const entry of entries.filter((item) => item.image)) {
      const { src, page, alt, caption, credit } = entry.image;
      expect(src, entry.id).toMatch(/^https:\/\/images-assets\.nasa\.gov\/image\/[^/]+\/[^/]+~(small|medium)\.jpg$/);
      expect(page, entry.id).toMatch(/^https:\/\/images\.nasa\.gov\/details\//);
      expect(alt.length, entry.id).toBeGreaterThan(10);
      expect(caption.length, entry.id).toBeGreaterThan(10);
      expect(credit, entry.id).toMatch(/NASA/);
    }
  });

  it('has unique ids', () => {
    const ids = entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every real mission shown in the game reports', () => {
    const shown = Object.values(content.scenarios).flatMap((scenario) => scenario.realMissions ?? []);
    for (const mission of shown) {
      const match = libraryMissions.find((item) => item.url === mission.url);
      expect(match, mission.name).toBeDefined();
    }
  });

  it('links every mission to its NASA mission page', () => {
    for (const mission of libraryMissions) {
      expect(mission.url).toMatch(/^https:\/\/science\.nasa\.gov\/mission\//);
      expect(['Earth', 'Moon', 'Mars']).toContain(mission.target);
    }
  });

  it('lists the challenge resources with official links', () => {
    expect(challengeResources).toHaveLength(8);
    for (const item of challengeResources) {
      expect(isOfficial(item.url) || item.url.startsWith('https://nasa.github.io/'), item.url).toBe(true);
    }
  });
});
