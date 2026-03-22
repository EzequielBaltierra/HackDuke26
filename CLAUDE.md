# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Root** — A gamified social mobile app for nature lovers.
HackDuke 2026 hackathon project by Israel, Ezequiel, Emilio, and Cesar.

## Tech Stack

- **Frontend:** React Native (Expo SDK 54), TypeScript, NativeWind v2
- **Backend:** Supabase (PostgreSQL, Storage, Auth)
- **AI:** OpenAI GPT-4o for species identification
- **Auth:** Auth0 via expo-auth-session

## Key Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
```

## Project Structure

```
app/               # Expo Router screens (file-based routing)
  (tabs)/          # Tab navigation screens
  discovery/       # Discovery flow screens
  expedition/      # Expedition flow screens
src/
  components/      # Reusable UI components
  contexts/        # React contexts (AuthContext)
  hooks/           # Custom hooks (useDiscoveries, useExpeditions, etc.)
  lib/             # Utilities (supabase, openai, points)
  types/           # TypeScript type definitions
supabase/
  schema.sql       # Database schema
docs/
  STYLE_GUIDE.md   # UI design system (MUST follow for all UI work)
```

## UI Design Guidelines

**IMPORTANT:** All UI implementation MUST follow `docs/STYLE_GUIDE.md`.

### Quick Reference

- **Colors:** cream (#eaded0), forest (#4e705e), maroon (#361319), olive (#6d7c65), sand (#c7af94)
- **Fonts:** Fraunces (headers), Nunito Sans (body)
- **Background:** Always use `cream`, never pure white
- **Text:** Always use `maroon` for primary, never pure black
- **Tab bar:** Forest green background with custom SVG icons

### Before Implementing UI

1. Read `docs/STYLE_GUIDE.md` thoroughly
2. Use the defined color palette (no arbitrary colors)
3. Use Fraunces for headers, Nunito Sans for body
4. Follow component patterns for cards, tags, buttons
5. Use 4px-based spacing system

## Code Style

- Use TypeScript for all new files
- Prefer functional components with hooks
- Use NativeWind/Tailwind classes where possible, inline styles when needed
- Keep components focused and reusable
