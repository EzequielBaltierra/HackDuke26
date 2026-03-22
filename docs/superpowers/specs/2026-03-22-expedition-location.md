# Expedition Location Design

**Goal:** Replace the free-text location field in the expedition form with a proper location picker (autocomplete search + GPS), and make location tappable in expedition cards to open the phone's map app.

**Architecture:** A new `LocationPicker` component handles input, search, and GPS. The `expeditions` table gets `location_lat` and `location_lng` columns. `ExpeditionCard` opens the platform's map app via React Native `Linking` when coordinates are available.

**Tech Stack:** Nominatim (OpenStreetMap) REST API for geocoding/reverse-geocoding, `expo-location` for GPS, React Native `Linking` for deep-linking into map apps.

---

## Data Layer

Two new nullable columns added to the `expeditions` table in Supabase:

```sql
alter table expeditions add column location_lat numeric(10,6);
alter table expeditions add column location_lng numeric(10,6);
```

Precision matches the existing `discoveries` table (`numeric(10,6)` = ~0.11m precision, more than sufficient for GPS).

Applied manually in the Supabase SQL editor. `supabase/schema.sql` is also updated to keep the repo in sync. Existing rows retain `null` for both columns — no breaking change.

The `Expedition` TypeScript type (`src/types/index.ts`) gains:
```ts
location_lat: number | null;
location_lng: number | null;
```

---

## `LocationPicker` Component (`src/components/LocationPicker.tsx`)

Replaces the plain `TextInput` for location in the expedition form.

**Props:**
```ts
type Props = {
  locationName: string;
  lat: number | null;
  lng: number | null;
  onChange: (name: string, lat: number | null, lng: number | null) => void;
};
```

**Behavior:**
- Text input fires a debounced Nominatim search (1000ms delay, minimum 3 characters). 1000ms debounce ensures at most 1 request per second, satisfying Nominatim's rate limit policy.
- Nominatim endpoint:
  ```
  https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5
  ```
  All requests include the required `User-Agent` header:
  ```
  User-Agent: Root-HackDuke/1.0
  ```
- Only one search request is in-flight at a time — if a new query fires before the previous resolves, the previous response is discarded.
- Results appear as a dropdown list below the input (up to 5 items), showing `display_name`. The parent `ScrollView` must have `keyboardShouldPersistTaps="handled"` so dropdown items are tappable while the keyboard is up.
- "Use my location" button calls `expo-location` (`requestForegroundPermissionsAsync` + `getCurrentPositionAsync`), then reverse-geocodes via:
  ```
  https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json
  ```
  (Same `User-Agent` header required.)
- Once a result is selected (dropdown tap or GPS), the input locks to show the chosen name; a small "✕" clear button resets the field back to empty/editable state.
- While GPS is loading, the button shows a spinner and is disabled.
- Styled to match existing form: `#eaded0` background, `#4e705e` accents, `#c7af94` borders, `#361319` text.

**State:**
- `query` — current text in the input
- `results` — array of Nominatim results `{ place_id, display_name, lat, lon }`
- `gpsLoading` — GPS loading state
- `locked` — whether a result has been selected (input non-editable)

**Error handling:**
- Nominatim search failure: silently clear results; user can still type a plain name (lat/lng remain null)
- GPS permission denied: show brief inline message "Location permission needed"; button resets
- GPS error / timeout: show "Couldn't get location"; button resets

---

## Expedition Form Changes (`app/expedition/new.tsx`)

- Replace the plain `TextInput` for Location with `<LocationPicker>`
- Form state changes from `location: string` to:
  ```ts
  const [locationName, setLocationName] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  ```
- `onChange` handler: `(name, lat, lng) => { setLocationName(name); setLocationLat(lat); setLocationLng(lng); }`
- Validation: location is still required (`locationName.trim()` must be non-empty)
- Supabase insert gains `location_lat: locationLat, location_lng: locationLng`
- Parent `ScrollView` has `keyboardShouldPersistTaps="handled"` added so dropdown results are tappable

**Redo expedition behavior:** The location field is **editable** on redo — `locationName` initializes from `params.originalLocation` as a prefilled starting value, but the user can clear and re-search since they may be going to a different spot. `lat`/`lng` start as `null` and are only set once the user selects a result. This is consistent with distance and description fields (also editable on redo).

---

## Tappable Location in `ExpeditionCard`

The location line in `ExpeditionCard` (`src/components/ExpeditionCard.tsx`) becomes tappable when coordinates are present.

**Logic:**
```ts
const hasCoords = expedition.location_lat != null && expedition.location_lng != null;
```

**Map link utility (`src/lib/mapLink.ts`):**
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

**In `ExpeditionCard`:**
- When `hasCoords`: wrap location text in `TouchableOpacity` that calls `openInMaps`; add a small map pin icon prefix to signal it's tappable
- When no coords: plain `<Text>` as today — no broken behavior for older expeditions or redo-prefilled cards

---

## Out of Scope

- Live expedition location tracking (teammate's responsibility)
- Location on discoveries (already handled separately)
- Embedded map preview in the card
