// Simplified values. Not exact.
// Budgets, time limits and science goals are game values, tuned for play.
export const scenarios = [
  {
    id: 'earth-observation',
    name: 'Observe Earth', // simplified, inspired by Landsat and GOES
    budgetMUsd: 150,
    maxDays: 400,
    operationDays: 365,
    allowedOrbits: ['leo-500', 'sso-700', 'geo'],
    requiredTypes: ['instrument', 'power', 'comms'],
    minScience: 12,
  },
  {
    id: 'moon-exploration',
    name: 'Explore the Moon', // simplified, inspired by LRO
    budgetMUsd: 220,
    maxDays: 450,
    operationDays: 365,
    allowedOrbits: ['moon-orbit'],
    requiredTypes: ['instrument', 'power', 'comms'],
    minScience: 15,
  },
  {
    id: 'mars-study',
    name: 'Study Mars', // simplified, inspired by MRO and Mars Odyssey
    budgetMUsd: 230,
    maxDays: 900,
    operationDays: 540,
    allowedOrbits: ['mars-orbit'],
    requiredTypes: ['instrument', 'power', 'comms'],
    minScience: 20,
  },
];
