# Live Expedition Route Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual location input for live expeditions with automatic GPS-based start location detection and full route tracking, so other users can tap the expedition location to open and follow the exact route in their map app.

**Architecture:** The live expedition session captures the starting GPS fix (reverse-geocoded via Nominatim to a place name) and accumulates waypoints every 25m during tracking. The route is stored in Supabase as a jsonb array. `ExpeditionCard` opens the full route in Google Maps when waypoints are present, falling back to a single pin otherwise.

**Tech Stack:** `expo-location` (already installed), Nominatim reverse geocode (fetch), React Native `Linking`, Supabase JS v2 jsonb column, TypeScript.

**Spec:** `docs/superpowers/specs/2026-03-22-live-expedition-route-tracking.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/schema.sql` | Modify | Add `route_waypoints jsonb` column definition |
| `src/types/index.ts` | Modify | Add `route_waypoints` field to `Expedition` type |
| `src/lib/liveExpeditionSession.ts` | Modify | Add `startLat`, `startLng`, `routeWaypoints` to `LiveExpeditionDraft` |
| `app/expedition/setup.tsx` | Modify | Remove location input when GPS on; update `start()` to skip location guard and init new fields |
| `app/expedition/live.tsx` | Modify | Capture first GPS fix + reverse geocode; record waypoints every 25m; flush to draft on stop |
| `app/expedition/live-post.tsx` | Modify | Add `location_lat`, `location_lng`, `route_waypoints` to Supabase insert |
| `src/lib/mapLink.ts` | Modify | Add `openRouteInMaps()` function and `decimateWaypoints()` helper |
| `src/components/ExpeditionCard.tsx` | Modify | Route-aware tap: open full route or single pin depending on `route_waypoints` |

---

## Task 1: DB schema + TypeScript `Expedition` type

**Files:**
- Modify: `supabase/schema.sql` (expeditions table, ~line 54)
- Modify: `src/types/index.ts` (Expedition type, ~line 63)

> **Manual prerequisite:** Before or after this task, apply the migration in the Supabase SQL editor:
> ```sql
> alter table expeditions add column if not exists route_waypoints jsonb;
> ```
> The `schema.sql` change below documents this in the codebase.

- [ ] **Step 1: Add `route_waypoints` to `supabase/schema.sql`**

In `supabase/schema.sql`, find the expeditions table definition. After the line:
```sql
  is_live boolean default false not null,
```
Add:
```sql
  route_waypoints jsonb,
```

The expeditions table block should end like:
```sql
  is_live boolean default false not null,
  route_waypoints jsonb,
  points_earned integer default 0 not null,
  created_at timestamptz default now() not null
);
```

- [ ] **Step 2: Add `route_waypoints` to the `Expedition` TypeScript type**

In `src/types/index.ts`, find the `Expedition` type. After the line:
```ts
  location_lng: number | null;
```
Add:
```ts
  route_waypoints: { lat: number; lng: number }[] | null;
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No new errors (the new optional field defaults to `null` for existing data).

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql src/types/index.ts
git commit -m "feat: add route_waypoints to schema and Expedition type"
```

---

## Task 2: Extend `LiveExpeditionDraft` + update `setup.tsx`

These two changes go together because adding required fields to `LiveExpeditionDraft` immediately causes a TypeScript error at the `setLiveExpeditionDraft` call site in `setup.tsx`.

**Files:**
- Modify: `src/lib/liveExpeditionSession.ts` (LiveExpeditionDraft type, ~line 9)
- Modify: `app/expedition/setup.tsx` (start function, GPS-on UI)

- [ ] **Step 1: Add three new fields to `LiveExpeditionDraft`**

In `src/lib/liveExpeditionSession.ts`, add after `photoInsights: PhotoInsight[];`:
```ts
  /** GPS start coordinates captured from the first fix. */
  startLat: number | null;
  startLng: number | null;
  /** Accumulated route waypoints (one per 25m of travel). */
  routeWaypoints: { lat: number; lng: number }[];
```

- [ ] **Step 2: Update `setup.tsx` — rework `start()` and location UI**

Replace the entire `start()` function in `app/expedition/setup.tsx` with:
```ts
function start() {
  if (!gpsEnabled) {
    const loc = locationLabel.trim() || search.trim();
    if (!loc) {
      Alert.alert('Location needed', 'Enter a location for your hike.');
      return;
    }
  }
  clearLiveExpeditionDraft();
  setLiveExpeditionDraft({
    locationLabel: gpsEnabled ? '' : (locationLabel.trim() || search.trim()),
    vibeTags: vibes,
    gpsEnabled,
    durationSeconds: 0,
    startTimeIso: '',
    endTimeIso: '',
    distanceMiles: 0,
    photoUris: [],
    photoInsights: [],
    startLat: null,
    startLng: null,
    routeWaypoints: [],
  });
  router.push('/expedition/live');
}
```

- [ ] **Step 3: Update `setup.tsx` — replace location input with conditional UI**

In `app/expedition/setup.tsx`, find and replace the entire location section (the `<Text style={labelStyle}>Search location</Text>` block, the `TextInput`, the hints dropdown, and the `locationLabel` badge — roughly lines 90–135) with this conditional block:

```tsx
{gpsEnabled ? (
  <View
    style={{
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.bgAccent,
    }}
  >
    <Text style={{ fontFamily: ff.crimson, fontSize: 15, color: colors.textMuted }}>
      Your start location will be detected automatically.
    </Text>
  </View>
) : (
  <>
    <Text style={labelStyle}>Location</Text>
    <TextInput
      value={locationLabel}
      onChangeText={setLocationLabel}
      placeholder="Trail, park, city…"
      placeholderTextColor={colors.bgAccent}
      style={{
        backgroundColor: colors.redAccent,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontFamily: ff.crimson,
        fontSize: 17,
        color: colors.bgPrimary,
        marginBottom: 20,
      }}
      autoCapitalize="words"
    />
  </>
)}
```

You can also remove the `search`, `hints`, and `useMemo` logic since they're no longer needed (the new UI doesn't use autocomplete). Remove these lines near the top of the component:
- `const [search, setSearch] = useState('');`
- the `useMemo` block for `hints`
- the `LOCAL_PLACE_HINTS` import from `../../src/constants/expeditionVibes`

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors. The `LiveExpeditionDraft` type is now satisfied at the call site.

- [ ] **Step 5: Commit**

```bash
git add src/lib/liveExpeditionSession.ts app/expedition/setup.tsx
git commit -m "feat: extend LiveExpeditionDraft with route fields; update setup screen"
```

---

## Task 3: Add GPS start capture + waypoint recording to `live.tsx`

**Files:**
- Modify: `app/expedition/live.tsx`

- [ ] **Step 1: Add the three new refs**

In `app/expedition/live.tsx`, add these three refs alongside the existing `watchRef`, `lastFixRef`, etc.:

```ts
const startCapturedRef = useRef(false);
const lastWaypointCoordsRef = useRef<Location.LocationObject['coords'] | null>(null);
const waypointsRef = useRef<{ lat: number; lng: number }[]>([]);
```

Note: `Location` is already imported as `* as Location from 'expo-location'`.

- [ ] **Step 2: Add start capture logic inside the `watchPositionAsync` callback**

In `app/expedition/live.tsx`, find the `watchPositionAsync` callback (the arrow function passed as the second argument). It currently looks like:
```ts
loc => {
  const prev = lastFixRef.current;
  if (prev) {
    const delta = haversineMeters(prev.coords, loc.coords);
    if (delta > 0.5 && delta < 5000) {
      pathMetersRef.current += delta;
      setDistanceMiles(metersToMiles(pathMetersRef.current));
    }
  }
  lastFixRef.current = loc;
},
```

Replace with:
```ts
loc => {
  // --- Start location capture (first fix only) ---
  if (!startCapturedRef.current) {
    startCapturedRef.current = true;
    updateLiveExpeditionDraft({
      startLat: loc.coords.latitude,
      startLng: loc.coords.longitude,
    });
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
        updateLiveExpeditionDraft({
          locationLabel: `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`,
        });
      });
  }

  // --- Distance accumulation (existing logic) ---
  const prev = lastFixRef.current;
  if (prev) {
    const delta = haversineMeters(prev.coords, loc.coords);
    if (delta > 0.5 && delta < 5000) {
      pathMetersRef.current += delta;
      setDistanceMiles(metersToMiles(pathMetersRef.current));
    }
  }
  lastFixRef.current = loc;

  // --- Waypoint recording (every 25m) ---
  const waypoint = { lat: loc.coords.latitude, lng: loc.coords.longitude };
  if (!lastWaypointCoordsRef.current) {
    waypointsRef.current.push(waypoint);
    lastWaypointCoordsRef.current = loc.coords;
  } else {
    const distFromLast = haversineMeters(lastWaypointCoordsRef.current, loc.coords);
    if (distFromLast >= 25) {
      waypointsRef.current.push(waypoint);
      lastWaypointCoordsRef.current = loc.coords;
    }
  }
},
```

- [ ] **Step 3: Flush waypoints to the draft in `stopAndGoReview`**

Find the `stopAndGoReview` callback. It currently calls:
```ts
updateLiveExpeditionDraft({
  durationSeconds: elapsedRef.current,
  endTimeIso: end.toISOString(),
  distanceMiles: finalMiles,
  photoUris: photosRef.current,
});
```

Add `routeWaypoints`:
```ts
updateLiveExpeditionDraft({
  durationSeconds: elapsedRef.current,
  endTimeIso: end.toISOString(),
  distanceMiles: finalMiles,
  photoUris: photosRef.current,
  routeWaypoints: waypointsRef.current,
});
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add app/expedition/live.tsx
git commit -m "feat: capture GPS start point and record route waypoints in live.tsx"
```

---

## Task 4: Add `location_lat`, `location_lng`, `route_waypoints` to `live-post.tsx`

**Files:**
- Modify: `app/expedition/live-post.tsx` (Supabase insert, ~line 140)

- [ ] **Step 1: Add the three fields to the Supabase insert**

In `app/expedition/live-post.tsx`, find the `.insert({...})` call inside `postExpedition`. It currently ends with:
```ts
  points_earned: expeditionPoints,
})
```

Add three fields before `points_earned`:
```ts
  location_lat: draft.startLat ?? null,
  location_lng: draft.startLng ?? null,
  route_waypoints: (draft.routeWaypoints?.length ?? 0) >= 2 ? draft.routeWaypoints : null,
  points_earned: expeditionPoints,
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/expedition/live-post.tsx
git commit -m "feat: insert location_lat, location_lng, route_waypoints from live expedition draft"
```

---

## Task 5: Add `openRouteInMaps` to `src/lib/mapLink.ts`

**Files:**
- Modify: `src/lib/mapLink.ts`

The file currently exports only `openInMaps`. Add two new exports at the end.

- [ ] **Step 1: Add `decimateWaypoints` and `openRouteInMaps` to `mapLink.ts`**

Append to the end of `src/lib/mapLink.ts`:

```ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/mapLink.ts
git commit -m "feat: add openRouteInMaps and decimateWaypoints to mapLink.ts"
```

---

## Task 6: Update `ExpeditionCard` with route-aware tap behavior

**Files:**
- Modify: `src/components/ExpeditionCard.tsx`

- [ ] **Step 1: Import `openRouteInMaps`**

In `src/components/ExpeditionCard.tsx`, find the existing import:
```ts
import { openInMaps } from '../lib/mapLink';
```

Replace with:
```ts
import { openInMaps, openRouteInMaps } from '../lib/mapLink';
```

- [ ] **Step 2: Update the tappable location constants**

In `src/components/ExpeditionCard.tsx`, find the `hasCoords` constant (added in a previous task). It currently reads:
```ts
const hasCoords = expedition.location_lat != null && expedition.location_lng != null;
```

Replace that line (and any `isTappable` constant if present) with:
```ts
const hasRoute = (expedition.route_waypoints?.length ?? 0) >= 2;
const hasCoords = expedition.location_lat != null && expedition.location_lng != null;
const isTappable = hasRoute || hasCoords;
```

- [ ] **Step 3: Update the location tap handler**

Find the location rendering block. It currently wraps the location text in a `TouchableOpacity` when `hasCoords` is true. Update the condition and handler:

Change:
```tsx
{hasCoords ? (
  <TouchableOpacity
    onPress={() => openInMaps(expedition.location ?? locationLine, expedition.location_lat!, expedition.location_lng!)}
    activeOpacity={0.7}
    accessibilityRole="link"
    accessibilityLabel={`Open ${expedition.location ?? 'location'} in maps`}
  >
    <Text style={[textStyles.postLocation, { marginBottom: 10, textDecorationLine: 'underline' }]}>
      📍 {locationLine}
    </Text>
  </TouchableOpacity>
) : (
  <Text style={[textStyles.postLocation, { marginBottom: 10 }]}>{locationLine}</Text>
)}
```

To:
```tsx
{isTappable ? (
  <TouchableOpacity
    onPress={() => {
      if (hasRoute) {
        openRouteInMaps(expedition.route_waypoints!, expedition.location ?? expedition.title);
      } else {
        openInMaps(expedition.location ?? expedition.title, expedition.location_lat!, expedition.location_lng!);
      }
    }}
    activeOpacity={0.7}
    accessibilityRole="link"
    accessibilityLabel={`Open ${expedition.location ?? 'location'} in maps`}
  >
    <Text style={[textStyles.postLocation, { marginBottom: 10, textDecorationLine: 'underline' }]}>
      📍 {locationLine}
    </Text>
  </TouchableOpacity>
) : (
  <Text style={[textStyles.postLocation, { marginBottom: 10 }]}>{locationLine}</Text>
)}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ExpeditionCard.tsx
git commit -m "feat: route-aware map tap in ExpeditionCard"
```

---

## Task 7: Push and smoke-test

- [ ] **Step 1: Push all commits to GitHub**

```bash
git push origin Cesar
```

- [ ] **Step 2: Manual smoke test — GPS on path**

1. Open the app in Expo Go
2. Navigate to the expedition tab → Start live expedition
3. Confirm the location input is gone and the auto-detect note is shown
4. Tap "Start expedition" (no location required)
5. Walk a short distance; watch the distance counter increment
6. Tap Stop → confirm the draft has a `locationLabel` filled in by the time you reach the post screen (may take a few seconds while reverse geocode runs)
7. Post the expedition
8. On the Feed, tap the location line of the just-posted expedition → confirm Google Maps opens with the route

- [ ] **Step 3: Manual smoke test — GPS off path**

1. Start a new live expedition with GPS toggled off
2. Confirm the location text input appears
3. Type a location name, tap Start
4. Stop the expedition, enter a manual distance, post it
5. On the Feed, tap the location line → confirm Google Maps opens to a single pin (since no route_waypoints)

- [ ] **Step 4: Manual smoke test — regular (non-live) expedition**

1. Create a regular expedition via the existing form with a location that has coordinates
2. On the Feed, tap its location line → confirm single-pin map opens
3. Tap a regular expedition with no coordinates → confirm the location is non-tappable (no underline, no 📍)
