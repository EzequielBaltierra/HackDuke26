# Expedition Rework — Design Spec
Date: 2026-03-22

## Overview

Rework expeditions to behave like Instagram-style feed posts (non-navigable cards), require location, support full photo carousels, and allow users to "re-do" another user's expedition with shared trip count tracking and original creator attribution.

---

## 1. Database Changes

Apply via Supabase SQL Editor:

```sql
ALTER TABLE expeditions
  ADD COLUMN original_expedition_id uuid REFERENCES expeditions(id) ON DELETE SET NULL;

ALTER TABLE expeditions
  ADD COLUMN trip_count integer NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION increment_expedition_trip_count(expedition_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE expeditions SET trip_count = trip_count + 1 WHERE id = expedition_id;
$$;
```

- `original_expedition_id`: null for original expeditions; points to the **root** expedition for re-dos. The root is always the expedition where `original_expedition_id IS NULL`. The "Go on this expedition" button always resolves to the root before passing the ID — if the current card is itself a re-do, pass `expedition.original_expedition_id`; if it is a root, pass `expedition.id`.
- `trip_count`: lives on root expeditions only. Starts at 1 (the creator counts as one trip). Incremented by 1 via `increment_expedition_trip_count` each time someone posts a re-do. Re-do rows default to 1 but their `trip_count` is never read.
- `location` column stays nullable in the DB for backwards compatibility; existing null-location expeditions are handled gracefully in the UI (see §4 and §5).

---

## 2. TypeScript Types (`src/types/index.ts`)

Add to the `Expedition` type:

```ts
original_expedition_id: string | null;
trip_count: number;
original_expedition?: {
  id: string;
  trip_count: number;
  users?: Pick<User, 'username'>;
} | null;
```

---

## 3. Data Queries

### `src/hooks/useExpeditions.ts`

Update both the feed `.select()` **and** the `fetchById` `.select()` to:

```
*,
users!expeditions_user_id_fkey(id, username, profile_photo_url, total_points),
original_expedition:expeditions!expeditions_original_expedition_id_fkey(
  id, trip_count, users!expeditions_user_id_fkey(username)
)
```

### `src/hooks/useProfile.ts`

Update the expedition select in `fetchUserProfile` from its current narrow field list to the full select above (use `*` plus the two joins) so that `ExpeditionCard` has all the data it needs.

---

## 4. ExpeditionCard (`src/components/ExpeditionCard.tsx`)

### Auth access
Add `const { currentUser } = useAuth();` at the top of the component (using the existing `useAuth` hook). No prop needed.

### Remove navigation
- Remove all `onPress={() => router.push(...)}` wrappers from the title/description section and the footer.
- The card's top section and footer become plain `View`s.
- Photo carousel `TouchableOpacity` arrows remain — they control local `photoIndex` state only and do not navigate.

### Re-do attribution badge
If `expedition.original_expedition_id` is set, render a small pill directly above the title:

```
↩ Originally by @<expedition.original_expedition?.users?.username ?? 'Explorer'>
```

Style: `backgroundColor: colors.bgAccent`, `color: colors.redBase`, small rounded pill (`borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3`).

### Trip count in footer
Resolve the display count:
- If `expedition.original_expedition` is present → use `expedition.original_expedition.trip_count`
- Otherwise → use `expedition.trip_count`

Display in the footer stats bar as: `🥾 N people` (between duration and badges).

### "Go on this expedition" button
- Shown only when `currentUser && expedition.user_id !== currentUser.id`.
- Positioned below the footer bar, inside the card.
- Label: `Go on this expedition →`
- Resolves the root expedition ID: `const rootId = expedition.original_expedition_id ?? expedition.id`
- Navigates using Expo Router's object syntax (handles encoding automatically):

```ts
router.push({
  pathname: '/expedition/new',
  params: {
    originalId: rootId,
    originalTitle: expedition.title,
    originalLocation: expedition.location ?? '',
    originalType: expedition.type,
    originalDifficulty: expedition.difficulty ?? 'moderate',
    vibes: expedition.vibe_tags.join('|'),
  },
});
```

---

## 5. New Expedition Screen (`app/expedition/new.tsx`)

### Location required
Add after the existing title guard:
```ts
if (!location.trim()) {
  Alert.alert('Location required', 'Please add a location so others can find this expedition.');
  return;
}
```

### Re-do mode (params)
Read at the top of the component:
```ts
const { originalId, originalTitle, originalLocation, originalType, originalDifficulty, vibes } = useLocalSearchParams<{...}>();
const isRedo = Boolean(originalId);
```

Initialize state using param values when present:
- `title` → `originalTitle ?? ''`
- `location` → `originalLocation ?? ''`
- `type` → `(originalType as ExpeditionType) ?? 'hike'`
- `difficulty` → `(originalDifficulty as Difficulty) ?? 'moderate'`
- `selectedVibeTags` → `vibes ? (vibes as string).split('|').filter(Boolean) : []`
- `description` → always starts blank (user writes their own)
- `photos` → always starts empty (user adds their own photos)

Title field: render as `editable={false}` with `opacity: 0.6` style when `isRedo` is true, so it's visible but clearly locked.

### Post logic in re-do mode
After the expedition is inserted successfully:
```ts
if (isRedo && originalId) {
  await supabase.rpc('increment_expedition_trip_count', { expedition_id: originalId });
}
```
Insert includes `original_expedition_id: isRedo ? originalId : null`.

---

## 6. Profile Screen (`app/(tabs)/profile.tsx`)

Replace the tappable expedition row list with `ExpeditionCard` components:

```tsx
import { ExpeditionCard } from '../../src/components/ExpeditionCard';

{expeditions.length > 0 ? (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 16, fontWeight: '700', color: '#361319', paddingHorizontal: 16, marginBottom: 10 }}>
      Expeditions
    </Text>
    {expeditions.map(e => (
      <ExpeditionCard key={e.id} expedition={e as Expedition} />
    ))}
  </View>
) : null}
```

`fetchUserProfile` must return full expedition data (see §3). The `expeditions` type in the `Profile` type changes from `Partial<Expedition>[]` to `Expedition[]`.

---

## 7. Orphaned Routes

- `app/expedition/[id].tsx` — keep as-is. No longer linked from cards but preserved for any future deep-link use.
- `app/expedition/live.tsx` — keep as-is, unchanged.

---

## 8. Files Changed Summary

| File | Change |
|---|---|
| Supabase SQL (manual) | Add `original_expedition_id`, `trip_count` columns + `increment_expedition_trip_count` RPC |
| `src/types/index.ts` | Add `original_expedition_id`, `trip_count`, `original_expedition` to `Expedition` |
| `src/hooks/useExpeditions.ts` | Update both feed select and `fetchById` select to include `original_expedition` join |
| `src/hooks/useProfile.ts` | Update expedition select to full `*` + joins |
| `src/components/ExpeditionCard.tsx` | Remove nav, add `useAuth`, attribution badge, trip count, re-do button |
| `app/expedition/new.tsx` | Location required, re-do mode via `useLocalSearchParams`, `original_expedition_id` on insert, RPC call |
| `app/(tabs)/profile.tsx` | Replace expedition row list with `ExpeditionCard` components |

---

## Out of Scope

- `app/expedition/[id].tsx` — kept, not linked from cards
- `app/expedition/live.tsx` — unchanged
- Discovery cards — unchanged
- Leaderboard — unchanged
