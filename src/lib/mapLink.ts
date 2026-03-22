import { Linking, Platform } from 'react-native';

export function openInMaps(name: string, lat: number, lng: number) {
  const encodedName = encodeURIComponent(name);
  const url = Platform.select({
    ios: `https://maps.apple.com/?q=${encodedName}&ll=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedName})`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  })!;

  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).catch(() => {});
  });
}

/** Pick up to maxPoints evenly-spaced points (always includes first and last). */
function decimateWaypoints(
  waypoints: { lat: number; lng: number }[],
  maxPoints: number
): { lat: number; lng: number }[] {
  if (waypoints.length <= maxPoints) return waypoints;
  const result: { lat: number; lng: number }[] = [];
  const step = (waypoints.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    result.push(waypoints[Math.min(Math.round(i * step), waypoints.length - 1)]);
  }
  return result;
}

/**
 * Opens a navigable route in Google Maps.
 * Decimates the waypoints to ≤8 to stay within the Google Maps free URL limit.
 * Falls back to single-pin if < 2 waypoints, or if the URL fails to open.
 */
export function openRouteInMaps(waypoints: { lat: number; lng: number }[], name: string) {
  if (waypoints.length === 0) return;
  if (waypoints.length < 2) {
    openInMaps(name, waypoints[0].lat, waypoints[0].lng);
    return;
  }

  const decimated = decimateWaypoints(waypoints, 8);
  const origin = decimated[0];
  const destination = decimated[decimated.length - 1];
  const middle = decimated.slice(1, -1);

  const waypointParam =
    middle.length > 0
      ? `&waypoints=${middle.map(w => `${w.lat},${w.lng}`).join('|')}`
      : '';

  const url =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${origin.lat},${origin.lng}` +
    `&destination=${destination.lat},${destination.lng}` +
    waypointParam;

  Linking.openURL(url).catch(() => {
    openInMaps(name, origin.lat, origin.lng);
  });
}
