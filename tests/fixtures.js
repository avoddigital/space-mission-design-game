// Small made-up data for engine tests. Same format as Carlos.md, round numbers on purpose.
// Bus adds 100 kg, 30 W and 25 MUSD to every mission.

export const camera = {
  id: 'camera', type: 'instrument', massKg: 50, powerW: 60, costMUsd: 20, dataGbPerDay: 40, scienceValue: 6,
};
export const spectrometer = {
  id: 'spectrometer', type: 'instrument', massKg: 40, powerW: 50, costMUsd: 30, dataGbPerDay: 20, scienceValue: 8,
};
export const solarPanel = {
  id: 'solar', type: 'power', massKg: 30, powerW: 0, powerGenW: 300, costMUsd: 10, dataGbPerDay: 0, scienceValue: 0,
};
export const antenna = {
  id: 'antenna', type: 'comms', massKg: 30, powerW: 40, costMUsd: 15, dataGbPerDay: 0, downlinkGbPerDay: 100, scienceValue: 0,
};

export const mediumRocket = {
  id: 'medium', costMUsd: 50, payloadKg: { LEO: 1000, GTO: 400, TLI: 0, TMI: 0 },
};

export const leo = { id: 'leo-500', target: 'LEO', altitudeKm: 500, transferDays: 0 };
export const gto = { id: 'gto', target: 'GTO', altitudeKm: 35786, transferDays: 5 };
export const mars = { id: 'mars-orbit', target: 'TMI', altitudeKm: 400, transferDays: 210 };

export const earthScenario = {
  id: 'earth',
  budgetMUsd: 300,
  maxDays: 400,
  operationDays: 365,
  allowedOrbits: ['leo-500', 'gto'],
  requiredTypes: ['instrument', 'power', 'comms'],
  minScience: 7,
};

/**
 * A valid mission: mass 100+50+40+30+30 = 250 kg (LEO capacity 1000),
 * power 30+60+50+40 = 180 W of 300 W, cost 25+20+30+10+15+50 = 150 of 300,
 * data 60 of 100 GB/day, science 14 = 2x minimum, 365 of 400 days.
 */
export function goodMission(overrides = {}) {
  return {
    parts: [camera, spectrometer, solarPanel, antenna],
    rocket: mediumRocket,
    orbit: leo,
    ...overrides,
  };
}
