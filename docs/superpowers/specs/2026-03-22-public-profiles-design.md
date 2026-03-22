# Public User Profiles — Design Spec
**Date:** 2026-03-22
**Project:** Root — HackDuke 2026

---

## Overview

Allow users to view any other user's profile by tapping their username/avatar in feed cards, the leaderboard, or search results. The search tab gains a "People" section for finding users by username.

---

## New Screen: `app/user/[id].tsx`

A read-only public profile screen, navigated to via `router.push('/user/<userId>')`.

**Displays:**
- Avatar (profile photo or 🌿 fallback)
- Username (`@handle`)
- Bio (read-only)
- Stats row: Points · Streak · Discoveries count
- Badges
- Discovery photo grid

**Does NOT show:** edit controls, sign-out button, or expeditions list.

**Data:** Reuses `fetchUserProfile(userId)` from `src/hooks/useProfile.ts`. The expeditions query runs but the result is unused — acceptable for hackathon scope.

---

## Tappable Usernames in Feed Cards

### The TouchableOpacity Nesting Problem

Both `DiscoveryCard` and `ExpeditionCard` wrap the entire card header in a `TouchableOpacity` that opens the detail screen. Nesting another `TouchableOpacity` inside for the user row causes unreliable event handling on Android.

**Fix:** Split the card header into two separate, non-nested regions:
1. A plain `View` wrapping `FeedUserRow` — which internally has its own `TouchableOpacity` for the user tap
2. A `TouchableOpacity` wrapping only the title/body/location content below the user row — pressing this opens the detail screen

The image and footer `TouchableOpacity`s remain unchanged.

### FeedUserRow Changes (`feedCardUtils.tsx`)

Add `onPressUser?: () => void` to the props (matching the existing optional `onPressFollow?` pattern). When `onPressUser` is provided, wrap the avatar + username in a `TouchableOpacity`; when undefined, render a plain `View` instead — so there is no tappable-but-inert element.

### Wiring in Cards

- `DiscoveryCard`: passes `onPressUser: () => router.push('/user/' + discovery.users?.id)` — guarded: if `discovery.users?.id` is undefined, pass `undefined` so no navigation fires
- `ExpeditionCard`: same pattern with `expedition.users?.id`

### Leaderboard

Make each row a `TouchableOpacity` navigating to `/user/<id>`. The current-user row ("you") navigates to own profile the same way — no special casing.

---

## Search: People Section

### Architecture

The existing `SectionList` is typed for `{ kind: 'discovery' | 'expedition'; item: Discovery | Expedition }`. Adding a People section requires a different approach to avoid widening this type and breaking the `renderItem` callback.

**Solution:** Render People results as a separate `FlatList` (or plain mapped `View`) **above** the existing `SectionList`, not inside it. This keeps the `SectionList` type unchanged and lets People results render independently.

Layout:
```
<SafeAreaView>
  <SearchBar />
  {usersResults.length > 0 && <PeopleSection users={usersResults} />}
  <SectionList ... />   ← discoveries + expeditions unchanged
</SafeAreaView>
```

The `SectionList`'s `ListEmptyComponent` already handles the "no discoveries/expeditions" states correctly and is unaffected by People results.

### People Row

A new inline component `UserResultRow` renders: avatar, `@username`, points + streak, and a `›` chevron. Tapping navigates to `/user/<id>`.

### Supabase Query

```ts
supabase
  .from('users')
  .select('id, username, total_points, streak, profile_photo_url')
  .ilike('username', `%${query}%`)
  .limit(10)
```

Triggered when `query.length >= 2`. Debounced 300ms via `useEffect` with `clearTimeout` cleanup to prevent stale state updates.

---

## Files Changed

| File | Change |
|---|---|
| `app/user/[id].tsx` | **New** — read-only public profile screen |
| `src/components/feed/feedCardUtils.tsx` | Add `onPressUser?: () => void` to `FeedUserRow`; conditionally wrap avatar+username |
| `src/components/DiscoveryCard.tsx` | Remove outer header `TouchableOpacity`; wire `onPressUser` |
| `src/components/ExpeditionCard.tsx` | Remove outer header `TouchableOpacity`; wire `onPressUser` |
| `app/(tabs)/leaderboard.tsx` | Make rows tappable → `/user/<id>` |
| `app/(tabs)/search.tsx` | Add People `FlatList` above `SectionList`; debounced Supabase user query |

---

## Implementation Notes

- `SectionList` in `search.tsx` must have `style={{ flex: 1 }}` so it fills remaining height once the People section is inserted above it as a sibling
- While touching `FeedUserRow`, remove the no-op follow `+` button on cards where `onPressFollow` is not provided (it currently fires an empty handler on every tap)
- Add a comment in `app/user/[id].tsx` noting that the expeditions fetch result is intentionally unused

---

## Edge Cases

- **Own username tapped:** navigates to `/user/<yourId>` — same read-only view, acceptable
- **No user results:** People section not rendered (conditional on `usersResults.length > 0`)
- **Missing user join:** if `discovery.users?.id` is undefined, `onPressUser` is `undefined` — no tappable target rendered
- **Back navigation:** Expo Router stack handles back from `/user/[id]` automatically
- **Debounce cleanup:** `useEffect` returns `clearTimeout` to cancel pending queries on query change or unmount
