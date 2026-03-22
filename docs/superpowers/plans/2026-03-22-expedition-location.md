# Expedition Location Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the free-text expedition location input with an autocomplete search + GPS picker, and make location text in expedition cards tap-to-open in the phone's map app.

**Architecture:** A new `LocationPicker` component wraps Nominatim search and GPS. A tiny `mapLink.ts` utility handles platform-aware map deep-linking. The `expeditions` table gets two new nullable columns (`location_lat`, `location_lng`). `ExpeditionCard` conditionally wraps the location line in a `TouchableOpacity`.

**Tech Stack:** Nominatim (OpenStreetMap) REST API, `expo-location` v19 (already installed), React Native `Linking` + `Platform` from `react-native`.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `supabase/schema.sql` | Add `location_lat` / `location_lng` columns |
| Modify | `src/types/index.ts` | Add fields to `Expedition` type |
| Create | `src/lib/mapLink.ts` | `openInMaps()` utility — platform-aware map deep-link |
| Create | `src/components/LocationPicker.tsx` | Autocomplete search + GPS button component |
| Modify | `app/expedition/new.tsx` | Replace plain TextInput with LocationPicker |
| Modify | `src/components/ExpeditionCard.tsx` | Tappable location when coords present |

---

## Task 1: DB migration + schema.sql + TypeScript types

**Files:**
- Modify: `supabase/schema.sql` (add 2 columns to expeditions table definition)
- Modify: `src/types/index.ts:43-70` (add fields to `Expedition` type)

> **Note:** This task has a manual step. Apply the SQL in the Supabase dashboard first, then update the code files.

- [ ] **Step 1: Apply the migration in Supabase**

Go to your Supabase project → SQL Editor → New query. Paste and run:

```sql
alter table expeditions add column if not exists location_lat numeric(10,6);
alter table expeditions add column if not exists location_lng numeric(10,6);
```

Expected: "Success. No rows returned."

- [ ] **Step 2: Update `supabase/schema.sql`**

Find the expeditions table definition (the `location text,` line) and add the two new columns right after it:

```sql
  location text,
  location_lat numeric(10,6),
  location_lng numeric(10,6),
```

The full expeditions table in schema.sql should now look like:

```sql
create table if not exists expeditions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  description text,
  type text not null,
  location text,
  location_lat numeric(10,6),
  location_lng numeric(10,6),
  distance numeric(8,2),
  difficulty text,
  vibe_tags text[] default '{}' not null,
  photo_urls text[] default '{}' not null,
  duration_seconds integer,
  start_time timestamptz,
  end_time timestamptz,
  is_live boolean default false not null,
  points_earned integer default 0 not null,
  created_at timestamptz default now() not null
);
```

- [ ] **Step 3: Update `src/types/index.ts`**

Add `location_lat` and `location_lng` to the `Expedition` type after `location`:

```ts
export type Expedition = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: ExpeditionType;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  distance: number | null;
  difficulty: Difficulty | null;
  vibe_tags: string[];
  photo_urls: string[];
  duration_seconds: number | null;
  start_time: string | null;
  end_time: string | null;
  is_live: boolean;
  points_earned: number;
  created_at: string;
  users?: User;
  discoveries?: Discovery[];
  participants?: User[];
  original_expedition_id: string | null;
  trip_count: number;
  original_creator_username: string | null;
  original_expedition?: {
    id: string;
    trip_count: number;
  } | null;
};
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/crodasmenendez24/Desktop/HackDuke2026/HackDuke26
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `location_lat` or `location_lng`.

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql src/types/index.ts
git commit -m "feat: add location_lat/location_lng to expeditions schema and types"
```

---

## Task 2: Create `mapLink.ts` utility

**Files:**
- Create: `src/lib/mapLink.ts`

- [ ] **Step 1: Create the file**

```ts
import { Linking, Platform } from 'react-native';

export function openInMaps(name: string, lat: number, lng: number) {
  const encodedName = encodeURIComponent(name);
  const primary = Platform.select({
    ios: `maps:?q=${encodedName}&ll=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedName})`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  })!;

  Linking.openURL(primary).catch(() => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/mapLink.ts
git commit -m "feat: add openInMaps utility for platform-aware map deep-linking"
```

---

## Task 3: Create `LocationPicker` component

**Files:**
- Create: `src/components/LocationPicker.tsx`

This component replaces the plain TextInput for location. It shows a search field with a Nominatim autocomplete dropdown and a GPS button. Once the user selects a result, the field locks and shows a clear (✕) button.

- [ ] **Step 1: Create the file with complete implementation**

```tsx
import * as Location from 'expo-location';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type Props = {
  locationName: string;
  lat: number | null;
  lng: number | null;
  onChange: (name: string, lat: number | null, lng: number | null) => void;
};

const NOMINATIM_HEADERS = {
  'User-Agent': 'Root-HackDuke/1.0',
  'Accept-Language': 'en',
};

export function LocationPicker({ locationName, onChange }: Props) {
  const [query, setQuery] = useState(locationName);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSearch = useRef('');

  function handleTextChange(text: string) {
    setQuery(text);
    setResults([]);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (text.length < 3) return;
    debounceTimer.current = setTimeout(() => doSearch(text), 1000);
  }

  async function doSearch(q: string) {
    currentSearch.current = q;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: NOMINATIM_HEADERS }
      );
      const data: NominatimResult[] = await res.json();
      if (currentSearch.current === q) setResults(data);
    } catch {
      // silently fail — user can still submit a plain name without coords
    }
  }

  function selectResult(result: NominatimResult) {
    const name = result.display_name;
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setQuery(name);
    setResults([]);
    setLocked(true);
    onChange(name, lat, lng);
  }

  function clear() {
    setQuery('');
    setResults([]);
    setLocked(false);
    onChange('', null, null);
  }

  async function useGPS() {
    setGpsError(null);
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError('Location permission needed');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: NOMINATIM_HEADERS }
      );
      const data = await res.json();
      const name: string =
        data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setQuery(name);
      setResults([]);
      setLocked(true);
      onChange(name, latitude, longitude);
    } catch {
      setGpsError("Couldn't get location");
    } finally {
      setGpsLoading(false);
    }
  }

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput
          value={query}
          onChangeText={locked ? undefined : handleTextChange}
          editable={!locked}
          placeholder="Search for a place..."
          placeholderTextColor="#c7af94"
          style={[
            inputStyle,
            { flex: 1, marginBottom: 0 },
            locked ? { backgroundColor: '#f5efe8' } : null,
          ]}
        />
        {locked ? (
          <TouchableOpacity onPress={clear} style={actionBtnStyle}>
            <Text style={{ color: '#6d3a3c', fontWeight: '700', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={useGPS}
            disabled={gpsLoading}
            style={[actionBtnStyle, { backgroundColor: '#4e705e' }]}
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color="#eaded0" />
            ) : (
              <Text style={{ color: '#eaded0', fontSize: 12, fontWeight: '700' }}>📍 GPS</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {gpsError ? (
        <Text style={{ color: '#6d3a3c', fontSize: 12, marginTop: 4 }}>{gpsError}</Text>
      ) : null}

      {results.length > 0 ? (
        <View style={dropdownStyle}>
          {results.map((r, i) => (
            <TouchableOpacity
              key={r.place_id}
              onPress={() => selectResult(r)}
              style={[
                resultItemStyle,
                i === results.length - 1 ? { borderBottomWidth: 0 } : null,
              ]}
            >
              <Text style={{ fontSize: 13, color: '#110703' }} numberOfLines={2}>
                {r.display_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const inputStyle = {
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 14,
  fontSize: 15,
  borderWidth: 1,
  borderColor: '#c7af94',
  color: '#110703',
};

const actionBtnStyle = {
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#c7af94',
  paddingHorizontal: 14,
  height: 50,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const dropdownStyle = {
  backgroundColor: 'white',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#c7af94',
  marginTop: 4,
  overflow: 'hidden' as const,
};

const resultItemStyle = {
  padding: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#f0e8dc',
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Manually verify in the running app**

Open `app/expedition/new.tsx` temporarily, swap the TextInput for `<LocationPicker locationName="" lat={null} lng={null} onChange={() => {}} />` and confirm the component renders. Revert after confirming.

- [ ] **Step 4: Commit**

```bash
git add src/components/LocationPicker.tsx
git commit -m "feat: add LocationPicker component with Nominatim autocomplete and GPS"
```

---

## Task 4: Update the expedition form

**Files:**
- Modify: `app/expedition/new.tsx`

**Key changes:**
1. Add `keyboardShouldPersistTaps="handled"` to the root `ScrollView` so dropdown results are tappable while keyboard is open
2. Replace `const [location, setLocation] = useState(...)` with three state vars
3. Remove the plain `TextInput` for location, replace with `<LocationPicker>`
4. Update validation to check `locationName`
5. Update Supabase insert to include `location_lat` and `location_lng`

- [ ] **Step 1: Update imports at top of file**

Add `LocationPicker` to imports. The import block at the top should include:

```tsx
import { LocationPicker } from '../../src/components/LocationPicker';
```

- [ ] **Step 2: Replace location state**

Find this line (around line 43):
```tsx
const [location, setLocation] = useState(params.originalLocation ?? '');
```

Replace with:
```tsx
const [locationName, setLocationName] = useState(params.originalLocation ?? '');
const [locationLat, setLocationLat] = useState<number | null>(null);
const [locationLng, setLocationLng] = useState<number | null>(null);
```

- [ ] **Step 3: Update the location validation in `postExpedition`**

Find (around line 123):
```tsx
if (!location.trim()) {
  Alert.alert('Location required', 'Please add a location so others can find this expedition.');
  return;
}
```

Replace with:
```tsx
if (!locationName.trim()) {
  Alert.alert('Location required', 'Please add a location so others can find this expedition.');
  return;
}
```

- [ ] **Step 4: Update the Supabase insert**

Find (around line 144):
```tsx
location: location.trim() || null,
```

Replace with:
```tsx
location: locationName.trim() || null,
location_lat: locationLat,
location_lng: locationLng,
```

- [ ] **Step 5: Add `keyboardShouldPersistTaps` to the root ScrollView**

Find (around line 188):
```tsx
<ScrollView style={{ flex: 1, backgroundColor: '#eaded0' }}>
```

Replace with:
```tsx
<ScrollView style={{ flex: 1, backgroundColor: '#eaded0' }} keyboardShouldPersistTaps="handled">
```

- [ ] **Step 6: Replace the Location TextInput with LocationPicker**

Find the Location section (around line 278–286):
```tsx
<Label>Location</Label>
<TextInput
  value={location}
  onChangeText={isRedo ? undefined : setLocation}
  editable={!isRedo}
  placeholder="e.g. Eno River State Park"
  placeholderTextColor="#c7af94"
  style={[inputStyle, isRedo ? { opacity: 0.6 } : null]}
/>
```

Replace with:
```tsx
<Label>Location *</Label>
<LocationPicker
  locationName={locationName}
  lat={locationLat}
  lng={locationLng}
  onChange={(name, lat, lng) => {
    setLocationName(name);
    setLocationLat(lat);
    setLocationLng(lng);
  }}
/>
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 8: Manually test in Expo Go**

- Open the "Log Expedition" form
- Type 3+ characters in the location field — a dropdown of results should appear after ~1 second
- Tap a result — the field should lock and show the name with a ✕ button
- Tap ✕ — field should clear and become editable again
- Tap the GPS button — should request permission, then fill in your current location

- [ ] **Step 9: Commit**

```bash
git add app/expedition/new.tsx
git commit -m "feat: replace location TextInput with LocationPicker in expedition form"
```

---

## Task 5: Make location tappable in `ExpeditionCard`

**Files:**
- Modify: `src/components/ExpeditionCard.tsx`

- [ ] **Step 1: Add the `openInMaps` import**

At the top of `src/components/ExpeditionCard.tsx`, add:
```tsx
import { openInMaps } from '../lib/mapLink';
```

- [ ] **Step 2: Add `hasCoords` constant**

Inside `ExpeditionCard`, after the existing `const` declarations near the top (around line 47–56), add:

```tsx
const hasCoords = expedition.location_lat != null && expedition.location_lng != null;
```

- [ ] **Step 3: Replace the location `<Text>` with a conditional tappable version**

Find (around line 106):
```tsx
<Text style={[textStyles.postLocation, { marginBottom: 10 }]}>{locationLine}</Text>
```

Replace with:
```tsx
{hasCoords ? (
  <TouchableOpacity
    onPress={() => openInMaps(
      expedition.location ?? locationLine,
      expedition.location_lat!,
      expedition.location_lng!
    )}
    activeOpacity={0.7}
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
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Manually test in Expo Go**

- Post a new expedition using the updated form — pick a location from the autocomplete dropdown
- Go to the feed — the expedition card's location should show with a 📍 prefix and be underlined
- Tap it — the phone's map app should open at the location
- Old expeditions (no coords) should still show location as plain text with no tap behavior

- [ ] **Step 6: Commit**

```bash
git add src/components/ExpeditionCard.tsx
git commit -m "feat: make expedition location tappable to open in maps when coords present"
```

---

## Task 6: Push to GitHub

- [ ] **Step 1: Push the Cesar branch**

```bash
git push origin Cesar
```

- [ ] **Step 2: Merge to main and push**

```bash
git checkout main
git merge Cesar --ff-only
git push origin main
git checkout Cesar
```

Expected: main is up to date with all new commits.
