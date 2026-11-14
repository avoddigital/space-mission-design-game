// Simplified values. Not exact.
// target is one of: LEO, GTO, TLI, TMI.
export const orbits = [
  { id: 'leo-500', name: 'Low Earth Orbit (500 km)', target: 'LEO', altitudeKm: 500, transferDays: 0 }, // simplified, generic LEO
  { id: 'sso-700', name: 'Sun-Synchronous Orbit (705 km)', target: 'LEO', altitudeKm: 705, transferDays: 0 }, // simplified, inspired by Landsat 8
  { id: 'geo', name: 'Geostationary Orbit', target: 'GTO', altitudeKm: 35786, transferDays: 10 }, // simplified, inspired by GOES
  { id: 'moon-orbit', name: 'Lunar Orbit', target: 'TLI', altitudeKm: 50, transferDays: 5 }, // simplified, inspired by LRO
  { id: 'mars-orbit', name: 'Mars Orbit', target: 'TMI', altitudeKm: 400, transferDays: 200 }, // simplified, inspired by Mars Odyssey
];
