# Root — HackDuke 2026 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working demo of Root — a gamified social nature exploration mobile app — within a 24-hour hackathon window, prioritizing the 4 WOW demo moments above all else.

**Architecture:** React Native (Expo Router) mobile app backed by Supabase (PostgreSQL + Storage) for data, Auth0 for authentication, and OpenAI GPT-4o Vision for AI species identification + fact card generation in a single API call.

**Tech Stack:** Expo SDK 51, Expo Router v3, TypeScript, Supabase JS v2, Auth0 React Native SDK, OpenAI Node SDK, NativeWind (Tailwind for RN), Expo Camera, Expo Location, Expo Image Picker

---

## Demo WOW Moments (build in this priority order)
1. Photo → AI identifies species → shows fact card
2. Log expedition → discoveries tied to it
3. Points + leaderboard update live
4. Friend tagged in expedition

---

## Team Setup Tasks (humans do these in parallel while Claude scaffolds)

These require web dashboards — do them NOW while Claude writes code:

**Person A — Supabase:**
1. Go to supabase.com → New project → name it "root-hackduke"
2. Copy `Project URL` and `anon public` key → put in `.env.local`
3. Go to SQL Editor → run the schema from `supabase/schema.sql` once Claude creates it
4. Go to Storage → create bucket named `discoveries` (public) and `expeditions` (public)

**Person B — Auth0:**
1. Go to auth0.com → Create Application → Native
2. In settings, add to Allowed Callback URLs: `com.root.app://callback`
3. Add to Allowed Logout URLs: `com.root.app://`
4. Copy Domain and Client ID → put in `.env.local`

**Person C — OpenAI:**
1. Go to platform.openai.com → API Keys → Create key
2. Copy key → put in `.env.local`

---

## File Structure

```
root/
├── app/
│   ├── _layout.tsx                    # Root layout — Auth0 + Supabase providers
│   ├── index.tsx                      # Redirect: authed → tabs, unauthed → login
│   ├── login.tsx                      # Auth0 login screen
│   ├── (tabs)/
│   │   ├── _layout.tsx                # Tab bar layout
│   │   ├── index.tsx                  # Feed (discoveries + expeditions toggle)
│   │   ├── post.tsx                   # Post chooser (discovery vs expedition)
│   │   ├── leaderboard.tsx            # Global leaderboard
│   │   └── profile.tsx                # My profile
│   ├── discovery/
│   │   ├── new.tsx                    # Camera → AI → review → post flow
│   │   └── [id].tsx                   # Discovery detail with fact card
│   └── expedition/
│       ├── new.tsx                    # Normal expedition form
│       ├── live.tsx                   # Live expedition tracker
│       └── [id].tsx                   # Expedition detail
├── src/
│   ├── lib/
│   │   ├── supabase.ts                # Supabase client singleton
│   │   ├── openai.ts                  # OpenAI client + identify() function
│   │   └── points.ts                  # Points calculation logic
│   ├── hooks/
│   │   ├── useAuth.ts                 # Auth0 session + Supabase user sync
│   │   ├── useDiscoveries.ts          # Discovery CRUD + feed queries
│   │   ├── useExpeditions.ts          # Expedition CRUD + feed queries
│   │   └── useProfile.ts             # Profile + points + badges
│   ├── components/
│   │   ├── DiscoveryCard.tsx          # Feed card for a discovery
│   │   ├── ExpeditionCard.tsx         # Feed card for an expedition
│   │   ├── FactCard.tsx               # AI fact card display
│   │   ├── PointsToast.tsx            # Animated points earned notification
│   │   └── FeedToggle.tsx             # Discoveries / Expeditions toggle
│   └── types/
│       └── index.ts                   # All TypeScript types
├── supabase/
│   └── schema.sql                     # Full DB schema — run this in Supabase SQL editor
├── .env.local                         # Secrets (gitignored)
├── app.json                           # Expo config with scheme
├── tailwind.config.js
└── package.json
```

---

## Task 1: Expo Project Scaffold

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `tailwind.config.js`, `.env.local`, `babel.config.js`

- [ ] **Step 1.1: Initialize Expo project**

```bash
cd /Users/crodasmenendez24/Desktop/HackDuke2026/HackDuke26
npx create-expo-app@latest . --template blank-typescript
```

Expected: Expo project files appear in current directory.

- [ ] **Step 1.2: Install all dependencies**

```bash
npx expo install expo-router expo-camera expo-image-picker expo-location expo-file-system
npx expo install react-native-safe-area-context react-native-screens
npm install @supabase/supabase-js @auth0/react-native-auth0 openai
npm install nativewind tailwindcss
npm install @react-native-async-storage/async-storage
npm install react-native-url-polyfill
npx expo install expo-secure-store expo-web-browser expo-auth-session
```

- [ ] **Step 1.3: Update `app.json` for Expo Router + Auth0 scheme**

Replace contents of `app.json`:
```json
{
  "expo": {
    "name": "Root",
    "slug": "root",
    "version": "1.0.0",
    "scheme": "com.root.app",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.root.app"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#2D6A4F"
      },
      "package": "com.root.app"
    },
    "plugins": [
      "expo-router",
      "expo-camera",
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "Root uses your location to tag discoveries and expeditions."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 1.4: Update `babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
```

- [ ] **Step 1.5: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#2D6A4F',
        moss: '#52B788',
        bark: '#6B4226',
        sky: '#74C0FC',
        cream: '#F8F4E9',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 1.6: Create `.env.local` template**

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_AUTH0_DOMAIN=your_auth0_domain_here
EXPO_PUBLIC_AUTH0_CLIENT_ID=your_auth0_client_id_here
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key_here
```

- [ ] **Step 1.7: Verify app boots**

```bash
npx expo start
```

Expected: QR code appears. Scan with Expo Go — should show blank white screen with no errors.

- [ ] **Step 1.8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Expo project with all dependencies"
```

---

## Task 2: TypeScript Types + Supabase Schema

**Files:**
- Create: `src/types/index.ts`
- Create: `supabase/schema.sql`

- [ ] **Step 2.1: Write TypeScript types** (`src/types/index.ts`)

```typescript
export type User = {
  id: string;
  auth0_id: string;
  username: string;
  bio: string | null;
  profile_photo_url: string | null;
  total_points: number;
  streak: number;
  last_active_date: string | null;
  created_at: string;
};

export type FactCard = {
  native_region: string;
  sustainability: string;
  habitat: string;
  interesting_fact: string;
  ecological_relevance: string;
  sources: string[];
};

export type Discovery = {
  id: string;
  user_id: string;
  image_url: string;
  category: 'plants' | 'trees' | 'flowers' | 'fungi' | 'insects' | 'birds' | 'mammals' | 'other';
  common_name: string;
  scientific_name: string | null;
  confidence: number | null;
  fact_card: FactCard | null;
  caption: string | null;
  location_lat: number | null;
  location_lng: number | null;
  is_sensitive: boolean;
  points_earned: number;
  created_at: string;
  users?: User;
};

export type ExpeditionType = 'trail' | 'hike' | 'scenic_view' | 'walk' | 'nature_spot';
export type Difficulty = 'easy' | 'moderate' | 'hard';

export type Expedition = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: ExpeditionType;
  location: string | null;
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
};

export type Badge = {
  id: string;
  user_id: string;
  badge_type: string;
  earned_at: string;
};

export type AIIdentificationResult = {
  common_name: string;
  scientific_name: string;
  category: Discovery['category'];
  confidence: number;
  is_rare: boolean;
  fact_card: FactCard;
};

export type PointsBreakdown = {
  base: number;
  new_species_bonus: number;
  rare_bonus: number;
  total: number;
};
```

- [ ] **Step 2.2: Write Supabase schema** (`supabase/schema.sql`)

```sql
-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Users (linked to Auth0)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth0_id text unique not null,
  username text unique not null,
  bio text,
  profile_photo_url text,
  total_points integer default 0 not null,
  streak integer default 0 not null,
  last_active_date date,
  created_at timestamptz default now() not null
);

-- Discoveries
create table if not exists discoveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  image_url text not null,
  category text not null,
  common_name text not null,
  scientific_name text,
  confidence numeric(4,3),
  fact_card jsonb,
  caption text,
  location_lat numeric(10,6),
  location_lng numeric(10,6),
  is_sensitive boolean default false not null,
  points_earned integer default 0 not null,
  created_at timestamptz default now() not null
);

-- Expeditions
create table if not exists expeditions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  description text,
  type text not null,
  location text,
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

-- Link discoveries to expeditions
create table if not exists expedition_discoveries (
  expedition_id uuid references expeditions(id) on delete cascade,
  discovery_id uuid references discoveries(id) on delete cascade,
  primary key (expedition_id, discovery_id)
);

-- Tagged participants in group expeditions
create table if not exists expedition_participants (
  expedition_id uuid references expeditions(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  primary key (expedition_id, user_id)
);

-- Social follows (follower follows following)
create table if not exists follows (
  follower_id uuid references users(id) on delete cascade,
  following_id uuid references users(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (follower_id, following_id)
);

-- Badges
create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  badge_type text not null,
  earned_at timestamptz default now() not null,
  unique(user_id, badge_type)
);

-- Species tracker (for diminishing returns on points)
create table if not exists user_species (
  user_id uuid references users(id) on delete cascade,
  species_key text not null,
  count integer default 1 not null,
  primary key (user_id, species_key)
);

-- Indexes for performance
create index if not exists discoveries_user_id_idx on discoveries(user_id);
create index if not exists discoveries_created_at_idx on discoveries(created_at desc);
create index if not exists expeditions_user_id_idx on expeditions(user_id);
create index if not exists expeditions_created_at_idx on expeditions(created_at desc);
create index if not exists follows_follower_idx on follows(follower_id);
create index if not exists follows_following_idx on follows(following_id);

-- Disable RLS for hackathon (enable + add policies for production)
alter table users disable row level security;
alter table discoveries disable row level security;
alter table expeditions disable row level security;
alter table expedition_discoveries disable row level security;
alter table expedition_participants disable row level security;
alter table follows disable row level security;
alter table badges disable row level security;
alter table user_species disable row level security;

-- RPC to safely increment user points (include here so schema.sql is a single run)
create or replace function increment_points(user_id uuid, amount integer)
returns void
language sql
as $$
  update users set total_points = total_points + amount where id = user_id;
$$;
```

- [ ] **Step 2.3: Commit**

```bash
git add src/types/index.ts supabase/schema.sql
git commit -m "feat: add TypeScript types and Supabase schema"
```

---

## Task 3: Core Library Files

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/openai.ts`
- Create: `src/lib/points.ts`

- [ ] **Step 3.1: Create Supabase client** (`src/lib/supabase.ts`)

```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 3.2: Create OpenAI client + identify function** (`src/lib/openai.ts`)

```typescript
import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';
import { AIIdentificationResult } from '../types';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY!,
  dangerouslyAllowBrowser: true,
});

const IDENTIFICATION_PROMPT = `You are an expert naturalist and ecologist. Analyze this image and identify the species or organism shown.

Return ONLY a valid JSON object (no markdown, no extra text) with this exact shape:
{
  "common_name": "string — common name of the species",
  "scientific_name": "string — binomial scientific name",
  "category": "one of: plants, trees, flowers, fungi, insects, birds, mammals, other",
  "confidence": number between 0 and 1,
  "is_rare": boolean,
  "fact_card": {
    "native_region": "string",
    "sustainability": "string — note if invasive species",
    "habitat": "string",
    "interesting_fact": "string — one compelling fact",
    "ecological_relevance": "string",
    "sources": ["string array of source names (not URLs)"]
  }
}

If you cannot identify a specific species, use your best guess with a low confidence score. Always return valid JSON.`;

export async function identifySpecies(imageUri: string): Promise<AIIdentificationResult> {
  // Convert local URI to base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64}`,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: IDENTIFICATION_PROMPT,
          },
        ],
      },
    ],
    max_tokens: 800,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI');

  try {
    return JSON.parse(content) as AIIdentificationResult;
  } catch {
    // Try to extract JSON if model added extra text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as AIIdentificationResult;
    throw new Error('Could not parse AI response');
  }
}
```

- [ ] **Step 3.3: Create points calculation** (`src/lib/points.ts`)

```typescript
import { supabase } from './supabase';
import { PointsBreakdown } from '../types';

// Points constants
const BASE_DISCOVERY = 10;
const NEW_SPECIES_BONUS = 25;
const RARE_SPECIES_BONUS = 75;
const EXPEDITION_BASE = 30;
const LIVE_EXPEDITION_BONUS = 20;
const DISTANCE_BONUS_PER_KM = 5; // up to 50 pts
const GROUP_EXPEDITION_PER_FRIEND = 10;
const DISCOVERY_DURING_EXPEDITION = 5;

export async function calculateDiscoveryPoints(
  userId: string,
  speciesKey: string,
  isRare: boolean
): Promise<PointsBreakdown> {
  // Check if user has spotted this species before
  const { data: existing } = await supabase
    .from('user_species')
    .select('count')
    .eq('user_id', userId)
    .eq('species_key', speciesKey)
    .single();

  const isNewSpecies = !existing;
  const count = existing?.count ?? 0;

  // Diminishing returns: 100%, 50%, 25%, 10% for 3+
  const diminishingMultiplier = isNewSpecies ? 1 : count === 1 ? 0.5 : count === 2 ? 0.25 : 0.1;
  const base = Math.round(BASE_DISCOVERY * diminishingMultiplier);
  const new_species_bonus = isNewSpecies ? NEW_SPECIES_BONUS : 0;
  const rare_bonus = isRare && isNewSpecies ? RARE_SPECIES_BONUS : 0;

  return { base, new_species_bonus, rare_bonus, total: base + new_species_bonus + rare_bonus };
}

export async function calculateExpeditionPoints(
  participantCount: number,
  distanceKm: number | null,
  isLive: boolean,
  discoveryCount: number
): Promise<number> {
  const base = EXPEDITION_BASE;
  const live = isLive ? LIVE_EXPEDITION_BONUS : 0;
  const distance = distanceKm ? Math.min(Math.round(distanceKm * DISTANCE_BONUS_PER_KM), 50) : 0;
  const social = (participantCount - 1) * GROUP_EXPEDITION_PER_FRIEND;
  const discoveries = discoveryCount * DISCOVERY_DURING_EXPEDITION;
  return base + live + distance + social + discoveries;
}

export async function awardPoints(userId: string, points: number): Promise<void> {
  await supabase.rpc('increment_points', { user_id: userId, amount: points });
}

export async function trackSpecies(userId: string, speciesKey: string): Promise<void> {
  const { data: existing } = await supabase
    .from('user_species')
    .select('count')
    .eq('user_id', userId)
    .eq('species_key', speciesKey)
    .single();

  if (existing) {
    await supabase
      .from('user_species')
      .update({ count: existing.count + 1 })
      .eq('user_id', userId)
      .eq('species_key', speciesKey);
  } else {
    await supabase.from('user_species').insert({ user_id: userId, species_key: speciesKey, count: 1 });
  }
}
```

- [ ] **Step 3.4: Commit**

```bash
git add src/lib/
git commit -m "feat: add Supabase client, OpenAI identify function, points engine"
```

---

## Task 4: Auth (Auth0 + Supabase User Sync)

**Files:**
- Create: `src/hooks/useAuth.ts`
- Create: `app/_layout.tsx`
- Create: `app/login.tsx`
- Create: `app/index.tsx`

- [ ] **Step 4.1: Create `useAuth` hook** (`src/hooks/useAuth.ts`)

```typescript
import { useAuth0 } from '@auth0/react-native-auth0';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export function useAuth() {
  const { user: auth0User, authorize, clearSession, isLoading: auth0Loading } = useAuth0();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth0User) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }
    syncUser(auth0User.sub!, auth0User.name ?? auth0User.email ?? 'Explorer');
  }, [auth0User]);

  async function syncUser(auth0Id: string, displayName: string) {
    setLoading(true);
    try {
      // Check if user exists
      const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('auth0_id', auth0Id)
        .single();

      if (existing) {
        setCurrentUser(existing);
        return;
      }

      // Create new user — generate unique username from display name
      const baseUsername = displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
      const username = `${baseUsername}${Math.floor(Math.random() * 9999)}`;

      const { data: newUser } = await supabase
        .from('users')
        .insert({ auth0_id: auth0Id, username })
        .select('*')
        .single();

      setCurrentUser(newUser);
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    await authorize();
  }

  async function logout() {
    await clearSession();
    setCurrentUser(null);
  }

  return {
    currentUser,
    loading: loading || auth0Loading,
    isAuthenticated: !!auth0User,
    login,
    logout,
    refreshUser: () => auth0User && syncUser(auth0User.sub!, auth0User.name ?? ''),
  };
}
```

- [ ] **Step 4.2: Create root layout** (`app/_layout.tsx`)

```typescript
import { Auth0Provider } from '@auth0/react-native-auth0';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <Auth0Provider
      domain={process.env.EXPO_PUBLIC_AUTH0_DOMAIN!}
      clientId={process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!}
    >
      <StatusBar style="dark" />
      <Slot />
    </Auth0Provider>
  );
}
```

- [ ] **Step 4.3: Create redirect index** (`app/index.tsx`)

```typescript
import { useAuth0 } from '@auth0/react-native-auth0';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isLoading, user } = useAuth0();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F4E9' }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
```

- [ ] **Step 4.4: Create login screen** (`app/login.tsx`)

```typescript
import { useAuth0 } from '@auth0/react-native-auth0';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { authorize, user, isLoading } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  async function handleLogin() {
    try {
      await authorize();
    } catch (e) {
      console.error('Login failed', e);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F4E9', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 48, fontWeight: '800', color: '#2D6A4F', marginBottom: 8 }}>Root</Text>
      <Text style={{ fontSize: 18, color: '#6B7280', marginBottom: 60, textAlign: 'center' }}>
        Spot, explore, and share nature{'\n'}with friends, points, and AI.
      </Text>

      <TouchableOpacity
        onPress={handleLogin}
        disabled={isLoading}
        style={{
          backgroundColor: '#2D6A4F',
          paddingHorizontal: 48,
          paddingVertical: 16,
          borderRadius: 32,
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
          {isLoading ? 'Loading...' : 'Get Started'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4.5: Commit**

```bash
git add app/ src/hooks/useAuth.ts
git commit -m "feat: Auth0 login + Supabase user sync"
```

---

## Task 5: Tab Navigation Skeleton

**Files:**
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx` (stub)
- Create: `app/(tabs)/post.tsx` (stub)
- Create: `app/(tabs)/leaderboard.tsx` (stub)
- Create: `app/(tabs)/profile.tsx` (stub)

- [ ] **Step 5.1: Create tab layout** (`app/(tabs)/_layout.tsx`)

```typescript
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#F8F4E9', borderTopColor: '#E5E7EB', height: 60 },
        tabBarShowLabel: false,
        headerStyle: { backgroundColor: '#F8F4E9' },
        headerTintColor: '#2D6A4F',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Root',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌿" label="Feed" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarIcon: ({ focused }) => <TabIcon emoji="➕" label="Post" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" label="Ranks" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧭" label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 5.2: Create stub screens (feed, post, leaderboard, profile)**

`app/(tabs)/index.tsx`:
```typescript
import { View, Text } from 'react-native';
export default function FeedScreen() {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Feed coming soon</Text></View>;
}
```

`app/(tabs)/post.tsx`:
```typescript
import { View, Text } from 'react-native';
export default function PostScreen() {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Post coming soon</Text></View>;
}
```

`app/(tabs)/leaderboard.tsx`:
```typescript
import { View, Text } from 'react-native';
export default function LeaderboardScreen() {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Leaderboard coming soon</Text></View>;
}
```

`app/(tabs)/profile.tsx`:
```typescript
import { View, Text } from 'react-native';
export default function ProfileScreen() {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Profile coming soon</Text></View>;
}
```

- [ ] **Step 5.3: Verify tabs render after login**

```bash
npx expo start
```

Expected: After login, 4 tabs appear at bottom (🌿 ➕ 🏆 🧭) with stub text.

- [ ] **Step 5.4: Commit**

```bash
git add app/(tabs)/
git commit -m "feat: tab navigation skeleton"
```

---

## Task 6: AI Discovery Flow (WOW MOMENT #1)

**Files:**
- Create: `src/components/FactCard.tsx`
- Create: `src/components/PointsToast.tsx`
- Create: `app/discovery/new.tsx`
- Create: `app/discovery/[id].tsx`
- Create: `src/hooks/useDiscoveries.ts`

- [ ] **Step 6.1: Create FactCard component** (`src/components/FactCard.tsx`)

```typescript
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { FactCard as FactCardType } from '../types';

type Props = {
  commonName: string;
  scientificName: string | null;
  category: string;
  confidence: number | null;
  factCard: FactCardType | null;
};

export function FactCard({ commonName, scientificName, category, confidence, factCard }: Props) {
  const categoryEmoji: Record<string, string> = {
    plants: '🌱', trees: '🌳', flowers: '🌸', fungi: '🍄',
    insects: '🦋', birds: '🦜', mammals: '🦊', other: '🔍',
  };

  return (
    <View style={{ backgroundColor: '#F8F4E9', borderRadius: 16, padding: 16, margin: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 28, marginRight: 8 }}>{categoryEmoji[category] ?? '🔍'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#2D6A4F' }}>{commonName}</Text>
          {scientificName && (
            <Text style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>{scientificName}</Text>
          )}
        </View>
        {confidence !== null && (
          <View style={{ backgroundColor: confidence > 0.7 ? '#D1FAE5' : '#FEF3C7', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: confidence > 0.7 ? '#065F46' : '#92400E' }}>
              {Math.round(confidence * 100)}% match
            </Text>
          </View>
        )}
      </View>

      {factCard && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <FactRow label="📍 Native Region" value={factCard.native_region} />
          <FactRow label="🏕 Habitat" value={factCard.habitat} />
          <FactRow label="🌍 Ecological Role" value={factCard.ecological_relevance} />
          <FactRow label="♻️ Sustainability" value={factCard.sustainability} />
          <View style={{ backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12, marginTop: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2D6A4F', marginBottom: 4 }}>💡 Did you know?</Text>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>{factCard.interesting_fact}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: '#374151', marginTop: 1 }}>{value}</Text>
    </View>
  );
}
```

- [ ] **Step 6.2: Create PointsToast** (`src/components/PointsToast.tsx`)

```typescript
import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { PointsBreakdown } from '../types';

type Props = {
  points: PointsBreakdown;
  visible: boolean;
};

export function PointsToast({ points, visible }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -20, duration: 400, useNativeDriver: true }),
          ]).start();
        }, 2000);
      });
    }
  }, [visible]);

  return (
    <Animated.View style={{ position: 'absolute', top: 60, alignSelf: 'center', opacity, transform: [{ translateY }], zIndex: 999 }}>
      <View style={{ backgroundColor: '#2D6A4F', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>+{points.total} pts ✨</Text>
        {points.new_species_bonus > 0 && (
          <Text style={{ color: '#A7F3D0', fontSize: 12, marginTop: 2 }}>New species! +{points.new_species_bonus}</Text>
        )}
        {points.rare_bonus > 0 && (
          <Text style={{ color: '#FCD34D', fontSize: 12 }}>Rare find! +{points.rare_bonus} 🌟</Text>
        )}
      </View>
    </Animated.View>
  );
}
```

- [ ] **Step 6.3: Create discoveries hook** (`src/hooks/useDiscoveries.ts`)

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Discovery } from '../types';

export function useDiscoveries(userId?: string) {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, [userId]);

  async function fetchFeed() {
    setLoading(true);
    let query = supabase
      .from('discoveries')
      .select('*, users(id, username, profile_photo_url, total_points)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId) query = query.eq('user_id', userId);

    const { data } = await query;
    setDiscoveries(data ?? []);
    setLoading(false);
  }

  async function fetchById(id: string): Promise<Discovery | null> {
    const { data } = await supabase
      .from('discoveries')
      .select('*, users(id, username, profile_photo_url, total_points)')
      .eq('id', id)
      .single();
    return data;
  }

  return { discoveries, loading, refresh: fetchFeed, fetchById };
}
```

- [ ] **Step 6.4: Create discovery new screen** (`app/discovery/new.tsx`)

```typescript
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { identifySpecies } from '../../src/lib/openai';
import { calculateDiscoveryPoints, awardPoints, trackSpecies, checkAndAwardBadges } from '../../src/lib/points';
import { supabase } from '../../src/lib/supabase';
import { FactCard } from '../../src/components/FactCard';
import { PointsToast } from '../../src/components/PointsToast';
import { useAuth } from '../../src/hooks/useAuth';
import { AIIdentificationResult, PointsBreakdown } from '../../src/types';

type Step = 'pick' | 'scanning' | 'review' | 'posting' | 'done';

export default function NewDiscoveryScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [step, setStep] = useState<Step>('pick');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<AIIdentificationResult | null>(null);
  const [caption, setCaption] = useState('');
  const [pointsBreakdown, setPointsBreakdown] = useState<PointsBreakdown | null>(null);
  const [showToast, setShowToast] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to post discoveries.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!picked.canceled && picked.assets[0]) {
      await scanImage(picked.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const taken = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!taken.canceled && taken.assets[0]) {
      await scanImage(taken.assets[0].uri);
    }
  }

  async function scanImage(uri: string) {
    setImageUri(uri);
    setStep('scanning');
    try {
      const identified = await identifySpecies(uri);
      setResult(identified);
      setStep('review');
    } catch (e) {
      Alert.alert('Scan failed', 'Could not identify species. Try a clearer photo.');
      setStep('pick');
    }
  }

  async function postDiscovery() {
    if (!result || !imageUri || !currentUser) return;
    setStep('posting');

    try {
      // Upload image to Supabase Storage
      const filename = `${currentUser.id}/${Date.now()}.jpg`;
      const fileBlob = await (await fetch(imageUri)).blob();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('discoveries')
        .upload(filename, fileBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('discoveries').getPublicUrl(filename);
      const imageUrl = urlData.publicUrl;

      // Get location
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          // Omit exact coordinates for rare/sensitive species to protect location privacy
          lat = !result.is_rare ? loc.coords.latitude : null;
          lng = !result.is_rare ? loc.coords.longitude : null;
        }
      } catch {}

      // Calculate points
      const speciesKey = result.scientific_name || result.common_name;
      const breakdown = await calculateDiscoveryPoints(currentUser.id, speciesKey, result.is_rare);
      setPointsBreakdown(breakdown);

      // Insert discovery
      const { data: discovery } = await supabase.from('discoveries').insert({
        user_id: currentUser.id,
        image_url: imageUrl,
        category: result.category,
        common_name: result.common_name,
        scientific_name: result.scientific_name,
        confidence: result.confidence,
        fact_card: result.fact_card,
        caption: caption || null,
        location_lat: lat,
        location_lng: lng,
        is_sensitive: result.is_rare,
        points_earned: breakdown.total,
      }).select().single();

      // Award points, track species, check badges
      await Promise.all([
        awardPoints(currentUser.id, breakdown.total),
        trackSpecies(currentUser.id, speciesKey),
        checkAndAwardBadges(currentUser.id),
      ]);

      setStep('done');
      setShowToast(true);
      setTimeout(() => router.replace('/(tabs)'), 2500);
    } catch (e) {
      Alert.alert('Post failed', 'Something went wrong. Try again.');
      setStep('review');
    }
  }

  if (step === 'pick') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F4E9', justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#2D6A4F', marginBottom: 8 }}>What did you spot? 🔍</Text>
        <TouchableOpacity onPress={takePhoto} style={{ backgroundColor: '#2D6A4F', padding: 18, borderRadius: 16, width: '100%', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>📷 Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={pickImage} style={{ backgroundColor: '#52B788', padding: 18, borderRadius: 16, width: '100%', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>🖼 Choose from Library</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 8 }}>
          <Text style={{ color: '#6B7280', fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (step === 'scanning') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F4E9', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        {imageUri && <Image source={{ uri: imageUri }} style={{ width: 200, height: 200, borderRadius: 16 }} />}
        <ActivityIndicator size="large" color="#2D6A4F" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#2D6A4F' }}>Identifying species...</Text>
        <Text style={{ fontSize: 14, color: '#6B7280' }}>Powered by AI 🤖</Text>
      </SafeAreaView>
    );
  }

  if (step === 'review' && result) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#F8F4E9' }}>
        <SafeAreaView>
          {imageUri && <Image source={{ uri: imageUri }} style={{ width: '100%', height: 260 }} resizeMode="cover" />}
          <FactCard
            commonName={result.common_name}
            scientificName={result.scientific_name}
            category={result.category}
            confidence={result.confidence}
            factCard={result.fact_card}
          />
          <View style={{ padding: 16 }}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption (optional)..."
              placeholderTextColor="#9CA3AF"
              style={{ backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 }}
              multiline
            />
            <TouchableOpacity onPress={postDiscovery} style={{ backgroundColor: '#2D6A4F', padding: 18, borderRadius: 16, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Post Discovery ✨</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('pick')} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: '#6B7280', fontSize: 15 }}>Retake photo</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScrollView>
    );
  }

  if (step === 'posting' || step === 'done') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F4E9', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        {pointsBreakdown && <PointsToast points={pointsBreakdown} visible={showToast} />}
        {step === 'posting' ? (
          <>
            <ActivityIndicator size="large" color="#2D6A4F" />
            <Text style={{ fontSize: 16, color: '#2D6A4F' }}>Posting discovery...</Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 48 }}>🌿</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#2D6A4F' }}>Discovery Posted!</Text>
            {pointsBreakdown && (
              <Text style={{ fontSize: 16, color: '#52B788' }}>+{pointsBreakdown.total} points earned</Text>
            )}
          </>
        )}
      </SafeAreaView>
    );
  }

  return null;
}
```

- [ ] **Step 6.5: Create discovery detail screen** (`app/discovery/[id].tsx`)

```typescript
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FactCard } from '../../src/components/FactCard';
import { useDiscoveries } from '../../src/hooks/useDiscoveries';
import { Discovery } from '../../src/types';

export default function DiscoveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchById } = useDiscoveries();
  const [discovery, setDiscovery] = useState<Discovery | null>(null);

  useEffect(() => {
    if (id) fetchById(id).then(setDiscovery);
  }, [id]);

  if (!discovery) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F4E9' }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8F4E9' }}>
      <Image source={{ uri: discovery.image_url }} style={{ width: '100%', height: 300 }} resizeMode="cover" />
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
          by @{discovery.users?.username} · {new Date(discovery.created_at).toLocaleDateString()}
        </Text>
        {discovery.caption && (
          <Text style={{ fontSize: 16, color: '#374151', marginTop: 8, marginBottom: 4 }}>{discovery.caption}</Text>
        )}
      </View>
      <FactCard
        commonName={discovery.common_name}
        scientificName={discovery.scientific_name}
        category={discovery.category}
        confidence={discovery.confidence}
        factCard={discovery.fact_card}
      />
    </ScrollView>
  );
}
```

- [ ] **Step 6.6: Commit**

```bash
git add app/discovery/ src/components/ src/hooks/useDiscoveries.ts
git commit -m "feat: AI discovery flow with fact card and points toast (WOW #1)"
```

---

## Task 7: Feed Screen

**Files:**
- Create: `src/components/DiscoveryCard.tsx`
- Create: `src/components/ExpeditionCard.tsx`
- Create: `src/components/FeedToggle.tsx`
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 7.1: Create DiscoveryCard** (`src/components/DiscoveryCard.tsx`)

```typescript
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Discovery } from '../types';

type Props = { discovery: Discovery };

const categoryEmoji: Record<string, string> = {
  plants: '🌱', trees: '🌳', flowers: '🌸', fungi: '🍄',
  insects: '🦋', birds: '🦜', mammals: '🦊', other: '🔍',
};

export function DiscoveryCard({ discovery }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/discovery/${discovery.id}`)}
      style={{ backgroundColor: 'white', borderRadius: 16, marginHorizontal: 12, marginVertical: 6, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
    >
      <Image source={{ uri: discovery.image_url }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text style={{ fontSize: 18 }}>{categoryEmoji[discovery.category] ?? '🔍'}</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#2D6A4F', flex: 1 }}>{discovery.common_name}</Text>
          {discovery.points_earned > 0 && (
            <View style={{ backgroundColor: '#D1FAE5', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#065F46' }}>+{discovery.points_earned}pts</Text>
            </View>
          )}
        </View>
        {discovery.scientific_name && (
          <Text style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 4 }}>{discovery.scientific_name}</Text>
        )}
        {discovery.caption && (
          <Text style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>{discovery.caption}</Text>
        )}
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
          @{discovery.users?.username} · {new Date(discovery.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 7.2: Create ExpeditionCard** (`src/components/ExpeditionCard.tsx`)

```typescript
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Expedition } from '../types';

type Props = { expedition: Expedition };

const typeEmoji: Record<string, string> = {
  trail: '🥾', hike: '⛰', scenic_view: '🌄', walk: '🚶', nature_spot: '🌿',
};
const difficultyColor: Record<string, string> = {
  easy: '#D1FAE5', moderate: '#FEF3C7', hard: '#FEE2E2',
};

export function ExpeditionCard({ expedition }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/expedition/${expedition.id}`)}
      style={{ backgroundColor: 'white', borderRadius: 16, marginHorizontal: 12, marginVertical: 6, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
    >
      {expedition.photo_urls[0] && (
        <Image source={{ uri: expedition.photo_urls[0] }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
      )}
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text style={{ fontSize: 18 }}>{typeEmoji[expedition.type] ?? '🗺'}</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#2D6A4F', flex: 1 }}>{expedition.title}</Text>
          {expedition.points_earned > 0 && (
            <View style={{ backgroundColor: '#D1FAE5', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#065F46' }}>+{expedition.points_earned}pts</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          {expedition.difficulty && (
            <View style={{ backgroundColor: difficultyColor[expedition.difficulty] ?? '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>{expedition.difficulty}</Text>
            </View>
          )}
          {expedition.vibe_tags.slice(0, 3).map(tag => (
            <View key={tag} style={{ backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 12, color: '#2D6A4F' }}>{tag}</Text>
            </View>
          ))}
        </View>
        {expedition.description && (
          <Text style={{ fontSize: 14, color: '#374151', marginBottom: 6 }} numberOfLines={2}>{expedition.description}</Text>
        )}
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
          @{expedition.users?.username} · {new Date(expedition.created_at).toLocaleDateString()}
          {expedition.distance && ` · ${expedition.distance}km`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 7.3: Create FeedToggle** (`src/components/FeedToggle.tsx`)

```typescript
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Props = {
  active: 'discoveries' | 'expeditions';
  onChange: (tab: 'discoveries' | 'expeditions') => void;
};

export function FeedToggle({ active, onChange }: Props) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#E8F5E9', borderRadius: 24, padding: 3, margin: 12 }}>
      {(['discoveries', 'expeditions'] as const).map(tab => (
        <TouchableOpacity
          key={tab}
          onPress={() => onChange(tab)}
          style={{
            flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center',
            backgroundColor: active === tab ? '#2D6A4F' : 'transparent',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: active === tab ? 'white' : '#52B788', textTransform: 'capitalize' }}>
            {tab === 'discoveries' ? '🌿 Discoveries' : '🥾 Expeditions'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

- [ ] **Step 7.4: Create expeditions hook** (`src/hooks/useExpeditions.ts`)

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Expedition } from '../types';

export function useExpeditions(userId?: string) {
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, [userId]);

  async function fetchFeed() {
    setLoading(true);
    let query = supabase
      .from('expeditions')
      .select('*, users(id, username, profile_photo_url, total_points)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId) query = query.eq('user_id', userId);

    const { data } = await query;
    setExpeditions(data ?? []);
    setLoading(false);
  }

  async function fetchById(id: string): Promise<Expedition | null> {
    const { data } = await supabase
      .from('expeditions')
      .select('*, users(id, username, profile_photo_url, total_points)')
      .eq('id', id)
      .single();
    return data;
  }

  return { expeditions, loading, refresh: fetchFeed, fetchById };
}
```

- [ ] **Step 7.5: Build the real Feed screen** (`app/(tabs)/index.tsx`)

```typescript
import React, { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DiscoveryCard } from '../../src/components/DiscoveryCard';
import { ExpeditionCard } from '../../src/components/ExpeditionCard';
import { FeedToggle } from '../../src/components/FeedToggle';
import { useDiscoveries } from '../../src/hooks/useDiscoveries';
import { useExpeditions } from '../../src/hooks/useExpeditions';

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState<'discoveries' | 'expeditions'>('discoveries');
  const { discoveries, loading: dLoading, refresh: dRefresh } = useDiscoveries();
  const { expeditions, loading: eLoading, refresh: eRefresh } = useExpeditions();

  const isDiscoveries = activeTab === 'discoveries';
  const loading = isDiscoveries ? dLoading : eLoading;
  const refresh = isDiscoveries ? dRefresh : eRefresh;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F4E9' }} edges={['top']}>
      <FeedToggle active={activeTab} onChange={setActiveTab} />
      <FlatList
        data={isDiscoveries ? discoveries : expeditions}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#2D6A4F" />}
        renderItem={({ item }) =>
          isDiscoveries
            ? <DiscoveryCard discovery={item as any} />
            : <ExpeditionCard expedition={item as any} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 40 }}>{isDiscoveries ? '🌿' : '🥾'}</Text>
              <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 8 }}>
                No {activeTab} yet. Be the first!
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 7.6: Commit**

```bash
git add app/(tabs)/index.tsx src/components/ src/hooks/useExpeditions.ts
git commit -m "feat: feed screen with discovery and expedition cards"
```

---

## Task 8: Post Screen + Expedition Form (WOW #2)

**Files:**
- Modify: `app/(tabs)/post.tsx`
- Create: `app/expedition/new.tsx`
- Create: `app/expedition/[id].tsx`

- [ ] **Step 8.1: Build Post chooser screen** (`app/(tabs)/post.tsx`)

```typescript
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PostScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F4E9', justifyContent: 'center', padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#2D6A4F', textAlign: 'center', marginBottom: 16 }}>
        What are you sharing?
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/discovery/new')}
        style={{ backgroundColor: '#2D6A4F', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 }}
      >
        <Text style={{ fontSize: 40 }}>🔍</Text>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Discovery</Text>
        <Text style={{ color: '#A7F3D0', fontSize: 14, textAlign: 'center' }}>
          Spot a plant, animal, or fungi{'\n'}and let AI identify it
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/expedition/new')}
        style={{ backgroundColor: '#52B788', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 }}
      >
        <Text style={{ fontSize: 40 }}>🥾</Text>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Expedition</Text>
        <Text style={{ color: '#D1FAE5', fontSize: 14, textAlign: 'center' }}>
          Log a hike, trail, or nature walk
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/expedition/live')}
        style={{ backgroundColor: '#6B4226', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 }}
      >
        <Text style={{ fontSize: 40 }}>📍</Text>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Live Expedition</Text>
        <Text style={{ color: '#FED7AA', fontSize: 14, textAlign: 'center' }}>
          Track your adventure in real time
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
```

- [ ] **Step 8.2: Build normal expedition form** (`app/expedition/new.tsx`)

```typescript
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateExpeditionPoints, awardPoints, checkAndAwardBadges } from '../../src/lib/points';
import { supabase } from '../../src/lib/supabase';
import { PointsToast } from '../../src/components/PointsToast';
import { useAuth } from '../../src/hooks/useAuth';
import { ExpeditionType, Difficulty, PointsBreakdown } from '../../src/types';

const EXPEDITION_TYPES: ExpeditionType[] = ['trail', 'hike', 'scenic_view', 'walk', 'nature_spot'];
const DIFFICULTIES: Difficulty[] = ['easy', 'moderate', 'hard'];
const VIBE_TAGS = ['Peaceful', 'Scenic', 'Adventurous', 'Shaded', 'Wildlife-rich', 'Social', 'Relaxing', 'Water feature'];

export default function NewExpeditionScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ExpeditionType>('hike');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('moderate');
  const [selectedVibeTags, setSelectedVibeTags] = useState<string[]>([]);
  const [taggedUsernames, setTaggedUsernames] = useState(''); // comma-separated usernames
  const [posting, setPosting] = useState(false);
  const [pointsBreakdown, setPointsBreakdown] = useState<PointsBreakdown | null>(null);
  const [showToast, setShowToast] = useState(false);

  function toggleVibeTag(tag: string) {
    setSelectedVibeTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  async function postExpedition() {
    if (!title.trim() || !currentUser) {
      Alert.alert('Missing info', 'Please add a title.');
      return;
    }
    setPosting(true);

    try {
      const distanceKm = distance ? parseFloat(distance) : null;
      const totalPoints = await calculateExpeditionPoints(1, distanceKm, false, 0);

      const breakdown: PointsBreakdown = {
        base: totalPoints, new_species_bonus: 0, rare_bonus: 0, total: totalPoints,
      };

      const { data: expedition } = await supabase.from('expeditions').insert({
        user_id: currentUser.id,
        title: title.trim(),
        description: description.trim() || null,
        type,
        location: location.trim() || null,
        distance: distanceKm,
        difficulty,
        vibe_tags: selectedVibeTags,
        photo_urls: [],
        is_live: false,
        points_earned: totalPoints,
      }).select().single();

      // Tag friends by username (WOW #4)
      if (expedition && taggedUsernames.trim()) {
        const usernames = taggedUsernames.split(',').map(u => u.trim().replace('@', '')).filter(Boolean);
        if (usernames.length > 0) {
          const { data: taggedUsers } = await supabase
            .from('users')
            .select('id')
            .in('username', usernames);
          if (taggedUsers && taggedUsers.length > 0) {
            await supabase.from('expedition_participants').insert(
              taggedUsers.map(u => ({ expedition_id: expedition.id, user_id: u.id }))
            );
          }
        }
      }

      await Promise.all([
        awardPoints(currentUser.id, totalPoints),
        checkAndAwardBadges(currentUser.id),
      ]);

      setPointsBreakdown(breakdown);
      setShowToast(true);
      setTimeout(() => router.replace('/(tabs)'), 2000);
    } catch (e) {
      Alert.alert('Error', 'Could not post expedition. Try again.');
      setPosting(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8F4E9' }}>
      <SafeAreaView style={{ padding: 16 }}>
        {pointsBreakdown && <PointsToast points={pointsBreakdown} visible={showToast} />}

        <Text style={{ fontSize: 24, fontWeight: '800', color: '#2D6A4F', marginBottom: 20 }}>Log Expedition 🥾</Text>

        <Label>Title *</Label>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Morning hike at Eno River" style={inputStyle} />

        <Label>Description</Label>
        <TextInput value={description} onChangeText={setDescription} placeholder="What was it like?" style={[inputStyle, { height: 80 }]} multiline />

        <Label>Type</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {EXPEDITION_TYPES.map(t => (
            <TouchableOpacity key={t} onPress={() => setType(t)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: type === t ? '#2D6A4F' : '#E8F5E9' }}>
              <Text style={{ color: type === t ? 'white' : '#2D6A4F', fontWeight: '600', textTransform: 'capitalize' }}>
                {t.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Label>Difficulty</Label>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {DIFFICULTIES.map(d => (
            <TouchableOpacity key={d} onPress={() => setDifficulty(d)}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: difficulty === d ? '#2D6A4F' : '#E8F5E9' }}>
              <Text style={{ color: difficulty === d ? 'white' : '#2D6A4F', fontWeight: '600', textTransform: 'capitalize' }}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Label>Location</Label>
        <TextInput value={location} onChangeText={setLocation} placeholder="e.g. Eno River State Park" style={inputStyle} />

        <Label>Distance (km)</Label>
        <TextInput value={distance} onChangeText={setDistance} placeholder="e.g. 5.2" keyboardType="numeric" style={inputStyle} />

        <Label>Vibes</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {VIBE_TAGS.map(tag => (
            <TouchableOpacity key={tag} onPress={() => toggleVibeTag(tag)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: selectedVibeTags.includes(tag) ? '#52B788' : '#F3F4F6' }}>
              <Text style={{ color: selectedVibeTags.includes(tag) ? 'white' : '#6B7280', fontSize: 13 }}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Label>Tag Friends (WOW #4)</Label>
        <TextInput
          value={taggedUsernames}
          onChangeText={setTaggedUsernames}
          placeholder="@username1, @username2"
          placeholderTextColor="#9CA3AF"
          style={inputStyle}
          autoCapitalize="none"
        />

        <TouchableOpacity
          onPress={postExpedition}
          disabled={posting}
          style={{ backgroundColor: posting ? '#9CA3AF' : '#2D6A4F', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 40 }}
        >
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
            {posting ? 'Posting...' : 'Post Expedition ✨'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}

const inputStyle = {
  backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 15,
  borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16,
};

function Label({ children }: { children: string }) {
  return <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{children}</Text>;
}
```

- [ ] **Step 8.3: Create expedition detail screen** (`app/expedition/[id].tsx`)

```typescript
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpeditions } from '../../src/hooks/useExpeditions';
import { Expedition } from '../../src/types';

export default function ExpeditionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchById } = useExpeditions();
  const [expedition, setExpedition] = useState<Expedition | null>(null);

  useEffect(() => {
    if (id) fetchById(id).then(setExpedition);
  }, [id]);

  if (!expedition) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F4E9' }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8F4E9' }}>
      <SafeAreaView style={{ padding: 16 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#2D6A4F' }}>{expedition.title}</Text>
        <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4, marginBottom: 12 }}>
          by @{expedition.users?.username} · {new Date(expedition.created_at).toLocaleDateString()}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Chip label={expedition.type.replace('_', ' ')} />
          {expedition.difficulty && <Chip label={expedition.difficulty} />}
          {expedition.distance && <Chip label={`${expedition.distance}km`} />}
        </View>

        {expedition.description && (
          <Text style={{ fontSize: 15, color: '#374151', lineHeight: 22, marginBottom: 12 }}>{expedition.description}</Text>
        )}

        {expedition.location && (
          <Text style={{ fontSize: 14, color: '#6B7280' }}>📍 {expedition.location}</Text>
        )}

        {expedition.vibe_tags.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {expedition.vibe_tags.map(tag => <Chip key={tag} label={tag} />)}
          </View>
        )}

        <View style={{ backgroundColor: '#D1FAE5', borderRadius: 12, padding: 12, marginTop: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#065F46' }}>+{expedition.points_earned} pts earned 🌟</Text>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={{ backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontSize: 13, color: '#2D6A4F', textTransform: 'capitalize' }}>{label}</Text>
    </View>
  );
}
```

- [ ] **Step 8.4: Commit**

```bash
git add app/(tabs)/post.tsx app/expedition/
git commit -m "feat: post chooser + expedition form + detail screen (WOW #2)"
```

---

## Task 9: Profile Screen + Leaderboard (WOW #3)

**Files:**
- Create: `src/hooks/useProfile.ts`
- Modify: `app/(tabs)/profile.tsx`
- Modify: `app/(tabs)/leaderboard.tsx`

- [ ] **Step 9.1: Create profile hook** (`src/hooks/useProfile.ts`)

```typescript
import { supabase } from '../lib/supabase';
import { User, Badge, Discovery, Expedition } from '../types';

export async function fetchUserProfile(userId: string) {
  const [userRes, badgesRes, discoveriesRes, expeditionsRes] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('badges').select('*').eq('user_id', userId).order('earned_at', { ascending: false }),
    supabase.from('discoveries').select('id, image_url, common_name, points_earned, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    supabase.from('expeditions').select('id, title, type, points_earned, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
  ]);

  return {
    user: userRes.data as User | null,
    badges: badgesRes.data as Badge[],
    discoveries: discoveriesRes.data as Partial<Discovery>[],
    expeditions: expeditionsRes.data as Partial<Expedition>[],
  };
}

export async function fetchLeaderboard(limit = 50) {
  const { data } = await supabase
    .from('users')
    .select('id, username, total_points, profile_photo_url, streak')
    .order('total_points', { ascending: false })
    .limit(limit);
  return data as User[];
}
```

- [ ] **Step 9.2: Build Profile screen** (`app/(tabs)/profile.tsx`)

```typescript
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchUserProfile } from '../../src/hooks/useProfile';
import { useAuth } from '../../src/hooks/useAuth';
import { Badge, Discovery, Expedition, User } from '../../src/types';

const BADGE_LABELS: Record<string, string> = {
  first_discovery: '🌿 First Discovery',
  trailblazer: '🥾 Trailblazer',
  explorer: '⛰ Explorer',
  rare_finder: '🌟 Rare Finder',
  social_explorer: '👥 Social Explorer',
};

export default function ProfileScreen() {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState<{ user: User | null; badges: Badge[]; discoveries: Partial<Discovery>[]; expeditions: Partial<Expedition>[] } | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchUserProfile(currentUser.id).then(setProfile);
    }
  }, [currentUser]);

  if (!profile?.user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F4E9' }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </SafeAreaView>
    );
  }

  const { user, badges, discoveries, expeditions } = profile;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8F4E9' }}>
      <SafeAreaView>
        {/* Header */}
        <View style={{ padding: 20, alignItems: 'center' }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#2D6A4F', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 36 }}>🌿</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#2D6A4F' }}>@{user.username}</Text>
          {user.bio && <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>{user.bio}</Text>}
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', margin: 12, gap: 12 }}>
          <StatCard label="Total Points" value={user.total_points.toLocaleString()} emoji="⭐" />
          <StatCard label="Streak" value={`${user.streak}d`} emoji="🔥" />
          <StatCard label="Discoveries" value={discoveries.length.toString()} emoji="🔍" />
        </View>

        {/* Badges */}
        {badges.length > 0 && (
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#2D6A4F', marginBottom: 10 }}>Badges</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {badges.map(b => (
                <View key={b.id} style={{ backgroundColor: '#FEF3C7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400E' }}>
                    {BADGE_LABELS[b.badge_type] ?? b.badge_type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Discovery grid */}
        {discoveries.length > 0 && (
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#2D6A4F', marginBottom: 10 }}>Discoveries</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {discoveries.map(d => (
                <Image key={d.id} source={{ uri: d.image_url }} style={{ width: 100, height: 100, borderRadius: 8 }} />
              ))}
            </View>
          </View>
        )}

        {/* Expeditions list */}
        {expeditions.length > 0 && (
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#2D6A4F', marginBottom: 10 }}>Expeditions</Text>
            {expeditions.map(e => (
              <View key={e.id} style={{ backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, color: '#374151', fontWeight: '600', flex: 1 }}>{e.title}</Text>
                <Text style={{ fontSize: 13, color: '#52B788', fontWeight: '700' }}>+{e.points_earned}pts</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity onPress={logout} style={{ margin: 16, padding: 14, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center' }}>
          <Text style={{ color: '#B91C1C', fontWeight: '700', fontSize: 15 }}>Sign Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#2D6A4F', marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}
```

- [ ] **Step 9.3: Build Leaderboard screen** (`app/(tabs)/leaderboard.tsx`)

```typescript
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchLeaderboard } from '../../src/hooks/useProfile';
import { useAuth } from '../../src/hooks/useAuth';
import { User } from '../../src/types';

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard().then(data => {
      setUsers(data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F4E9' }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F4E9' }}>
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#2D6A4F' }}>🏆 Leaderboard</Text>
        <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>All-time points</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={u => u.id}
        renderItem={({ item, index }) => {
          const isMe = item.id === currentUser?.id;
          return (
            <View style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: isMe ? '#D1FAE5' : 'white',
              marginHorizontal: 12, marginVertical: 4, borderRadius: 14, padding: 14,
              borderWidth: isMe ? 2 : 0, borderColor: '#52B788',
              shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
            }}>
              <Text style={{ fontSize: 22, width: 36 }}>{RANK_EMOJI[index] ?? `${index + 1}.`}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#374151' }}>
                  @{item.username} {isMe ? '(you)' : ''}
                </Text>
                {item.streak > 0 && (
                  <Text style={{ fontSize: 12, color: '#9CA3AF' }}>🔥 {item.streak} day streak</Text>
                )}
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#2D6A4F' }}>
                {item.total_points.toLocaleString()}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 9.4: Commit**

```bash
git add app/(tabs)/profile.tsx app/(tabs)/leaderboard.tsx src/hooks/useProfile.ts
git commit -m "feat: profile and leaderboard screens (WOW #3)"
```

---

## Task 10: Live Expedition (WOW #4 support)

**Files:**
- Create: `app/expedition/live.tsx`

- [ ] **Step 10.1: Build live expedition tracker** (`app/expedition/live.tsx`)

```typescript
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateExpeditionPoints, awardPoints } from '../../src/lib/points';
import { supabase } from '../../src/lib/supabase';
import { PointsToast } from '../../src/components/PointsToast';
import { useAuth } from '../../src/hooks/useAuth';
import { PointsBreakdown } from '../../src/types';

export default function LiveExpeditionScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pointsBreakdown, setPointsBreakdown] = useState<PointsBreakdown | null>(null);
  const [showToast, setShowToast] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function startExpedition() {
    setRunning(true);
    setStartTime(new Date());
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }

  async function endExpedition() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);

    if (!currentUser || !startTime) return;

    const durationSeconds = elapsed;
    const totalPoints = await calculateExpeditionPoints(1, null, true, 0);
    const breakdown: PointsBreakdown = { base: totalPoints, new_species_bonus: 0, rare_bonus: 0, total: totalPoints };

    const endTime = new Date();

    await supabase.from('expeditions').insert({
      user_id: currentUser.id,
      title: `Live expedition — ${startTime.toLocaleDateString()}`,
      type: 'hike',
      is_live: true,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_seconds: durationSeconds,
      vibe_tags: [],
      photo_urls: [],
      points_earned: totalPoints,
    });

    await awardPoints(currentUser.id, totalPoints);
    setPointsBreakdown(breakdown);
    setShowToast(true);
    setTimeout(() => router.replace('/(tabs)'), 2500);
  }

  function formatTime(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F4E9', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {pointsBreakdown && <PointsToast points={pointsBreakdown} visible={showToast} />}

      <Text style={{ fontSize: 60 }}>{running ? '📍' : '🥾'}</Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#2D6A4F', marginTop: 8 }}>
        {running ? 'Expedition in progress' : 'Ready to explore?'}
      </Text>

      {running && (
        <View style={{ marginVertical: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: 56, fontWeight: '800', color: '#2D6A4F' }}>
            {formatTime(elapsed)}
          </Text>
          <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>time elapsed</Text>
        </View>
      )}

      {!running && <View style={{ height: 60 }} />}

      {!running ? (
        <TouchableOpacity
          onPress={startExpedition}
          style={{ backgroundColor: '#2D6A4F', paddingHorizontal: 48, paddingVertical: 20, borderRadius: 40 }}
        >
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>Start Expedition</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={endExpedition}
          style={{ backgroundColor: '#B91C1C', paddingHorizontal: 48, paddingVertical: 20, borderRadius: 40 }}
        >
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>End Expedition</Text>
        </TouchableOpacity>
      )}

      {!running && (
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#6B7280', fontSize: 15 }}>Cancel</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
```

- [ ] **Step 10.2: Commit**

```bash
git add app/expedition/live.tsx
git commit -m "feat: live expedition timer with points award"
```

---

## Task 11: Badge Awarding

**Files:**
- Modify: `src/lib/points.ts`

- [ ] **Step 11.1: Add badge award logic to `src/lib/points.ts`**

Append to the file:

```typescript
const BADGE_RULES: { type: string; check: (userId: string) => Promise<boolean> }[] = [
  {
    type: 'first_discovery',
    check: async (userId) => {
      const { count } = await supabase.from('discoveries').select('id', { count: 'exact' }).eq('user_id', userId);
      return (count ?? 0) === 1;
    },
  },
  {
    type: 'trailblazer',
    check: async (userId) => {
      const { count } = await supabase.from('expeditions').select('id', { count: 'exact' }).eq('user_id', userId);
      return (count ?? 0) === 1;
    },
  },
  {
    type: 'explorer',
    check: async (userId) => {
      const { count } = await supabase.from('expeditions').select('id', { count: 'exact' }).eq('user_id', userId);
      return (count ?? 0) >= 5;
    },
  },
  {
    type: 'rare_finder',
    check: async (userId) => {
      const { count } = await supabase.from('discoveries').select('id', { count: 'exact' }).eq('user_id', userId).eq('is_sensitive', true);
      return (count ?? 0) >= 1;
    },
  },
];

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const { data: existing } = await supabase.from('badges').select('badge_type').eq('user_id', userId);
  const existingTypes = new Set((existing ?? []).map(b => b.badge_type));
  const awarded: string[] = [];

  for (const rule of BADGE_RULES) {
    if (existingTypes.has(rule.type)) continue;
    if (await rule.check(userId)) {
      await supabase.from('badges').insert({ user_id: userId, badge_type: rule.type });
      awarded.push(rule.type);
    }
  }

  return awarded;
}
```

- [ ] **Step 11.2: Commit**

```bash
git add src/lib/points.ts app/discovery/new.tsx app/expedition/new.tsx
git commit -m "feat: auto-award badges on discovery and expedition milestones"
```

---

## Task 12: Final Polish + Demo Seed Data

- [ ] **Step 12.1: Verify all 4 WOW moments work end-to-end**

Test checklist:
- [ ] Take photo → AI scans → fact card appears with species name and fun fact
- [ ] Post discovery → points toast animates → feed updates with new card
- [ ] Post expedition → discovery linked → expedition card shows in feed
- [ ] Leaderboard shows all users ranked by points with your position highlighted
- [ ] Profile shows total points, streak, discovery grid, badges

- [ ] **Step 12.2: Fix any crashes found in 12.1**

Run on device via Expo Go, note any console errors, fix them.

- [ ] **Step 12.3: Seed demo data (if needed for presentation)**

In Supabase SQL editor, insert a couple of fake users with points so leaderboard isn't empty:
```sql
-- Only run if you need demo data for presentation
insert into users (auth0_id, username, total_points, streak)
values
  ('demo|001', 'naturelover42', 580, 7),
  ('demo|002', 'trailblazer99', 430, 3),
  ('demo|003', 'wildexplorer', 290, 1);
```

- [ ] **Step 12.4: Final commit**

```bash
git add -A
git commit -m "feat: Root MVP — all WOW moments complete and demo-ready"
```

---

## Team Execution Plan (high-level, parallel where possible)

### Phase 1 — Foundation (first ~2–3 hours)
- **Claude:** Tasks 1–5 (scaffold, schema, lib files, auth, navigation)
- **Team:** Set up Supabase project + run schema, set up Auth0, get OpenAI key, fill in `.env.local`

### Phase 2 — Core WOW Moments (next ~4–5 hours)
- **Claude:** Tasks 6–8 (AI discovery flow, feed, post/expedition form)
- **Team:** Test on devices as features land, provide feedback, help with API keys/config issues

### Phase 3 — Profile + Leaderboard (next ~2 hours)
- **Claude:** Tasks 9–10 (profile, leaderboard, live expedition)
- **Team:** Create real discoveries and expeditions to populate the feed for demo

### Phase 4 — Polish + Demo Prep (remaining time)
- **Claude:** Tasks 11–12 (badges, bug fixes, seed data)
- **Team:** Practice the demo flow, prepare talking points for judges

---

## Critical Path

If time runs short, cut in this order (later = cut first):
1. ~~Badge awarding (Task 11)~~
2. ~~Live expedition timer (Task 10)~~
3. ~~Expedition detail screen~~ — just show feed cards
4. **Never cut:** AI identification, discovery posting, points display, leaderboard
