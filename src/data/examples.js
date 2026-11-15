// Example missions: ready-made designs that show, in one click, the different results of the simulator.
// Each destination (Earth, Moon, Mars) has four. The Free mission screen shows the ones of the chosen mission.
// `kind` picks the texts (src/i18n, keys `example.<kind>.*`) and the verdict on the report:
//   balanced (good), tight (risky), heavy / reach / power (bad).
// `expect` is the result the example promises; tests/examples.test.js checks it with the real engine,
// so if numbers in src/data change, the test says which example no longer shows what it should.

const ICONS = { balanced: 'shield', tight: 'dice', heavy: 'rocket', reach: 'rocket', power: 'solar' };

const example = (scenarioId, kind, design, expect) => ({
  id: `${scenarioId.split('-')[0]}-${kind}`,
  kind,
  icon: ICONS[kind],
  scenarioId,
  design,
  expect,
});

// Success on every launch; random events never hurt it (every resource keeps a safe margin).
const ALWAYS_WORKS = { outcome: 'success', alwaysSafe: true };
// No errors, but little margin: the first launch loses to a random event, a later one succeeds.
const RISKY = { outcome: 'failure', laterSuccess: true };
const FAILS_AT = (failedPhase, code) => ({ outcome: 'failure', failedPhase, code });

// The balanced Moon and Mars spacecraft; their "power" and "reach" examples change only one choice.
const DEEP_SPACE = ['hga-antenna', 'solar-panel-m', 'hd-camera', 'thermal-imager', 'imaging-spectrometer', 'radar-sounder'];
const smallPanel = (partIds) => partIds.map((id) => (id === 'solar-panel-m' ? 'solar-panel-s' : id));

const EARTH = ['hga-antenna', 'solar-panel-m', 'thermal-imager', 'imaging-spectrometer', 'radar-sounder', 'laser-altimeter'];
const earth = (partIds, rocketId = 'small-lifter') => ({ partIds, orbitId: 'leo-500', rocketId });
const moon = (partIds, rocketId = 'medium-lifter') => ({ partIds, orbitId: 'moon-orbit', rocketId });
const mars = (partIds, rocketId = 'medium-lifter') => ({ partIds, orbitId: 'mars-orbit', rocketId });

export const examples = Object.freeze([
  example('earth-observation', 'balanced', earth(EARTH), ALWAYS_WORKS),
  example('earth-observation', 'tight', earth(['mga-antenna', 'solar-panel-s', 'context-camera', 'radar-sounder', 'laser-altimeter']), RISKY),
  // The big panel and extra instruments are heavier than the small rocket can carry
  example('earth-observation', 'heavy', earth(['hga-antenna', 'solar-panel-l', 'multispectral-imager', 'imaging-spectrometer', 'radar-sounder', 'magnetometer']), FAILS_AT('launch', 'PAYLOAD_TOO_HEAVY')),
  example('earth-observation', 'power', earth(smallPanel(EARTH)), FAILS_AT('operations', 'POWER_DEFICIT')),

  example('moon-exploration', 'balanced', moon(DEEP_SPACE), ALWAYS_WORKS),
  example('moon-exploration', 'tight', moon(['mga-antenna', 'solar-panel-s', 'thermal-imager', 'radar-sounder', 'laser-altimeter', 'magnetometer']), RISKY),
  example('moon-exploration', 'reach', moon(DEEP_SPACE, 'small-lifter'), FAILS_AT('launch', 'ROCKET_CANNOT_REACH_ORBIT')),
  example('moon-exploration', 'power', moon(smallPanel(DEEP_SPACE)), FAILS_AT('operations', 'POWER_DEFICIT')),

  example('mars-study', 'balanced', mars(DEEP_SPACE), ALWAYS_WORKS),
  example('mars-study', 'tight', mars(['hga-antenna', 'solar-panel-m', 'multispectral-imager', 'thermal-imager', 'imaging-spectrometer', 'gamma-ray-spectrometer']), RISKY),
  example('mars-study', 'reach', mars(DEEP_SPACE, 'small-lifter'), FAILS_AT('launch', 'ROCKET_CANNOT_REACH_ORBIT')),
  example('mars-study', 'power', mars(smallPanel(DEEP_SPACE)), FAILS_AT('operations', 'POWER_DEFICIT')),
]);

/** The example missions of one destination, in display order. */
export const examplesFor = (scenarioId) => examples.filter((item) => item.scenarioId === scenarioId);
