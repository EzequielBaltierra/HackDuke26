import type { Discovery, Expedition } from '../types';

function normalizePlace(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Routing key for a named place (lowercased for stable matching). */
export function placeKeyFromLabel(location: string): string {
  return `place:${normalizePlace(location)}`;
}

export function geoKey(lat: number, lng: number): string {
  return `geo:${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export function expeditionLocationKey(e: Expedition): string | null {
  const loc = e.location?.trim();
  if (loc) return placeKeyFromLabel(loc);
  if (e.location_lat != null && e.location_lng != null) {
    return geoKey(e.location_lat, e.location_lng);
  }
  return null;
}

export function discoveryLocationKey(d: Discovery): string | null {
  if (d.is_sensitive) return null;
  if (d.location_lat != null && d.location_lng != null) {
    return geoKey(d.location_lat, d.location_lng);
  }
  return null;
}

export function titleFromKey(key: string, fallback = 'Location'): string {
  if (key.startsWith('place:')) {
    const raw = key.slice(6);
    return raw.replace(/\b\w/g, ch => ch.toUpperCase());
  }
  if (key.startsWith('geo:')) {
    return 'Outdoor location';
  }
  return fallback;
}
