# Expedition Location Design

**Goal:** Replace the free-text location field in the expedition form with a proper location picker (autocomplete search + GPS), and make location tappable in expedition cards to open the phone's map app.

**Architecture:** A new `LocationPicker` component handles input, search, and GPS. The `expeditions` table gets `location_lat` and `location_lng` columns. `ExpeditionCard` opens the platform's map app via `expo-linking` when coordinates are available.

**Tech Stack:** Nominatim (OpenStreetMap) REST API for geocoding/reverse-geocoding, `expo-location` for GPS, `expo-linking` for deep-linking into map apps.

---

## Data Layer

Two new nullable columns added to the `expeditions` table in Supabase:

```sql
alter table expeditions add column location_lat numeric(10,7);
alter table expeditions add column location_lng numeric(10,7);
```

Applied manually in the Supabase SQL editor. Existing rows retain `null` for both columns — no breaking change.

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
- Text input fires a debounced Nominatim search (300ms delay, minimum 3 characters)
- Nominatim endpoint: `https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5`
- Results appear as a dropdown list below the input (up to 5 items), showing `display_name`
- "Use my location" button calls `expo-location` (`requestForegroundPermissionsAsync` + `getCurrentPositionAsync`), then reverse-geocodes via `https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json` to get a display name
- Once a result is selected (dropdown tap or GPS), the input locks to show the chosen name; a small "✕" clear button resets the field back to empty/editable
- While GPS is loading, the button shows a spinner and is disabled
- Styled to match existing form: `#eaded0` background, `#4e705e` accents, `#c7af94` borders, `#361319` text

**State:**
- `query` — current text in the input
- `results` — array of Nominatim results
- `loading` — GPS loading state
- `locked` — whether a result has been selected (input non-editable)

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
- Redo prefill: `locationName` initializes from `params.originalLocation`, `lat`/`lng` start as `null` — user must re-confirm location (they may be going somewhere new)
- The `LocationPicker` receives `editable={!isRedo}` — locked to original name on redo, same as today's text field behavior

---

## Tappable Location in `ExpeditionCard`

The location line in `ExpeditionCard` (`src/components/ExpeditionCard.tsx`) becomes tappable when coordinates are present.

**Logic:**
```ts
const hasCoords = expedition.location_lat != null && expedition.location_lng != null;
```

**URL construction (`src/lib/mapLink.ts`):**
```ts
import { Linking, Platform } from 'react-native';

export function openInMaps(name: string, lat: number, lng: number) {
  const encodedName = encodeURIComponent(name);
  const url = Platform.select({
    ios: `maps://maps.apple.com/?q=${encodedName}&ll=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedName})`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  });
  Linking.openURL(url!).catch(() => {
    // fallback to Google Maps web
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  });
}
```

**In `ExpeditionCard`:**
- When `hasCoords`: wrap location text in `TouchableOpacity` that calls `openInMaps`; add a small `📍` prefix to signal it's tappable
- When no coords: plain `<Text>` as today — no broken behavior for older expeditions

---

## Error Handling

- Nominatim search failure (network error): silently clear results, user can still type a plain name
- GPS permission denied: show brief inline message "Location permission needed"; button resets
- GPS timeout / error: show "Couldn't get location"; button resets
- `Linking.openURL` failure: caught and falls back to Google Maps web URL

---

## Out of Scope

- Live expedition location tracking (teammate's responsibility)
- Location on discoveries (already uses `location_lat`/`location_lng` separately)
- Map preview or embedded map in the card
