// Simplified values, inspired by real rockets. Not exact.
// payloadKg is the mass each rocket can carry to each target. 0 means it cannot reach it.
// Values marked "estimate" are our own approximations, not published figures.
export const rockets = [
  {
    id: 'small-lifter',
    name: 'Small Lifter', // simplified, inspired by Rocket Lab Electron
    description: 'A small, cheap rocket for light satellites in low Earth orbit. It cannot reach high orbits, the Moon or Mars.',
    costMUsd: 7.5,
    payloadKg: { LEO: 300, GTO: 0, TLI: 0, TMI: 0 },
  },
  {
    id: 'medium-lifter',
    name: 'Medium Lifter', // simplified, inspired by Falcon 9 (expendable)
    description: 'A reliable workhorse that can reach every destination in this game. It costs much more than the small rocket.',
    costMUsd: 70,
    payloadKg: { LEO: 22800, GTO: 8300, TLI: 5500, TMI: 4000 }, // TLI is an estimate
  },
  {
    id: 'heavy-lifter',
    name: 'Heavy Lifter', // simplified, inspired by Falcon Heavy (expendable)
    description: 'Carries very heavy spacecraft far away. Usually more rocket than a science mission needs, at a high price.',
    costMUsd: 150,
    payloadKg: { LEO: 63800, GTO: 26700, TLI: 20000, TMI: 16800 }, // TLI is an estimate
  },
  {
    id: 'super-heavy-lifter',
    name: 'Super Heavy Lifter', // simplified, inspired by SLS Block 1
    description: 'The most powerful rocket, built for crewed Moon missions. Far too expensive for a science spacecraft.',
    costMUsd: 2000,
    payloadKg: { LEO: 95000, GTO: 0, TLI: 27000, TMI: 0 }, // GTO and TMI set to 0 for simplicity
  },
];
