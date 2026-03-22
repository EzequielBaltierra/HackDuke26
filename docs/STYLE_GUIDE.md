# Root App Style Guide

> This document is the single source of truth for UI design in the Root app.
> AI agents and developers MUST follow these guidelines for all UI implementation.

---

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing System](#spacing-system)
4. [Component Patterns](#component-patterns)
5. [Navigation](#navigation)
6. [Screen Layouts](#screen-layouts)
7. [Icons](#icons)
8. [Tailwind Configuration](#tailwind-configuration)
9. [Implementation Checklist](#implementation-checklist)

---

## Color Palette

### Primary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#EADED0` | Main app background (cream) |
| `bg-accent` | `#C7AF94` | Highlighted sections, tags, chips |
| `green-base` | `#4E705E` | Primary green - buttons, Quick Facts, success |
| `green-accent` | `#08463D` | Darker green - pressed states, emphasis |
| `red-base` | `#6D3A3C` | Primary burgundy - "Expedition" header, icons |
| `red-accent` | `#361319` | Dark burgundy - "Discovery" active, emphasis |
| `blue-accent` | `#617891` | Links, informational elements |
| `text-primary` | `#110703` | Default text color (near-black) |
| `text-muted` | `#4A4459` | Vibe tags, secondary text |

### Color Constants

```typescript
// src/styles/colors.ts
export const colors = {
  // Backgrounds
  bg: {
    primary: '#EADED0',    // Main background (cream)
    accent: '#C7AF94',     // Tags, chips, highlighted areas
  },

  // Green palette (positive actions, nature, expeditions)
  green: {
    base: '#4E705E',       // Primary green
    accent: '#08463D',     // Pressed/hover states
  },

  // Red palette (headers, branding)
  red: {
    base: '#6D3A3C',       // "Expedition" header color
    accent: '#361319',     // "Discovery" header when active
  },

  // Blue palette
  blue: {
    accent: '#617891',     // Links, info
  },

  // Text colors
  text: {
    primary: '#110703',    // Default body text
    muted: '#4A4459',      // Vibe tags, secondary
    inverse: '#FFFFFF',    // Text on dark backgrounds
  },

  // Utility
  divider: '#110703',      // Use with 30% opacity
} as const;
```

### Semantic Color Mapping

```
Background Primary:     bg-primary (#EADED0)
Background Accent:      bg-accent (#C7AF94)
Background Green:       green-base (#4E705E)
Text Primary:           text-primary (#110703)
Text Muted:             text-muted (#4A4459)
Text On Green:          #FFFFFF
Header Expedition:      red-base (#6D3A3C)
Header Discovery:       red-accent (#361319)
Points Display:         green-base (#4E705E)
Tags Background:        bg-accent (#C7AF94)
Tags Text:              text-muted (#4A4459)
Quick Facts Bg:         green-base (#4E705E)
Tab Bar Bg:             green-base (#4E705E)
Tab Bar Icons:          #EADED0
```

### Usage Rules

1. **NEVER** use pure black (`#000000`) for text. Use `text-primary` (#110703).
2. **NEVER** use pure white (`#FFFFFF`) for backgrounds. Use `bg-primary` (#EADED0).
3. Cards blend with background - use subtle borders or shadows for separation.
4. The `green-base` is reserved for:
   - Tab bar background
   - Primary buttons
   - Points display text
   - "Quick Facts" expandable sections
   - Success indicators
5. The `red-base` / `red-accent` are reserved for:
   - Page headers ("Expedition" / "Discovery")
   - Important icons
   - Active/inactive toggle states

---

## Typography

### Font Families

| Font | Style | Usage | Package |
|------|-------|-------|---------|
| **Faustina** | Serif | Headers, page titles, toggle labels | `@expo-google-fonts/faustina` |
| **Crimson Text** | Serif | Body text, cards, all other content | `@expo-google-fonts/crimson-text` |

> **Note:** Both fonts are serif fonts for a cohesive, nature/organic feel.

### Type Scale

Point sizes below are design specs. For React Native, convert: `fontSize ≈ pt × 0.5` (adjust to visual match).

| Token | Font | Weight | Size (Design) | Size (RN) | Color | Usage |
|-------|------|--------|---------------|-----------|-------|-------|
| `titleHeader` | Faustina | SemiBold (600) | 64pt | 32px | `#6D3A3C` | "Expedition" header |
| `titleHeaderAccent` | Faustina | SemiBold (600) | 64pt | 32px | `#361319` | "Discovery" when active |
| `postTitle` | Crimson Text | Bold (700) | 36pt | 18px | `#110703` | Card/post titles |
| `postLocation` | Crimson Text | Bold (700) | 32pt | 16px | `#110703` | Location text |
| `postDescription` | Crimson Text | Regular (400) | 32pt | 16px | `#110703` | Body/description text |
| `vibeTag` | Crimson Text | Bold (700) | 24pt | 12px | `#4A4459` | Tag/chip labels |
| `userName` | Crimson Text | SemiBold (600) | 48pt | 24px | `#110703` | Username in cards |
| `userPoints` | Crimson Text | Regular (400) | 45pt | 22px | `#110703` | Points next to username |
| `duration` | Crimson Text | SemiBold (600) | 40pt | 20px | `#110703` | Duration/distance stats |
| `points` | Crimson Text | Regular (400) | 38pt | 19px | `#4E705E` | Points earned (+500) |
| `quickFacts` | Crimson Text | Bold (700) | 48pt | 24px | `#FFFFFF` | "Quick Facts" header |

### Font Loading (Required Setup)

```tsx
// app/_layout.tsx
import { useEffect } from 'react';
import {
  useFonts,
  Faustina_400Regular,
  Faustina_600SemiBold,
  Faustina_700Bold,
} from '@expo-google-fonts/faustina';
import {
  CrimsonText_400Regular,
  CrimsonText_600SemiBold,
  CrimsonText_700Bold,
} from '@expo-google-fonts/crimson-text';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Faustina_400Regular,
    Faustina_600SemiBold,
    Faustina_700Bold,
    CrimsonText_400Regular,
    CrimsonText_600SemiBold,
    CrimsonText_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;
  // ... rest of layout
}
```

### Font Style Constants

```tsx
// src/styles/fonts.ts
export const fonts = {
  // Faustina - Headers/Titles
  header: { fontFamily: 'Faustina_600SemiBold' },
  headerBold: { fontFamily: 'Faustina_700Bold' },
  headerRegular: { fontFamily: 'Faustina_400Regular' },

  // Crimson Text - Body/Content
  body: { fontFamily: 'CrimsonText_400Regular' },
  bodySemiBold: { fontFamily: 'CrimsonText_600SemiBold' },
  bodyBold: { fontFamily: 'CrimsonText_700Bold' },
} as const;

// Pre-built text styles
export const textStyles = {
  titleHeader: {
    fontFamily: 'Faustina_600SemiBold',
    fontSize: 32,
    color: '#6D3A3C',
    letterSpacing: -0.5,
  },
  titleHeaderAccent: {
    fontFamily: 'Faustina_600SemiBold',
    fontSize: 32,
    color: '#361319',
    letterSpacing: -0.5,
  },
  postTitle: {
    fontFamily: 'CrimsonText_700Bold',
    fontSize: 18,
    color: '#110703',
  },
  postLocation: {
    fontFamily: 'CrimsonText_700Bold',
    fontSize: 16,
    color: '#110703',
  },
  postDescription: {
    fontFamily: 'CrimsonText_400Regular',
    fontSize: 16,
    color: '#110703',
    lineHeight: 22,
  },
  vibeTag: {
    fontFamily: 'CrimsonText_700Bold',
    fontSize: 12,
    color: '#4A4459',
  },
  userName: {
    fontFamily: 'CrimsonText_600SemiBold',
    fontSize: 24,
    color: '#110703',
  },
  userPoints: {
    fontFamily: 'CrimsonText_400Regular',
    fontSize: 22,
    color: '#110703',
  },
  duration: {
    fontFamily: 'CrimsonText_600SemiBold',
    fontSize: 20,
    color: '#110703',
  },
  points: {
    fontFamily: 'CrimsonText_400Regular',
    fontSize: 19,
    color: '#4E705E',
  },
  quickFactsTitle: {
    fontFamily: 'CrimsonText_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
} as const;
```

---

## Spacing System

Use a **4px base unit** system:

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Icon gaps, tight spacing |
| `sm` | 8px | Tag padding, small gaps |
| `md` | 12px | Card internal padding |
| `lg` | 16px | Section spacing, margins |
| `xl` | 20px | Screen horizontal padding |
| `2xl` | 24px | Large section gaps |
| `3xl` | 32px | Major section separators |

### Screen Padding

- Horizontal padding: `20px` (xl)
- Card margin horizontal: `16px` (lg)
- Card margin vertical: `12px` (md)

---

## Component Patterns

### Feed Toggle (Expedition | Discovery)

The main header toggle for switching between feed types.

```tsx
// Structure
<View style={styles.toggleContainer}>
  <TouchableOpacity onPress={() => setTab('expeditions')}>
    <Text style={[
      styles.expeditionText,
      { opacity: tab === 'expeditions' ? 1 : 0.35 }
    ]}>
      Expedition
    </Text>
  </TouchableOpacity>
  <View style={styles.divider} />
  <TouchableOpacity onPress={() => setTab('discoveries')}>
    <Text style={[
      styles.discoveryText,
      { opacity: tab === 'discoveries' ? 1 : 0.35 }
    ]}>
      Discovery
    </Text>
  </TouchableOpacity>
</View>

// Styles
const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#EADED0',
  },
  expeditionText: {
    fontFamily: 'Faustina_600SemiBold',
    fontSize: 32,
    color: '#6D3A3C',  // red-base
    letterSpacing: -0.5,
  },
  discoveryText: {
    fontFamily: 'Faustina_600SemiBold',
    fontSize: 32,
    color: '#361319',  // red-accent (darker)
    letterSpacing: -0.5,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: '#110703',
    opacity: 0.3,
    marginHorizontal: 16,
  },
});
```

### Expedition Card

```
┌─────────────────────────────────────┐
│ [Avatar] PercCobain    1,000 pts [+]│  <- User row
├─────────────────────────────────────┤
│ Card Title                          │  <- Crimson Bold 18px
│ Location • Date                     │  <- Crimson Bold 16px
├─────────────────────────────────────┤
│ [Scenic] [Quiet] [Water Feature]   │  <- bg-accent, pill shape
├─────────────────────────────────────┤
│ Description text here...            │  <- Crimson Regular 16px
├─────────────────────────────────────┤
│                                     │
│         [Image Carousel]       ◄ ► │
│                                     │
├─────────────────────────────────────┤
│ 1.2 miles │ 19:52 │ 👥 │ +500 pts  │  <- Stats bar
└─────────────────────────────────────┘
```

**Card Styles:**
```tsx
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EADED0',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
  },
  postTitle: {
    fontFamily: 'CrimsonText_700Bold',
    fontSize: 18,
    color: '#110703',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  postLocation: {
    fontFamily: 'CrimsonText_700Bold',
    fontSize: 16,
    color: '#110703',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  description: {
    fontFamily: 'CrimsonText_400Regular',
    fontSize: 16,
    color: '#110703',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    aspectRatio: 4/3,
  },
});
```

### Discovery Card

```
┌─────────────────────────────────────┐
│ [Avatar] Username      Points   [+] │  <- User row
├─────────────────────────────────────┤
│                                     │
│         [Full Bleed Image]          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Description text...         │   │  <- Overlay
│  │ Location • +75 pts          │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│ ▼ Quick Facts                       │  <- green-base bg
│   • Scientific name                 │
│   • Fact 1                          │
│   • Fact 2                          │
└─────────────────────────────────────┘
```

**Discovery Card Styles:**
```tsx
const styles = StyleSheet.create({
  discoveryCard: {
    backgroundColor: '#EADED0',
  },
  imageWrapper: {
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    aspectRatio: 3/4,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(17, 7, 3, 0.4)',
  },
  overlayText: {
    fontFamily: 'CrimsonText_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  quickFactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4E705E',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickFactsTitle: {
    fontFamily: 'CrimsonText_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
```

### User Row

```tsx
const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C7AF94',
    borderWidth: 2,
    borderColor: '#6D3A3C',
  },
  userName: {
    fontFamily: 'CrimsonText_600SemiBold',
    fontSize: 24,
    color: '#110703',
    marginLeft: 12,
  },
  userPoints: {
    fontFamily: 'CrimsonText_400Regular',
    fontSize: 22,
    color: '#110703',
    marginLeft: 8,
  },
  addButton: {
    marginLeft: 'auto',
    padding: 4,
  },
});
```

### Vibe Tags / Chips

```tsx
const styles = StyleSheet.create({
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#C7AF94',  // bg-accent
    borderRadius: 16,            // pill shape
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#110703',
  },
  tagText: {
    fontFamily: 'CrimsonText_700Bold',
    fontSize: 12,
    color: '#4A4459',  // text-muted
  },
});
```

### Points Display

```tsx
// In stats bar or user row
const styles = StyleSheet.create({
  pointsText: {
    fontFamily: 'CrimsonText_400Regular',
    fontSize: 19,
    color: '#4E705E',  // green-base
  },
});
```

### Stats Bar

```tsx
const styles = StyleSheet.create({
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontFamily: 'CrimsonText_600SemiBold',
    fontSize: 20,
    color: '#110703',
    marginLeft: 4,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#110703',
    opacity: 0.2,
    marginHorizontal: 12,
  },
});
```

### Primary Button

```tsx
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#4E705E',  // green-base
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: '#08463D',  // green-accent (darker)
  },
  primaryButtonText: {
    fontFamily: 'CrimsonText_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});
```

### Secondary Button

```tsx
const styles = StyleSheet.create({
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4E705E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'CrimsonText_600SemiBold',
    fontSize: 18,
    color: '#4E705E',
  },
});
```

### Quick Facts Section (Expandable)

```tsx
const styles = StyleSheet.create({
  quickFacts: {
    backgroundColor: '#4E705E',  // green-base
    overflow: 'hidden',
  },
  quickFactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  quickFactsTitle: {
    fontFamily: 'CrimsonText_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  quickFactsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  factText: {
    fontFamily: 'CrimsonText_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 22,
  },
});
```

---

## Navigation

### Bottom Tab Bar

The tab bar uses custom icons on a `green-base` (#4E705E) background.

```
┌─────────────────────────────────────────────────┐
│  🥾      📍      ⊘      🔍      ⛰️            │
│ Feed   Discover  Post  Search  Profile         │
└─────────────────────────────────────────────────┘
     ↑ green-base (#4E705E) background
     ↑ Icons: cream (#EADED0) color
```

**Tab Bar Configuration:**
```tsx
const tabBarOptions = {
  tabBarStyle: {
    backgroundColor: '#4E705E',
    borderTopWidth: 0,
    height: 80,
    paddingBottom: 20,
    paddingTop: 12,
  },
  tabBarActiveTintColor: '#EADED0',
  tabBarInactiveTintColor: '#EADED0',  // Same color, use opacity
  tabBarShowLabel: false,  // Icons only based on mockup
};
```

### Tab Icons

| Tab | Icon | Description |
|-----|------|-------------|
| Feed/Expeditions | Hiking boots | Double boot outline |
| Discover | Location pin | Map marker |
| Post/Create | Circle with slash | Compass/crossed circle |
| Search | Magnifying glass | Standard search |
| Profile | Mountain peak | Triangle mountain |

**Icon Implementation:**
```tsx
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const color = '#EADED0';  // cream
  const opacity = focused ? 1 : 0.6;

  return (
    <View style={{ opacity }}>
      <CustomIcon name={name} size={28} color={color} />
    </View>
  );
}
```

### Header Style

```tsx
const headerOptions = {
  headerStyle: {
    backgroundColor: '#EADED0',
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: '#110703',
  headerTitleStyle: {
    fontFamily: 'Faustina_600SemiBold',
    fontSize: 24,
    color: '#110703',
  },
  headerShadowVisible: false,
};
```

---

## Screen Layouts

### Standard Screen Template

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: '#EADED0' }} edges={['top']}>
  {/* Header Toggle */}
  <FeedToggle active={tab} onChange={setTab} />

  {/* Scrollable Content */}
  <FlatList
    data={items}
    renderItem={({ item }) => <Card item={item} />}
    contentContainerStyle={{ paddingBottom: 24 }}
    showsVerticalScrollIndicator={false}
  />
</SafeAreaView>
```

### Form Screen Template

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: '#EADED0' }}>
  <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      {/* Form Fields */}
    </ScrollView>

    {/* Fixed Bottom Button */}
    <View style={{ padding: 20, backgroundColor: '#EADED0' }}>
      <PrimaryButton title="Submit" onPress={handleSubmit} />
    </View>
  </KeyboardAvoidingView>
</SafeAreaView>
```

---

## Icons

### Required Icon Set

**Tab Bar Icons** (stroke style, 2px weight, 28x28px):
- `hiking-boots.svg` - Double hiking boot outline
- `location-pin.svg` - Map pin/marker
- `compass-circle.svg` - Circle with crossed lines
- `search.svg` - Magnifying glass
- `mountain.svg` - Mountain peak silhouette

**UI Icons** (24x24px):
- `chevron-left.svg` / `chevron-right.svg` - Carousel navigation
- `chevron-down.svg` / `chevron-up.svg` - Expandable sections
- `plus-circle.svg` - Add/follow button
- `heart.svg` - Like
- `comment.svg` - Comments
- `clock.svg` - Duration
- `route.svg` - Distance
- `users.svg` - Participants
- `camera.svg` - Take photo
- `image.svg` - Gallery

### Icon Component

```tsx
// src/components/Icon.tsx
import Svg, { Path } from 'react-native-svg';

type IconProps = {
  name: string;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 24, color = '#110703' }: IconProps) {
  // Icon SVG paths defined here or loaded from files
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* SVG paths */}
    </Svg>
  );
}
```

---

## Tailwind Configuration

Update `tailwind.config.js` to match this style guide:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Background colors
        'bg-primary': '#EADED0',
        'bg-accent': '#C7AF94',

        // Green palette
        'green-base': '#4E705E',
        'green-accent': '#08463D',

        // Red palette
        'red-base': '#6D3A3C',
        'red-accent': '#361319',

        // Blue
        'blue-accent': '#617891',

        // Text
        'text-primary': '#110703',
        'text-muted': '#4A4459',

        // Legacy aliases (for migration)
        cream: '#EADED0',
        sand: '#C7AF94',
        forest: '#4E705E',
        burgundy: '#6D3A3C',
        maroon: '#361319',
      },
      fontFamily: {
        // Faustina - Headers
        'faustina': ['Faustina_600SemiBold'],
        'faustina-bold': ['Faustina_700Bold'],

        // Crimson Text - Body
        'crimson': ['CrimsonText_400Regular'],
        'crimson-semibold': ['CrimsonText_600SemiBold'],
        'crimson-bold': ['CrimsonText_700Bold'],
      },
      borderRadius: {
        'card': '12px',
        'button': '12px',
        'tag': '16px',
        'avatar': '22px',
      },
      spacing: {
        'screen-x': '20px',
        'card-x': '16px',
        'card-y': '12px',
      },
    },
  },
  plugins: [],
};
```

---

## Implementation Checklist

When implementing or updating screens, verify:

### Colors
- [ ] Background uses `bg-primary` (#EADED0)
- [ ] Text uses `text-primary` (#110703), never pure black
- [ ] Green elements use `green-base` (#4E705E)
- [ ] "Expedition" header uses `red-base` (#6D3A3C)
- [ ] "Discovery" header uses `red-accent` (#361319)
- [ ] Tags use `bg-accent` (#C7AF94) background
- [ ] Tag text uses `text-muted` (#4A4459)
- [ ] Points display in `green-base` (#4E705E)
- [ ] Tab bar background is `green-base` (#4E705E)
- [ ] Quick Facts background is `green-base` (#4E705E)

### Typography
- [ ] Headers use Faustina SemiBold
- [ ] Body text uses Crimson Text family
- [ ] Font weights match the type scale
- [ ] No system fonts used for visible text
- [ ] Faustina and Crimson Text fonts are loaded in _layout.tsx

### Components
- [ ] Cards have 12px border radius
- [ ] Tags are pill-shaped (16px radius)
- [ ] User avatars are 44px with burgundy border
- [ ] Image aspect ratio is 4:3 for expeditions, 3:4 for discoveries
- [ ] Quick Facts section is expandable with green background

### Navigation
- [ ] Tab bar uses custom SVG icons (not emojis)
- [ ] Tab bar background is `green-base`
- [ ] Tab icons are cream colored (#EADED0)
- [ ] Active state: full opacity; Inactive: 60% opacity
- [ ] No tab labels (icons only)

### Spacing
- [ ] Screen horizontal padding is 20px
- [ ] Card padding is 16px horizontal, 12px vertical
- [ ] Consistent 4px-based spacing
- [ ] Tag gap is 8px

---

## Migration Notes

### Current Issues to Fix

1. **Tab bar icons** - Currently using emojis, need custom SVG icons
2. **Fonts** - Currently using system fonts, need Faustina + Crimson Text (NOT Fraunces/Nunito)
3. **Colors** - Update to new palette (especially green-accent #08463D)
4. **Typography scale** - Update font sizes to match new specifications

### Priority Order for Updates

1. Install font packages: `@expo-google-fonts/faustina` and `@expo-google-fonts/crimson-text`
2. Configure font loading in `app/_layout.tsx`
3. Create/import SVG icon set for tab bar
4. Update tab bar with custom icons and green background
5. Update `tailwind.config.js` with new color tokens
6. Update FeedToggle component with new fonts and colors
7. Update card components with new typography
8. Apply new styles to all screens

### Package Installation

```bash
npx expo install @expo-google-fonts/faustina @expo-google-fonts/crimson-text expo-splash-screen
```

---

*Last updated: 2026-03-21*
*Version: 2.0*
