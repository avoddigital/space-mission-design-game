// Simplified values. Not exact.
// target is one of: LEO, GTO, TLI, TMI.
export const orbits = [
  { id: 'leo-500', name: 'Low Earth Orbit (500 km)', description: 'A low orbit close to Earth. Easy to reach and great for detailed pictures.', target: 'LEO', altitudeKm: 500, transferDays: 0 }, // simplified, generic LEO
  { id: 'sso-700', name: 'Sun-Synchronous Orbit (705 km)', description: 'A low orbit that passes over each place at the same local time. Great for comparing pictures over the years.', target: 'LEO', altitudeKm: 705, transferDays: 0 }, // simplified, inspired by Landsat 8
  { id: 'geo', name: 'Geostationary Orbit', description: 'Very high above Earth, where a satellite stays over the same spot. Great for watching the weather, but much harder to reach.', target: 'GTO', altitudeKm: 35786, transferDays: 10 }, // simplified, inspired by GOES
  { id: 'moon-orbit', name: 'Lunar Orbit', description: 'A low orbit around the Moon, close enough for detailed maps. The trip takes a few days.', target: 'TLI', altitudeKm: 50, transferDays: 5 }, // simplified, inspired by LRO
  { id: 'mars-orbit', name: 'Mars Orbit', description: 'An orbit around Mars, far from Earth. The trip takes months, so plan your time carefully.', target: 'TMI', altitudeKm: 400, transferDays: 200 }, // simplified, inspired by Mars Odyssey
];
