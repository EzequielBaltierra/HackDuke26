import type { LocationObject } from 'expo-location';

const EARTH_R_M = 6371000;

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

/** Great-circle distance in meters between two WGS84 points. */
export function haversineMeters(a: LocationObject['coords'], b: LocationObject['coords']): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function metersToMiles(m: number) {
  return m * 0.000621371;
}
