# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project

**Root** — a gamified social nature exploration mobile app, built for HackDuke 2026 by Israel, Ezequiel, Emilio, and Cesar.

Users take photos of plants/animals, AI identifies the species and generates a fact card, and they earn points and badges. They can also log expeditions (solo or with friends), track them live, and compete on a leaderboard.

Full implementation plan: `docs/superpowers/plans/2026-03-21-root-hackathon.md`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native, Expo SDK 54, Expo Router v6 |
| Language | TypeScript |
| Database + Storage | Supabase JS v2 (PostgreSQL + Storage buckets) |
| Auth | Auth0 via `expo-auth-session` (PKCE flow) — Expo Go compatible |
| AI | OpenAI GPT-4o Vision — species ID + fact card in one call |
| Navigation | Expo Router file-based (tabs + stack) |

**Not used:** NativeWind was removed (PostCSS incompatibility). Use plain React Native `StyleSheet` or inline styles.

---

## Design Palette

| Name | Hex |
|---|---|
| Background | `#eaded0` (warm sand) |
| Green (primary) | `#4e705e` (forest green) |
| Maroon | `#361319` |
| Red-brown | `#6d3a3c` |
| Text | `#110703` |
| Tan / muted | `#c7af94` |

---

## File Structure

```
app/
  _layout.tsx              # Root layout — wraps with AuthProvider
  index.tsx                # Redirect: authed → /(tabs), unauthed → /login
  login.tsx                # Login screen (Auth0 + dev bypass button)
  (tabs)/
    _layout.tsx            # Tab bar — 4 tabs: Feed, Post, Leaderboard, Profile
    index.tsx              # Feed screen (discoveries / expeditions toggle)
    post.tsx               # Post chooser
    leaderboard.tsx        # Global leaderboard
    profile.tsx            # User profile + badges + discovery grid
  discovery/
    new.tsx                # 5-step AI flow: pick → scanning → review → posting → done
    [id].tsx               # Discovery detail with FactCard
  expedition/
    new.tsx                # Expedition form
    live.tsx               # Live stopwatch tracker
    [id].tsx               # Expedition detail

src/
  contexts/
    AuthContext.tsx         # AuthProvider + useAuth() — single source of auth state
  hooks/
    useAuth.ts             # Re-exports useAuth from AuthContext
    useDiscoveries.ts      # Supabase query hook for discoveries
    useExpeditions.ts      # Supabase query hook for expeditions
    useProfile.ts          # fetchUserProfile + fetchLeaderboard
  lib/
    supabase.ts            # Supabase client singleton
    openai.ts              # identifySpecies(imageUri) — calls GPT-4o vision
    points.ts              # calculateDiscoveryPoints, calculateExpeditionPoints,
                           # awardPoints, trackSpecies, checkAndAwardBadges
  components/
    DiscoveryCard.tsx      # Feed card for a discovery
    ExpeditionCard.tsx     # Feed card for an expedition
    FactCard.tsx           # AI-generated species fact card
    PointsToast.tsx        # Animated points earned overlay
    FeedToggle.tsx         # Expedition | Discovery dual-tab header
  types/
    index.ts               # All TypeScript types: User, Discovery, Expedition, etc.

supabase/
  schema.sql               # Full DB schema (already applied to Supabase)
```

---

## Auth

Auth is handled by `src/contexts/AuthContext.tsx`. It uses `expo-auth-session` with PKCE (no native modules — works in Expo Go).

- `useAuth()` returns `{ currentUser, loading, isAuthenticated, login, logout, devLogin }`
- `devLogin()` bypasses Auth0 entirely and creates a `devexplorer` test account in Supabase — use this during local development if Auth0 redirect URIs aren't configured
- Auth0 redirect URI mismatch: check Metro logs for `[Auth] redirectUri = ...` and add that exact URL to Auth0 Allowed Callback URLs

---

## Environment Variables

Stored in `.env.local` (not committed). Each developer needs their own copy:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_AUTH0_DOMAIN=...
EXPO_PUBLIC_AUTH0_CLIENT_ID=...
EXPO_PUBLIC_OPENAI_API_KEY=...
```

Ask a teammate for the values — they're in the project's shared credentials.

---

## Running Locally

```bash
npm install --legacy-peer-deps
npx expo start
```

Scan the QR code with Expo Go. Each developer runs their own Metro server independently — no conflicts. All developers share the same Supabase database.

---

## Key Decisions & Gotchas

- **`react-native-auth0` was removed** — it requires a native build and crashes in Expo Go. Use `expo-auth-session` only.
- **NativeWind was removed** — caused a PostCSS error. Use inline styles or `StyleSheet`.
- **`ImagePicker.MediaTypeOptions` is deprecated in SDK 54** — use `ImagePicker.MediaType.Images` instead.
- **Supabase buckets** named `discoveries` and `expeditions` must exist and be set to public for image uploads to work.
- **Points system** uses diminishing returns: 100% → 50% → 25% → 10% for repeat species discoveries.
- **Rare species** (`is_rare: true`) have their location withheld from the DB for conservation reasons.
