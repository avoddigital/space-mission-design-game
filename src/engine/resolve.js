// Turns the player's choices (ids) into the data objects the engine works with.
// Pure function, no DOM.

function findById(list, id, label) {
  const item = list.find((entry) => entry.id === id);
  // An unknown id is a data bug, so fail loudly instead of hiding it.
  if (!item) throw new Error(`Unknown ${label} id: ${id}`);
  return item;
}

/**
 * @param {{ partIds?: string[], orbitId?: string|null, rocketId?: string|null }} design
 * @param {{ parts: object[], rockets: object[], orbits: object[] }} data
 * @returns {{ parts: object[], rocket: object|null, orbit: object|null }}
 */
export function resolveDesign(design, data) {
  const { partIds = [], orbitId = null, rocketId = null } = design;
  return {
    parts: partIds.map((id) => findById(data.parts, id, 'part')),
    rocket: rocketId ? findById(data.rockets, rocketId, 'rocket') : null,
    orbit: orbitId ? findById(data.orbits, orbitId, 'orbit') : null,
  };
}
