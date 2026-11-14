// Where each agency country is on the globe, for the 3D highlight only (no game rule uses this).
// Approximate center of each country in degrees (latitude north +, longitude east +), and a rough
// size (radius in degrees) so a big country glows over a bigger area. Simplified; not a map.
// Europe is centred on the middle of the continent.

export const PLACES = Object.freeze({
  ao: { lat: -12.3, lon: 17.5, size: 7 }, // Angola
  ar: { lat: -35.5, lon: -64.5, size: 11 }, // Argentina
  bh: { lat: 26.0, lon: 50.6, size: 2 }, // Bahrain (tiny: a minimum size so it still shows)
  br: { lat: -10.5, lon: -52.5, size: 16 }, // Brazil
  ca: { lat: 58.0, lon: -100.0, size: 17 }, // Canada
  eu: { lat: 50.0, lon: 12.0, size: 14 }, // Europe
  in: { lat: 22.5, lon: 79.0, size: 11 }, // India
  it: { lat: 42.8, lon: 12.5, size: 4 }, // Italy
  jp: { lat: 36.5, lon: 138.5, size: 5 }, // Japan
  ng: { lat: 9.1, lon: 8.7, size: 6 }, // Nigeria
  py: { lat: -23.4, lon: -58.4, size: 4 }, // Paraguay
  sn: { lat: 14.5, lon: -14.5, size: 3 }, // Senegal
  kr: { lat: 36.4, lon: 127.9, size: 2.5 }, // South Korea
  es: { lat: 40.2, lon: -3.7, size: 5 }, // Spain
  tr: { lat: 39.0, lon: 35.2, size: 6 }, // Türkiye
  ae: { lat: 24.0, lon: 54.2, size: 2.5 }, // United Arab Emirates
  gb: { lat: 54.0, lon: -2.5, size: 4 }, // United Kingdom
  us: { lat: 39.5, lon: -98.5, size: 13 }, // United States (contiguous states)
});

/**
 * Point on a Three.js sphere (SphereGeometry with an equirectangular map, longitude -180 at the
 * texture's left edge) for a latitude and longitude, in the sphere's own coordinates.
 * @returns {{ x: number, y: number, z: number }}
 */
export function surfacePoint(lat, lon, radius = 1) {
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  const theta = ((90 - lat) * Math.PI) / 180;
  return {
    x: -radius * Math.cos(phi) * Math.sin(theta),
    y: radius * Math.cos(theta),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

/**
 * Turn (radians around the vertical axis) that brings this point in front of a camera
 * looking from direction `cameraAngle` (atan2(z, x) of the camera position).
 */
export function turnToFace(lat, lon, cameraAngle = Math.PI / 2) {
  const point = surfacePoint(lat, lon);
  return Math.atan2(point.z, point.x) - cameraAngle;
}
