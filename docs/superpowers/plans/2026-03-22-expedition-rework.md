# Expedition Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework expeditions into non-navigable Instagram-style feed cards with photo carousels, required location, original-creator attribution, and a "Go on this expedition" re-do flow that tracks a shared trip count across all versions.

**Architecture:** Add `original_expedition_id` and `trip_count` columns to the expeditions table (Option A from spec). The root expedition owns the trip count; re-do cards join back to the root to read it. ExpeditionCard becomes a fully self-contained display component with no navigation, a re-do button, and a trip count badge. The self-join for `original_expedition` uses a simple flat select (no nested user join) to avoid PostgREST compatibility issues; the original creator username is stored as a denormalized `original_creator_username` text column populated at insert time.

**Tech Stack:** React Native, Expo SDK 54, Expo Router v6 (file-based routing + `useLocalSearchParams`), Supabase JS v2 (PostgreSQL + RPC), TypeScript.

**Spec:** `docs/superpowers/specs/2026-03-22-expedition-rework-design.md`

---

## File Map

| File | Action | What changes |
|---|---|---|
| Supabase SQL (manual step) | SQL run in dashboard | Two new columns + one text column + one RPC |
| `src/types/index.ts` | Modify | Add 4 fields to `Expedition` type |
| `src/hooks/useExpeditions.ts` | Modify | Update both `.select()` calls to join `original_expedition` |
| `src/hooks/useProfile.ts` | Modify | Update expedition select to full `*` + joins |
| `src/components/ExpeditionCard.tsx` | Modify | Remove all nav (3 TouchableOpacity wrappers), add `useAuth`, attribution badge, trip count, re-do button |
| `app/expedition/new.tsx` | Modify | Location required + re-do mode via URL params + populate `original_creator_username` |
| `app/(tabs)/profile.tsx` | Modify | Replace expedition row list with `ExpeditionCard` |

---

## Task 1: Apply database changes in Supabase

**Files:** No code files — manual SQL step.

- [ ] **Step 1: Open Supabase SQL Editor**

Go to your Supabase project → SQL Editor → New query.

- [ ] **Step 2: Run the migration**

```sql
ALTER TABLE expeditions
  ADD COLUMN IF NOT EXISTS original_expedition_id uuid REFERENCES expeditions(id) ON DELETE SET NULL;

ALTER TABLE expeditions
  ADD COLUMN IF NOT EXISTS trip_count integer NOT NULL DEFAULT 1;

ALTER TABLE expeditions
  ADD COLUMN IF NOT EXISTS original_creator_username text;

CREATE OR REPLACE FUNCTION increment_expedition_trip_count(expedition_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE expeditions SET trip_count = trip_count + 1 WHERE id = expedition_id;
$$;
```

- [ ] **Step 3: Verify**

Run:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'expeditions'
  AND column_name IN ('original_expedition_id', 'trip_count', 'original_creator_username');
```
Expected: 3 rows returned.

---

## Task 2: Update TypeScript types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add new fields to the `Expedition` type**

Open `src/types/index.ts`. The current `Expedition` type ends with:
```ts
  users?: User;
  discoveries?: Discovery[];
  participants?: User[];
};
```

Replace that closing block with:
```ts
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

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors related to `Expedition`.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add original_expedition_id, trip_count, original_creator_username to Expedition type"
```

---

## Task 3: Update data queries

**Files:**
- Modify: `src/hooks/useExpeditions.ts`
- Modify: `src/hooks/useProfile.ts`

The full select string to use everywhere expeditions are fetched (note: `original_expedition` join is flat — no nested user join — to ensure PostgREST compatibility):

```
*, users!expeditions_user_id_fkey(id, username, profile_photo_url, total_points), original_expedition:expeditions!expeditions_original_expedition_id_fkey(id, trip_count)
```

- [ ] **Step 1: Update `useExpeditions.ts` — feed query**

Open `src/hooks/useExpeditions.ts`. In `fetchFeed`, find:
```ts
      .select('*, users!expeditions_user_id_fkey(id, username, profile_photo_url, total_points)')
```
Replace with:
```ts
      .select('*, users!expeditions_user_id_fkey(id, username, profile_photo_url, total_points), original_expedition:expeditions!expeditions_original_expedition_id_fkey(id, trip_count)')
```

- [ ] **Step 2: Update `useExpeditions.ts` — fetchById query**

In `fetchById`, find the same `.select(...)` string and replace with the same full string from Step 1.

- [ ] **Step 3: Update `useProfile.ts` — expedition select**

Open `src/hooks/useProfile.ts`. Find:
```ts
    supabase.from('expeditions').select('id, title, type, points_earned, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
```
Replace with:
```ts
    supabase.from('expeditions').select('*, users!expeditions_user_id_fkey(id, username, profile_photo_url, total_points), original_expedition:expeditions!expeditions_original_expedition_id_fkey(id, trip_count)').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
```

Also update the return type. Find:
```ts
    expeditions: (expeditionsRes.data ?? []) as Partial<Expedition>[],
```
Replace with:
```ts
    expeditions: (expeditionsRes.data ?? []) as Expedition[],
```

- [ ] **Step 4: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useExpeditions.ts src/hooks/useProfile.ts
git commit -m "feat: add original_expedition join to all expedition queries"
```

---

## Task 4: Rework ExpeditionCard

**Files:**
- Modify: `src/components/ExpeditionCard.tsx`

The current file has THREE `TouchableOpacity` wrappers that call `openDetail`: (1) the top content section, (2) the photo image, and (3) the footer. All three must be replaced with plain `View`s. The photo carousel arrows (prev/next) are separate `TouchableOpacity`s that only change `photoIndex` state — leave those alone.

- [ ] **Step 1: Add useAuth import and call**

Add to the existing import block at the top:
```ts
import { useAuth } from '../hooks/useAuth';
```

Inside `export function ExpeditionCard({ expedition }: Props)`, add as the first line of the function body:
```ts
  const { currentUser } = useAuth();
```

Keep the `useRouter` import — it is still needed for the re-do button.

- [ ] **Step 2: Remove the `openDetail` function**

Find and delete this line:
```ts
  const openDetail = () => router.push(`/expedition/${expedition.id}`);
```

- [ ] **Step 3: Add `displayTripCount` computed value**

Alongside the other computed values at the top of the component (`distanceStr`, `durationStr`, `locationLine`), add:
```ts
  const displayTripCount = expedition.original_expedition?.trip_count ?? expedition.trip_count ?? 1;
```

- [ ] **Step 4: Remove navigation from the top section**

Find:
```tsx
      <TouchableOpacity activeOpacity={0.95} onPress={openDetail}>
        <View style={{ padding: 16, paddingBottom: 10 }}>
```
Replace with:
```tsx
      <View style={{ padding: 16, paddingBottom: 10 }}>
```
And remove the matching closing `</TouchableOpacity>` tag that wraps this section.

- [ ] **Step 5: Add re-do attribution badge**

Inside the now-unwrapped content View (the one with `padding: 16, paddingBottom: 10`), add this block directly ABOVE the title `<Text>` (the line `<Text style={[textStyles.postTitle, ...`):

```tsx
          {expedition.original_expedition_id ? (
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: colors.bgAccent,
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 3,
                marginBottom: 6,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.redBase, fontWeight: '600' }}>
                ↩ Originally by @{expedition.original_creator_username ?? 'Explorer'}
              </Text>
            </View>
          ) : null}
```

- [ ] **Step 6: Remove navigation from the photo image**

Inside the photos section, find:
```tsx
          <TouchableOpacity onPress={openDetail} activeOpacity={0.95}>
            <Image source={{ uri: photos[photoIndex] }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
          </TouchableOpacity>
```
Replace with:
```tsx
          <Image source={{ uri: photos[photoIndex] }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
```

- [ ] **Step 7: Remove navigation from the footer and add trip count**

Find the footer section:
```tsx
      {showFooter ? (
        <TouchableOpacity activeOpacity={0.95} onPress={openDetail}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: colors.bgAccent,
            }}
          >
```
Replace the outer `TouchableOpacity` + inner `View` with just the `View`:
```tsx
      {showFooter ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.bgAccent,
          }}
        >
```
And remove the matching `</TouchableOpacity>` closing tag. Keep the footer's inner content intact.

Inside the footer, after the `<FeedBadgeShields />` section, add the trip count display:
```tsx
            <View style={{ alignItems: 'center', paddingHorizontal: 6 }}>
              <Text style={[textStyles.duration, { fontSize: 12 }]}>🥾 {displayTripCount}</Text>
            </View>
```

- [ ] **Step 8: Add "Go on this expedition" button**

After the `{showFooter ? ... : null}` closing block, and before the outer card closing `</View>`, add:

```tsx
      {currentUser && expedition.user_id !== currentUser.id ? (
        <TouchableOpacity
          onPress={() => {
            const rootId = expedition.original_expedition_id ?? expedition.id;
            router.push({
              pathname: '/expedition/new',
              params: {
                originalId: rootId,
                originalTitle: expedition.title,
                originalLocation: expedition.location ?? '',
                originalType: expedition.type,
                originalDifficulty: expedition.difficulty ?? 'moderate',
                vibes: (expedition.vibe_tags ?? []).join('|'),
                originalCreatorUsername: expedition.original_creator_username ?? expedition.users?.username ?? '',
              },
            });
          }}
          style={{
            margin: 12,
            marginTop: 8,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: colors.greenBase,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.greenBase, fontWeight: '700', fontSize: 14 }}>
            Go on this expedition →
          </Text>
        </TouchableOpacity>
      ) : null}
```

Note: `originalCreatorUsername` is passed so `new.tsx` can store the original root creator's username when posting a re-do.

- [ ] **Step 9: Verify in Expo Go**

Navigate to the feed. Confirm:
- Expedition cards appear as static posts (tapping card body does nothing)
- Photo carousel arrows still work
- Trip count shows `🥾 1` for all existing expeditions
- "Go on this expedition" button appears on other users' cards only

- [ ] **Step 10: Commit**

```bash
git add src/components/ExpeditionCard.tsx
git commit -m "feat: rework ExpeditionCard — remove nav, add re-do button, attribution badge, trip count"
```

---

## Task 5: Update new expedition screen

**Files:**
- Modify: `app/expedition/new.tsx`

- [ ] **Step 1: Add `useLocalSearchParams` import**

Find the expo-router import line:
```ts
import { useRouter } from 'expo-router';
```
Replace with:
```ts
import { useRouter, useLocalSearchParams } from 'expo-router';
```

- [ ] **Step 2: Read params and set up re-do mode**

Inside `NewExpeditionScreen`, directly after the `const router` and `const { currentUser }` lines, add:

```ts
  const params = useLocalSearchParams<{
    originalId?: string;
    originalTitle?: string;
    originalLocation?: string;
    originalType?: string;
    originalDifficulty?: string;
    vibes?: string;
    originalCreatorUsername?: string;
  }>();
  const isRedo = Boolean(params.originalId);
```

- [ ] **Step 3: Initialize state from params**

Replace the current individual `useState` declarations for title, description, type, location, distance, difficulty, and selectedVibeTags with param-aware versions:

```ts
  const [title, setTitle] = useState(params.originalTitle ?? '');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ExpeditionType>((params.originalType as ExpeditionType) ?? 'hike');
  const [location, setLocation] = useState(params.originalLocation ?? '');
  const [distance, setDistance] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>((params.originalDifficulty as Difficulty) ?? 'moderate');
  const [selectedVibeTags, setSelectedVibeTags] = useState<string[]>(
    params.vibes ? (params.vibes as string).split('|').filter(Boolean) : []
  );
```

All other `useState` calls (`photos`, `posting`, `pointsBreakdown`, `showToast`) stay unchanged.

- [ ] **Step 4: Make title field read-only in re-do mode**

Find the Title TextInput:
```tsx
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Morning hike at Eno River"
          placeholderTextColor="#c7af94" style={inputStyle} />
```
Replace with:
```tsx
        <TextInput
          value={title}
          onChangeText={isRedo ? undefined : setTitle}
          editable={!isRedo}
          placeholder="e.g. Morning hike at Eno River"
          placeholderTextColor="#c7af94"
          style={[inputStyle, isRedo ? { opacity: 0.6 } : null]}
        />
```

- [ ] **Step 5: Add location required guard**

In `postExpedition`, after the existing title+user guard:
```ts
    if (!title.trim() || !currentUser) {
      Alert.alert('Missing info', 'Please add a title.');
      return;
    }
```
Add immediately after:
```ts
    if (!location.trim()) {
      Alert.alert('Location required', 'Please add a location so others can find this expedition.');
      return;
    }
```

- [ ] **Step 6: Add `original_expedition_id` and `original_creator_username` to insert**

Find the `.insert({` call in `postExpedition`. Add two fields to the insert object:
```ts
        original_expedition_id: isRedo ? (params.originalId ?? null) : null,
        original_creator_username: isRedo
          ? (params.originalCreatorUsername || null)
          : null,
```

The full insert object should look like:
```ts
      const { data: expedition } = await supabase.from('expeditions').insert({
        user_id: currentUser.id,
        title: title.trim(),
        description: description.trim() || null,
        type,
        location: location.trim() || null,
        distance: distanceKm,
        difficulty,
        vibe_tags: selectedVibeTags,
        photo_urls: photoUrls,
        is_live: false,
        points_earned: totalPoints,
        original_expedition_id: isRedo ? (params.originalId ?? null) : null,
        original_creator_username: isRedo ? (params.originalCreatorUsername || null) : null,
      }).select().single();
```

- [ ] **Step 7: Increment trip count after insert**

After the `expedition_participants` block and before `awardPoints`, add:

```ts
      if (isRedo && params.originalId) {
        await supabase.rpc('increment_expedition_trip_count', { expedition_id: params.originalId });
      }
```

Note: the increment happens after the insert. In the unlikely event the app crashes between insert and increment, the count will be off by one. Acceptable for hackathon scope.

- [ ] **Step 8: Test re-do flow manually**

In Expo Go:
1. Find another user's expedition card in the feed
2. Tap "Go on this expedition →"
3. Verify: form opens with title pre-filled and grayed, location/type/difficulty pre-filled, vibes pre-selected, description blank, photos empty
4. Add a photo, fill location if empty, tap Post
5. Verify: new expedition appears in feed with "↩ Originally by @username" badge
6. Verify: the original expedition's `🥾` count incremented by 1

- [ ] **Step 9: Commit**

```bash
git add app/expedition/new.tsx
git commit -m "feat: add location required + re-do mode to new expedition screen"
```

---

## Task 6: Update profile screen expedition display

**Files:**
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Add ExpeditionCard import**

At the top of `app/(tabs)/profile.tsx`, add:
```ts
import { ExpeditionCard } from '../../src/components/ExpeditionCard';
```

- [ ] **Step 2: Update the Profile type**

Find:
```ts
type Profile = {
  user: User | null;
  badges: Badge[];
  discoveries: Partial<Discovery>[];
  expeditions: Partial<Expedition>[];
};
```
Change `expeditions` type:
```ts
type Profile = {
  user: User | null;
  badges: Badge[];
  discoveries: Partial<Discovery>[];
  expeditions: Expedition[];
};
```

- [ ] **Step 3: Replace expedition row list with ExpeditionCard**

Find the entire expeditions section (it starts with `{/* Expeditions list */}`):
```tsx
        {/* Expeditions list */}
        {expeditions.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#361319', marginBottom: 10 }}>Expeditions</Text>
            {expeditions.map(e => (
              <TouchableOpacity
                key={e.id}
                onPress={() => router.push(`/expedition/${e.id}`)}
                style={{
                  backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 8,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  borderWidth: 1, borderColor: '#c7af94',
                }}
              >
                <Text style={{ fontSize: 15, color: '#361319', fontWeight: '600', flex: 1 }}>{e.title}</Text>
                <Text style={{ fontSize: 13, color: '#4e705e', fontWeight: '700' }}>+{e.points_earned}pts →</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
```

Replace with:
```tsx
        {/* Expeditions feed */}
        {expeditions.length > 0 ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#361319', paddingHorizontal: 16, marginBottom: 10 }}>
              Expeditions
            </Text>
            {expeditions.map(e => (
              <ExpeditionCard key={e.id} expedition={e} />
            ))}
          </View>
        ) : null}
```

- [ ] **Step 4: Verify `router` is still in scope**

`router` is still used for `router.replace('/login')` in the sign-out handler. Do not remove the `useRouter` or `router` declarations.

- [ ] **Step 5: Verify in Expo Go**

Navigate to Profile tab. Confirm:
- Expeditions show as full cards (photos, tags, stats, trip count)
- "Go on this expedition" button does NOT appear on your own cards

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat: show expedition cards in profile instead of list rows"
```

---

## Task 7: Push and merge to main

- [ ] **Step 1: Push Cesar branch**

```bash
git push origin Cesar
```

- [ ] **Step 2: Merge into main**

```bash
git checkout main
git pull origin main
git merge Cesar --no-edit
git push origin main
git checkout Cesar
```
