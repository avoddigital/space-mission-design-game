// Turns engine issues into player-facing text from src/data/content.js.
// Pure functions, no DOM. The texts themselves live in the data folder.

/** Round numbers so the player never sees values like 12.499999. */
function formatValue(value) {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
  }
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

/**
 * Replace {name} placeholders with values. Unknown placeholders stay as they are,
 * so a missing value is easy to spot in tests.
 * @param {string} template
 * @param {Record<string, unknown>} values
 */
export function fillText(template, values = {}) {
  if (typeof template !== 'string') return '';
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    values[name] === undefined || values[name] === null ? match : formatValue(values[name]),
  );
}

/** Show names instead of ids, for example "Medium Lifter" instead of "medium-lifter". */
function readableValues(issue, data) {
  const values = { ...issue };
  const nameOf = (list, id) => list?.find((item) => item.id === id)?.name ?? id;
  if (issue.rocketId) values.rocketId = nameOf(data.rockets, issue.rocketId);
  if (issue.orbitId) values.orbitId = nameOf(data.orbits, issue.orbitId);
  if (issue.type && data.content?.typeNames?.[issue.type]) values.type = data.content.typeNames[issue.type];
  return values;
}

/**
 * @param {{ code: string }} issue an issue from validateMission
 * @param {{ issues?: Record<string, object> }} content player-facing texts
 * @param {{ rockets?: object[], orbits?: object[] }} [data] used to show names instead of ids
 * @returns {{ title: string, text: string, tip: string, learn: string }}
 */
export function formatIssue(issue, content, data = {}) {
  const entry = content?.issues?.[issue.code];
  if (!entry) {
    // Never break the game because a text is missing.
    return { title: 'Check your design', text: `Something needs attention (${issue.code}).`, tip: '', learn: '' };
  }
  const values = readableValues(issue, data);
  return {
    title: fillText(entry.title, values),
    text: fillText(entry.text, values),
    tip: fillText(entry.tip, values),
    learn: fillText(entry.learn, values),
  };
}
