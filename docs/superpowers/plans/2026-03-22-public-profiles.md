# Public User Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only public profile screen reachable by tapping any username in the app or searching by username in the search tab.

**Architecture:** New `app/user/[id].tsx` screen powered by the existing `fetchUserProfile` hook. `FeedUserRow` gains an optional `onPressUser` prop that conditionally wraps the avatar+username in a `TouchableOpacity`. Discovery/Expedition cards restructure their headers to avoid nested-TouchableOpacity conflicts. Search gains a People section rendered as a separate list above the existing SectionList.

**Tech Stack:** React Native, Expo Router v6, TypeScript, Supabase JS v2, existing theme (`src/theme/colors.ts`, `src/theme/typography.ts`)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/user/[id].tsx` | **Create** | Read-only public profile screen |
| `src/components/feed/feedCardUtils.tsx` | **Modify** | Add `onPressUser` prop to `FeedUserRow`; remove no-op follow button when unused |
| `src/components/DiscoveryCard.tsx` | **Modify** | Restructure header; wire `onPressUser` |
| `src/components/ExpeditionCard.tsx` | **Modify** | Restructure header; wire `onPressUser` |
| `app/(tabs)/leaderboard.tsx` | **Modify** | Make each row tappable → `/user/<id>` |
| `app/(tabs)/search.tsx` | **Modify** | Add People section + debounced Supabase user query |

---

## Task 1: Create `app/user/[id].tsx` — Public Profile Screen

**Files:**
- Create: `app/user/[id].tsx`

This screen fetches a user's profile by the `id` route param and renders it read-only. No edit controls, no sign-out, no expeditions list.

- [ ] **Step 1: Create the file**

```tsx
// app/user/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchUserProfile } from '../../src/hooks/useProfile';
import { colors } from '../../src/theme/colors';
import { textStyles } from '../../src/theme/typography';
import { Badge, Discovery, User } from '../../src/types';

const BADGE_LABELS: Record<string, string> = {
  first_discovery: '🌿 First Discovery',
  trailblazer: '🥾 Trailblazer',
  explorer: '⛰ Explorer',
  rare_finder: '🌟 Rare Finder',
  social_explorer: '👥 Social Explorer',
};

type Profile = {
  user: User | null;
  badges: Badge[];
  discoveries: Partial<Discovery>[];
};

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchUserProfile(id as string)
      .then(data => {
        if (!data.user) {
          setNotFound(true);
        } else {
          setProfile(data);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary }}>
        <ActivityIndicator size="large" color={colors.greenBase} />
      </SafeAreaView>
    );
  }

  if (notFound || !profile?.user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary, padding: 24 }}>
        <Text style={{ fontSize: 48 }}>🌿</Text>
        <Text style={[textStyles.postTitle, { marginTop: 12, textAlign: 'center' }]}>Explorer not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24 }}>
          <Text style={{ color: colors.greenBase, fontSize: 16 }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { user, badges, discoveries } = profile;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <SafeAreaView>
        {/* Header */}
        <View style={{ padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.bgAccent }}>
          {user.profile_photo_url ? (
            <Image
              source={{ uri: user.profile_photo_url }}
              style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: colors.bgAccent, marginBottom: 12 }}
            />
          ) : (
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.greenBase, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.bgAccent, marginBottom: 12 }}>
              <Text style={{ fontSize: 36 }}>🌿</Text>
            </View>
          )}
          <Text style={[textStyles.userName, { fontSize: 22, fontWeight: '800' }]}>@{user.username}</Text>
          {user.bio ? (
            <Text style={[textStyles.postDescription, { color: colors.redBase, textAlign: 'center', marginTop: 4 }]}>{user.bio}</Text>
          ) : null}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', margin: 16, gap: 12 }}>
          {[
            { emoji: '⭐', value: user.total_points.toLocaleString(), label: 'Points' },
            { emoji: '🔥', value: `${user.streak}d`, label: 'Streak' },
            { emoji: '🔍', value: discoveries.length.toString(), label: 'Spots' },
          ].map(({ emoji, value, label }) => (
            <View key={label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.bgAccent }}>
              <Text style={{ fontSize: 24 }}>{emoji}</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.greenBase, marginTop: 4 }}>{value}</Text>
              <Text style={{ fontSize: 10, color: colors.redBase, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        {badges.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={[textStyles.postTitle, { marginBottom: 10 }]}>Badges</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {badges.map(b => (
                <View key={b.id} style={{ backgroundColor: colors.bgAccent, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.redAccent }}>
                    {BADGE_LABELS[b.badge_type] ?? b.badge_type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Discovery grid */}
        {discoveries.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={[textStyles.postTitle, { marginBottom: 10 }]}>Discoveries</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {discoveries.map(d =>
                d.image_url ? (
                  <Image key={d.id} source={{ uri: d.image_url }} style={{ width: 100, height: 100, borderRadius: 10 }} />
                ) : null
              )}
            </View>
          </View>
        ) : null}

        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={{ margin: 16, padding: 14, borderRadius: 12, backgroundColor: colors.bgAccent, alignItems: 'center' }}>
          <Text style={{ color: colors.redAccent, fontWeight: '700', fontSize: 15 }}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Verify the file was created at the correct path**

The file must be at `app/user/[id].tsx` (square brackets, not angle brackets). Expo Router will expose this as `/user/<userId>`.

- [ ] **Step 3: Commit**

```bash
git add 'app/user/[id].tsx'
git commit -m "feat: add public profile screen app/user/[id]"
```

---

## Task 2: Update `FeedUserRow` in `feedCardUtils.tsx`

**Files:**
- Modify: `src/components/feed/feedCardUtils.tsx`

Add `onPressUser?: () => void` prop. When provided, wrap avatar+username in a `TouchableOpacity`; when absent, use a plain `View`. Also remove the no-op follow button when `onPressFollow` is not provided (it currently renders an empty `+` button on every card).

- [ ] **Step 1: Update `FeedUserRow`**

Replace the entire `FeedUserRow` function (lines 74–124 in the current file) with:

```tsx
export function FeedUserRow({
  user,
  onPressUser,
  onPressFollow,
}: {
  user: User | undefined;
  onPressUser?: () => void;
  onPressFollow?: () => void;
}) {
  const name = user?.username ?? 'Explorer';
  const pts = (user?.total_points ?? 0).toLocaleString();

  const UserInfo = (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0, paddingRight: 4 }}>
      <FeedAvatar user={user} />
      <View style={{ flex: 1 }}>
        <Text style={[textStyles.userName, { flexShrink: 1 }]} numberOfLines={1}>{name}</Text>
        <Text style={[textStyles.userPoints, { flexShrink: 0 }]}>{pts} pts</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      {onPressUser ? (
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={onPressUser}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }}
        >
          {UserInfo}
        </TouchableOpacity>
      ) : (
        <View style={{ flex: 1 }}>{UserInfo}</View>
      )}
      {onPressFollow ? (
        <TouchableOpacity
          onPress={onPressFollow}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Follow"
        >
          <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.redAccent, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: colors.redAccent, marginTop: -2, fontFamily: textStyles.postTitle.fontFamily }}>+</Text>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
```

Note: `FeedAvatar` is moved inside the `UserInfo` block so both avatar and username are tappable together.

- [ ] **Step 2: Commit**

```bash
git add src/components/feed/feedCardUtils.tsx
git commit -m "feat: add onPressUser to FeedUserRow, suppress no-op follow button"
```

---

## Task 3: Restructure `DiscoveryCard.tsx` header

**Files:**
- Modify: `src/components/DiscoveryCard.tsx`

The current card wraps the entire header in one `TouchableOpacity`. This prevents the inner `onPressUser` touch from working reliably. Split the header: `FeedUserRow` in a plain `View`, title/body in its own `TouchableOpacity`.

- [ ] **Step 1: Update the header section of `DiscoveryCard`**

Replace the outer header `TouchableOpacity` block (currently lines 55–98) with:

```tsx
{/* User row — plain View so inner TouchableOpacity works */}
<View style={{ padding: 16, paddingBottom: 0 }}>
  <FeedUserRow
    user={discovery.users}
    onPressUser={discovery.users?.id ? () => router.push(`/user/${discovery.users!.id}`) : undefined}
  />
</View>

{/* Card body — taps open detail */}
<TouchableOpacity activeOpacity={0.95} onPress={openDetail}>
  <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
    <Text style={[textStyles.postTitle, { marginBottom: 4 }]}>{discovery.common_name}</Text>

    {discovery.scientific_name ? (
      <Text style={{ fontFamily: textStyles.postDescription.fontFamily, fontSize: 15, color: colors.redBase, fontStyle: 'italic', marginBottom: 6 }}>
        {discovery.scientific_name}
      </Text>
    ) : null}

    <Text style={[textStyles.postLocation, { marginBottom: 10 }]}>{discoveryLocationLine(discovery)}</Text>

    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
      <View style={{ borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: colors.bgAccent, borderWidth: 1, borderColor: colors.redBase }}>
        <Text style={textStyles.vibeTag}>{categoryLabel[discovery.category] ?? discovery.category}</Text>
      </View>
    </View>

    {discovery.caption ? (
      <Text style={[textStyles.postDescription, { opacity: 0.92, marginBottom: 12 }]} numberOfLines={8}>
        {discovery.caption}
      </Text>
    ) : null}
  </View>
</TouchableOpacity>
```

The image and footer `TouchableOpacity` blocks below are unchanged.

- [ ] **Step 2: Commit**

```bash
git add src/components/DiscoveryCard.tsx
git commit -m "feat: make discovery card username tappable → public profile"
```

---

## Task 4: Restructure `ExpeditionCard.tsx` header

**Files:**
- Modify: `src/components/ExpeditionCard.tsx`

Same fix as Task 3 — split the header into a plain `View` for `FeedUserRow` and a `TouchableOpacity` for the body.

- [ ] **Step 1: Update the header section of `ExpeditionCard`**

Replace the outer header `TouchableOpacity` block (currently lines 46–79) with:

```tsx
{/* User row — plain View so inner TouchableOpacity works */}
<View style={{ padding: 16, paddingBottom: 0 }}>
  <FeedUserRow
    user={expedition.users}
    onPressUser={expedition.users?.id ? () => router.push(`/user/${expedition.users!.id}`) : undefined}
  />
</View>

{/* Card body — taps open detail */}
<TouchableOpacity activeOpacity={0.95} onPress={openDetail}>
  <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
    <Text style={[textStyles.postTitle, { marginBottom: 6 }]}>{expedition.title}</Text>

    <Text style={[textStyles.postLocation, { marginBottom: 10 }]}>{locationLine}</Text>

    {expedition.vibe_tags?.length > 0 ? (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {expedition.vibe_tags.slice(0, 6).map(tag => (
          <View key={tag} style={{ borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: colors.bgAccent, borderWidth: 1, borderColor: colors.redBase }}>
            <Text style={textStyles.vibeTag}>{tag}</Text>
          </View>
        ))}
      </View>
    ) : null}

    {expedition.description ? (
      <Text style={[textStyles.postDescription, { opacity: 0.92, marginBottom: 12 }]} numberOfLines={8}>
        {expedition.description}
      </Text>
    ) : null}
  </View>
</TouchableOpacity>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ExpeditionCard.tsx
git commit -m "feat: make expedition card username tappable → public profile"
```

---

## Task 5: Make leaderboard rows tappable

**Files:**
- Modify: `app/(tabs)/leaderboard.tsx`

Wrap each row `View` in a `TouchableOpacity` that navigates to `/user/<id>`.

- [ ] **Step 1: Add `useRouter` import and wrap rows**

Add to imports:
```tsx
import { useRouter } from 'expo-router';
```

Inside `LeaderboardScreen`, add:
```tsx
const router = useRouter();
```

Wrap the row `View` in `renderItem` with a `TouchableOpacity`:
```tsx
<TouchableOpacity
  key={item.id}
  activeOpacity={0.85}
  onPress={() => router.push(`/user/${item.id}`)}
>
  <View style={{
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isMe ? '#4e705e' : 'white',
    marginHorizontal: 12, marginVertical: 4, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: isMe ? '#4e705e' : '#c7af94',
    shadowColor: '#110703', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  }}>
    {/* existing row content unchanged */}
  </View>
</TouchableOpacity>
```

Note: The outer `renderItem` returns the `TouchableOpacity` directly — remove the inner `View` wrapper and keep existing content inside.

- [ ] **Step 2: Commit**

```bash
git add 'app/(tabs)/leaderboard.tsx'
git commit -m "feat: make leaderboard rows tappable → public profile"
```

---

## Task 6: Add People search to `search.tsx`

**Files:**
- Modify: `app/(tabs)/search.tsx`

Add a debounced Supabase user query. Render a `PeopleSection` above the existing `SectionList`. Add `style={{ flex: 1 }}` to `SectionList` so it fills remaining height.

- [ ] **Step 1: Add imports and state**

Add to the top imports:
```tsx
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { User } from '../../src/types';
```

Inside `SearchScreen`, add:
```tsx
const router = useRouter();
const [userResults, setUserResults] = useState<User[]>([]);
```

- [ ] **Step 2: Add debounced user search effect**

Add after the existing `useMemo` blocks:
```tsx
useEffect(() => {
  if (q.length < 2) {
    setUserResults([]);
    return;
  }
  const timer = setTimeout(async () => {
    const { data } = await supabase
      .from('users')
      .select('id, username, total_points, streak, profile_photo_url, bio')
      .ilike('username', `%${q}%`)
      .limit(10);
    setUserResults((data ?? []) as User[]);
  }, 300);
  return () => clearTimeout(timer);
}, [q]);
```

- [ ] **Step 3: Add `PeopleSection` component and wire into layout**

Add the inline component inside the file (above the `return`):
```tsx
function UserResultRow({ user, onPress }: { user: User; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: 12, marginVertical: 4,
        borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: colors.bgAccent,
      }}
    >
      {user.profile_photo_url ? (
        <Image source={{ uri: user.profile_photo_url }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
      ) : (
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.greenBase, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 18 }}>🌿</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[textStyles.userName, { fontSize: 16 }]}>@{user.username}</Text>
        <Text style={{ fontSize: 12, color: colors.redBase }}>{user.total_points.toLocaleString()} pts · {user.streak}d streak</Text>
      </View>
      <Text style={{ fontSize: 18, color: colors.bgAccent }}>›</Text>
    </TouchableOpacity>
  );
}
```

Add `Image` to the react-native imports.

In the JSX, insert the People section between the search bar `View` and the `SectionList`:
```tsx
{userResults.length > 0 ? (
  <View>
    <Text style={{ fontFamily: ff.crimsonBold, fontSize: 18, color: colors.redAccent, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
      People
    </Text>
    {userResults.map(u => (
      <UserResultRow key={u.id} user={u} onPress={() => router.push(`/user/${u.id}`)} />
    ))}
  </View>
) : null}
```

Add `style={{ flex: 1 }}` to the `SectionList`:
```tsx
<SectionList
  style={{ flex: 1 }}
  ...
/>
```

- [ ] **Step 4: Commit**

```bash
git add 'app/(tabs)/search.tsx'
git commit -m "feat: add People section to search with public profile navigation"
```

---

## Task 7: Verify Expo Router registers the new route

- [ ] **Step 1: Check `app/user/` directory exists with `[id].tsx`**

```bash
ls app/user/
```
Expected: `[id].tsx` (and possibly `new.tsx` etc from existing files)

- [ ] **Step 2: Restart Expo with cleared cache**

```bash
npx expo start --clear
```

- [ ] **Step 3: Manual smoke test**

1. Open the app on Expo Go
2. Go to Feed — tap a username on a Discovery or Expedition card → should open public profile
3. Go to Leaderboard — tap any row → should open public profile
4. Go to Search — type at least 2 characters of a username → People section should appear → tap a result → should open public profile
5. Tap back — should return to previous screen

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: public profiles complete — tappable usernames + people search"
git push origin Israel
```
