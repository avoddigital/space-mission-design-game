// Pure helpers for the 3D flight: which scene to show and how a failure looks.
// No Three.js and no DOM, so they are easy to test. They only read the simulation result.

/** Destination body for an orbit target code. */
export function destinationOf(orbit) {
  return { TLI: 'moon', TMI: 'mars' }[orbit?.target] ?? 'earth';
}

/** How a failed phase looks in 3D. */
export function failureLook(phase) {
  if (!phase || phase.ok !== false) return null;
  const code = phase.issues?.[0]?.code;
  switch (phase.id) {
    case 'launch':
      // A rocket that is too weak flies and explodes; with no rocket or no money it never leaves the pad.
      return code === 'PAYLOAD_TOO_HEAVY' || code === 'ROCKET_CANNOT_REACH_ORBIT' ? 'explode' : 'grounded';
    case 'transfer':
      return 'off-course';
    case 'operations':
      return 'blackout';
    case 'data':
      return 'no-signal';
    default:
      return null;
  }
}

/**
 * Which phase the 3D view plays, following the HTML timeline (the timeline is in charge).
 * @param {object} simulation result of simulateMission
 * @param {number} shown phases already revealed by the timeline
 * @returns {{ index: number, id: string, failure: string|null }}
 */
export function activePhase(simulation, shown) {
  const phases = simulation.phases;
  const failedIndex = phases.findIndex((phase) => phase.ok === false);
  const last = failedIndex === -1 ? phases.length - 1 : failedIndex;
  const index = Math.max(0, Math.min(shown, last));
  // The failure is shown only once the timeline reveals that phase (suspense first, then the problem).
  const revealed = shown > index;
  return { index, id: phases[index].id, failure: revealed ? failureLook(phases[index]) : null };
}

/** Rocket height in scene units: bigger rockets carry more to low Earth orbit. */
export function rocketHeight(rocket) {
  const capacity = Math.max(1, rocket?.payloadKg?.LEO ?? 1);
  return 1 + Math.log10(capacity) / 2.5;
}

/** Orbit ring radius around a planet of radius `planetRadius` (scene units, not kilometers). */
export function orbitRadius(planetRadius, altitudeKm = 500) {
  return planetRadius + 0.35 + Math.min(2.2, Math.log10(Math.max(10, altitudeKm)) / 2.2);
}
