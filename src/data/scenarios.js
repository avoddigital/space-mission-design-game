// Simplified values. Not exact.
// Budgets, time limits and science goals are game values, tuned for play.
export const scenarios = [
  {
    id: 'earth-observation',
    name: 'Observe Earth', // simplified, inspired by Landsat and GOES
    description: 'Build a satellite that watches Earth change for a whole year. A good first mission: Earth is close, so even a small rocket can do the job.',
    difficulty: 'easy',
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
    description: 'Map the Moon from orbit for a year. You will need a bigger rocket and a careful budget.',
    difficulty: 'medium',
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
    description: 'Study Mars from orbit after a trip of many months. The hardest mission: time, budget and data are all tight.',
    difficulty: 'hard',
    budgetMUsd: 230,
    maxDays: 900,
    operationDays: 540,
    allowedOrbits: ['mars-orbit'],
    requiredTypes: ['instrument', 'power', 'comms'],
    minScience: 20,
  },
];
