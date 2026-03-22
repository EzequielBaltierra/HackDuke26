# Root — Style guide (source of truth)

The **code** is the implementation reference: `src/theme/colors.ts`, `src/theme/typography.ts`, and fonts loaded in `app/_layout.tsx`. You do **not** need Figma open to build or review UI—Figma is for design exploration and optional MCP extraction.

**Figma file (reference):** [Root — P2VfrouvD3T3UImXRp0oLH](https://www.figma.com/design/P2VfrouvD3T3UImXRp0oLH/Root?node-id=16-13) (feed frame `16:13`).

---

## Figma MCP — how to use it (and why it often fails from Cursor)

The Cursor **Figma MCP** talks to the **Figma desktop app**. `get_design_context(fileKey, nodeId)` still requires:

1. **Figma desktop** running with the file open (not only the browser).
2. The **target layer/frame selected** in the canvas when the tool runs. If nothing is selected, you get: *“You currently have nothing selected. You need to select a layer first.”*

**Workflow:** Open the file → navigate to node `16-13` → **click that frame so it is selected** → run `get_design_context` with `fileKey=P2VfrouvD3T3UImXRp0oLH` and `nodeId=16-13` (or `16:13`).

**If you only use Figma in the browser:** use Figma’s **Dev Mode** / inspect there, or paste screenshots—**this repo’s tokens** (`src/theme`) stay authoritative.

---

## Color palette

| Role | Hex | Token (`colors.*`) |
|------|-----|---------------------|
| Background foundational | `#EADED0` | `bg` |
| Background accent / highlighted | `#C7AF94` | `bgAccent` |
| Base green foundational | `#4E705E` | `green` |
| Base green accent / highlight | `#08463D` | `greenAccent` |
| Base red foundational | `#6D3A3C` | `red` |
| Base red accent / highlight | `#361319` | `redAccent` |
| Blue accent | `#617891` | `blueAccent` |
| Text (default) | `#110703` | `text` |
| Vibe tags | `#4A4459` | `vibeTag` |
| Card / surface on sand | `#FFFFFF` | `surface` |

**Usage notes**

- **Tab bar:** `green` background, **2px top border** `greenAccent`; active icon `bg`, inactive `bgAccent`.
- **Feed toggle track:** `bgAccent` with outer border `greenAccent`; active pill `green`, label on active `bg`.
- **Search field:** border `blueAccent`; magnify icon `blueAccent`.
- **Points / emphasis numerals:** prefer `greenAccent` on light backgrounds.

---

## Typography

Fonts load via `@expo-google-fonts/faustina` and `@expo-google-fonts/crimson-text` + `expo-font` in `app/_layout.tsx`.

| Use | Font | Size | Color |
|-----|------|------|--------|
| Title / header | Faustina Semibold | 64pt | `#6D3A3C` (`type.titleHeader`) |
| Title / header accent | Faustina Semibold | 64pt | `#361319` (`type.titleHeaderAccent`) |
| Nav / tab titles | Faustina Semibold | ~22pt | `#361319` (`type.navTitle`) |
| Post title | Crimson Text Bold | 36pt | `text` (`type.postTitle`) |
| Post location | Crimson Text Bold | 32pt | `text` (`type.postLocation`) |
| Post description | Crimson Text Regular | 32pt | `text` (`type.postDescription`) |
| Post vibe tag | Crimson Text Bold | 24pt | `#4A4459` (`type.postVibeTag`) |
| Expedition user name | Crimson Text Semibold | 48pt | `text` (`type.expeditionUserName`) |
| Expedition user points (inline) | Crimson Text Regular | 45pt | `greenAccent` (`type.expeditionUserPoints`) |
| Expedition duration | Crimson Text Semibold | 40pt | `text` (`type.expeditionDuration`) |
| Expedition points (block) | Crimson Text Regular | 38pt | `green` (`type.expeditionPoints`) |
| Quick facts heading | Crimson Text Bold | 48pt | `redAccent` (`type.quickFacts`) — list cards may use ~28pt for fit |

**Feed list density:** `typeCard` in `typography.ts` uses the same families with smaller sizes so rows stay readable on phones.

---

## Screen mapping

| Area | Implementation |
|------|----------------|
| Tabs + headers | `(tabs)/_layout.tsx` — Faustina nav titles |
| Feed | Feed toggle + cards |
| Search | `search.tsx` — blue-accent field |
| Post chooser | `post.tsx` — `titleHeader` hero (scales to fit) |
| Login | `login.tsx` — Faustina wordmark |
| Expedition detail | `expedition/[id].tsx` — post + expedition type scales |
| Discovery detail | `discovery/[id].tsx` + `FactCard` |
| Leaderboard / Profile | `(tabs)/leaderboard.tsx`, `profile.tsx` |

---

## Install (fonts)

After pulling, run:

```bash
npm install --legacy-peer-deps
```

so `expo-font`, `@expo-google-fonts/faustina`, and `@expo-google-fonts/crimson-text` are installed.
