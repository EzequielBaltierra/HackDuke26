# Live Expedition Route Tracking Design

**Goal:** Replace the manual location input for live expeditions with automatic GPS-based start location detection and full route tracking, so that other users can tap the expedition location to open and follow the exact route in their map app.

**Architecture:** The live expedition session captures the starting GPS fix (reverse-geocoded to a place name) and accumulates waypoints every 25m during tracking. The route is stored in Supabase as a jsonb array. `ExpeditionCard` opens the full route in Google Maps when waypoints are present, falling back to a single pin for regular expeditions.

**Tech Stack:** `expo-location` (already installed), Nominatim reverse geocode, React Native `Linking`, Supabase JS v2 jsonb column.

---

## Data Layer

### DB migration (applied manually in Supabase SQL editor + updated in `supabase/schema.sql`)

```sql
alter table expeditions add column if not exists route_waypoints jsonb;
```

Stored as a JSON array of `{lat, lng}` objects:
```json
[{"lat": 35.9940, "lng": -78.8986}, {"lat": 35.9955, "lng": -78.8972}, ...]
```

Nullable — regular (non-live) expeditions leave this `null`.

### TypeScript type (`src/types/index.ts`)

Add to `Expedition`:
```ts
route_waypoints: { lat: number; lng: number }[] | null;
```

### `LiveExpeditionDraft` (`src/lib/liveExpeditionSession.ts`)

Add three fields:
```ts
startLat: number | null;
startLng: number | null;
routeWaypoints: { lat: number; lng: number }[];
```

Initialize `startLat: null`, `startLng: null`, `routeWaypoints: []` in `setLiveExpeditionDraft`.

---

## Setup Screen (`app/expedition/setup.tsx`)

**When GPS is ON (default):** Remove the location search/text input entirely. Show an inline note: `"Your start location will be detected automatically."` The `locationLabel` field in the draft is initialized as `''` — it will be filled in by the first GPS fix in `live.tsx`.

**When GPS is OFF:** Show a plain `TextInput` for the location label (same as today). This is the fallback for users with poor signal. The draft `locationLabel` is set from this input as before.

The vibes selection is unchanged.

---

## Live Tracking (`app/expedition/live.tsx`)

### Start location detection (first GPS fix only)

When GPS is enabled and the first location fix arrives, capture the start coordinates and reverse-geocode:

```ts
if (!startCapturedRef.current) {
  startCapturedRef.current = true;
  updateLiveExpeditionDraft({
    startLat: loc.coords.latitude,
    startLng: loc.coords.longitude,
  });
  // Reverse geocode in background — fire and forget
  fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&format=json`,
    { headers: { 'User-Agent': 'Root-HackDuke/1.0' } }
  )
    .then(r => r.json())
    .then(data => {
      if (data.display_name) {
        updateLiveExpeditionDraft({ locationLabel: data.display_name });
      }
    })
    .catch(() => {
      // fallback: leave locationLabel as coordinate string
      updateLiveExpeditionDraft({
        locationLabel: `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`,
      });
    });
}
```

New ref: `const startCapturedRef = useRef(false);`

### Waypoint recording (every fix)

A second ref tracks the last recorded waypoint position:

```ts
const lastWaypointRef = useRef<{ lat: number; lng: number } | null>(null);
const waypointsRef = useRef<{ lat: number; lng: number }[]>([]);
```

Inside the `watchPositionAsync` callback, after distance accumulation:

```ts
const waypoint = { lat: loc.coords.latitude, lng: loc.coords.longitude };
if (!lastWaypointRef.current) {
  // Always record the first fix as the first waypoint
  waypointsRef.current.push(waypoint);
  lastWaypointRef.current = waypoint;
} else {
  const distFromLastWaypoint = haversineMeters(
    { latitude: lastWaypointRef.current.lat, longitude: lastWaypointRef.current.lng, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null },
    loc.coords
  );
  if (distFromLastWaypoint >= 25) {
    waypointsRef.current.push(waypoint);
    lastWaypointRef.current = waypoint;
  }
}
```

### Flushing to draft on stop

In `stopAndGoReview`, add `routeWaypoints` to the draft update:

```ts
updateLiveExpeditionDraft({
  durationSeconds: elapsedRef.current,
  endTimeIso: end.toISOString(),
  distanceMiles: finalMiles,
  photoUris: photosRef.current,
  routeWaypoints: waypointsRef.current,
});
```

---

## Post Screen (`app/expedition/live-post.tsx`)

The `locationDetail` text input stays — pre-filled from `draft.locationLabel` (now the auto-detected GPS label). The user can still edit it.

The Supabase insert gains three new fields:

```ts
location_lat: draft.startLat ?? null,
location_lng: draft.startLng ?? null,
route_waypoints: draft.routeWaypoints.length >= 2 ? draft.routeWaypoints : null,
```

---

## Map Link Utility (`src/lib/mapLink.ts`)

Add a new `openRouteInMaps` function alongside the existing `openInMaps`:

```ts
export function openRouteInMaps(waypoints: { lat: number; lng: number }[], name: string) {
  if (waypoints.length < 2) {
    // Fallback to single-pin if somehow called with < 2 points
    openInMaps(name, waypoints[0].lat, waypoints[0].lng);
    return;
  }

  const decimated = decimateWaypoints(waypoints, 8);
  const origin = decimated[0];
  const destination = decimated[decimated.length - 1];
  const middle = decimated.slice(1, -1);

  const waypointParam = middle.length > 0
    ? `&waypoints=${middle.map(w => `${w.lat},${w.lng}`).join('|')}`
    : '';

  const url =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${origin.lat},${origin.lng}` +
    `&destination=${destination.lat},${destination.lng}` +
    waypointParam;

  Linking.openURL(url).catch(() => {
    // fallback: open just the start pin
    openInMaps(name, origin.lat, origin.lng);
  });
}

/** Pick N evenly-spaced points from the waypoints array (always includes first and last). */
function decimateWaypoints(
  waypoints: { lat: number; lng: number }[],
  maxPoints: number
): { lat: number; lng: number }[] {
  if (waypoints.length <= maxPoints) return waypoints;
  const result: { lat: number; lng: number }[] = [];
  const step = (waypoints.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    result.push(waypoints[Math.round(i * step)]);
  }
  return result;
}
```

---

## ExpeditionCard (`src/components/ExpeditionCard.tsx`)

Update the tappable location logic:

```ts
const hasRoute = (expedition.route_waypoints?.length ?? 0) >= 2;
const hasCoords = expedition.location_lat != null && expedition.location_lng != null;
const isTappable = hasRoute || hasCoords;
```

In the `onPress` handler:
```ts
onPress={() => {
  if (hasRoute) {
    openRouteInMaps(expedition.route_waypoints!, expedition.location ?? locationLine);
  } else {
    openInMaps(expedition.location ?? locationLine, expedition.location_lat!, expedition.location_lng!);
  }
}}
```

Import `openRouteInMaps` from `../lib/mapLink`.

---

## Error Handling

- **GPS permission denied during live expedition**: existing behavior — falls back to manual distance, no start location captured, no waypoints. Location remains whatever was typed in setup.
- **Nominatim reverse geocode fails**: fallback label `"lat, lng"` string. Draft still has `startLat`/`startLng` for the map link.
- **Route has < 2 waypoints** (GPS disabled or very short trip): `route_waypoints` saved as `null`. Card falls back to single-pin behavior using `location_lat`/`location_lng`.
- **`openRouteInMaps` URL fails**: catches and falls back to single-pin `openInMaps` for the start point.

---

## Out of Scope

- Displaying the route visually on a map within the app
- Route tracking for regular (non-live) expeditions
- Editing/correcting the GPS-detected start label after the fact (beyond what the post screen already allows)
