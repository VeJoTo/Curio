# Curio — v1 Design Spec

**Status:** Approved · ready for implementation planning
**Author:** vera@canuto.no
**Date:** 2026-05-20
**Repo:** https://github.com/VeJoTo/Curio

---

## 1. What Curio is

Curio is a daily-curiosity mobile app. Each day a user gets one push notification with a new topic to explore. Tapping the push opens an illustrated story — readable in 2 minutes (Quick) or 10–15 minutes (Deep dive) — followed by a short quiz. Topics are personalized to interest categories chosen during onboarding.

The aesthetic is indie-game-like: chunky claymorph surfaces, geometric storybook illustrations, warm cream + indigo + coral palette. Display typography is Fraunces; body is Manrope.

**One-line product brief:** *Open Curio once a day, learn one surprising thing, feel five minutes smarter.*

---

## 2. v1 scope

### In scope (ship)
1. **Onboarding** — Welcome → Name → Avatar → Age band → Interests → Daily time → Default depth → Notification permission → Done (9 screens, ~90 sec).
2. **Daily core loop** — Today (home) → Story scenes → Quiz → Result/Reflect.
3. **History** — grid of explored topics with replay; filterable by Saved / Favorites / Quick / Deep.
4. **Save-for-later & favorites** — heart icon on Today card saves an unexplored topic; star on Result favorites an explored one.
5. **Profile & Settings** — name, avatar, interests, daily time, default depth, notifications, data export, "delete my data."
6. **Push notifications** — server-side daily push, local fallback for next 7 days.
7. **Content production pipeline** — AI-assisted authoring CLI; AI image generation with style lock; Sanity as content store.

### Explicitly out of scope (deferred)
- **User accounts / auth** — local-only profile in v1; anonymous device-id only on server.
- **Forum** — Phase 2. Triggers the auth requirement when it lands.
- **Tasks / real-world challenges** — Phase 2.
- **Adaptive personalization** — Phase 2. v1 only filters by initial interest categories; topic order within categories is round-robin/recency.
- **Multi-language** — English only in v1.
- **Tablet / web** — phone-only (iOS + Android) in v1.
- **Audio narration / TTS** — not in v1.

---

## 3. System architecture

Five components:

```
┌────────────────────┐  publishes  ┌────────────────┐
│ AI Authoring CLI   │ ───────────▶│ Sanity (CMS)   │
│ (local Node, repo) │             │ Topics + assets│
└────────────────────┘             └───────┬────────┘
                                           │ read
                                           ▼
┌────────────────────┐  fetch /    ┌────────────────┐
│ Curio App (Expo)   │◀───────────▶│ API (Hono on   │
│ iOS + Android      │  register   │ Cloudflare WK) │
└─────────┬──────────┘             └───────┬────────┘
          │                                │
          │ deep-link from push            │ Expo Push
          └────────────────────────────────┘
```

**Data residency:** the server knows only push token + interest categories + preferred local time + tz. Name, avatar, age band, history, favorites all stay on device.

---

## 4. Tech stack

| Concern | Pick | Why |
|---|---|---|
| App framework | Expo SDK 51+ · TypeScript · Expo Router | File-based nav; supports both iOS & Android |
| Client state | Zustand | Tiny, idiomatic |
| Server data | TanStack Query | Caching, retries |
| Animation | Reanimated 3 · Moti | UI-thread perf |
| Illustration rendering | react-native-svg + WebP from CDN | Static AI-gen WebP + SVG overlays for motion |
| Local storage | MMKV (prefs) · expo-sqlite (history, saved, catalog cache) | Right tool per access pattern |
| Notifications | expo-notifications (local + remote) | Standard |
| Validation | zod (shared schemas in `shared/`) | Same schemas server + app |
| API server | Hono on Cloudflare Workers · D1 (SQLite) | Free tier, fast cold start |
| CMS | Sanity (free tier) | Best authoring UI; CDN-hosts assets |
| AI authoring | Anthropic SDK · `claude-opus-4-7` for text · TBD image API (see §10) | Same model family as user's workflow |
| Repo layout | Monorepo: `app/`, `api/`, `authoring/`, `shared/` | One repo named `Curio` |
| CI | GitHub Actions: type-check on PR, EAS preview build on PR to `main` | Per user's GitHub-issues workflow |

---

## 5. Screen map (14 screens)

### Onboarding (one-time)
1.1 Welcome · 1.2 Name · 1.3 Avatar · 1.4 Age band · 1.5 Interests · 1.6 Daily time · 1.7 Default depth · 1.8 Notification permission · 1.9 You're set.

### Daily loop (push deep-link entry = 2.1)
2.1 Today (home) · 2.2 Story scenes · 2.3 Quiz · 2.4 Result / Reflect.

### Around the loop
3.1 History · 3.2 Past topic · 3.3 Profile · 3.4 Settings.

**Navigation pattern:** no bottom tabs. Today (2.1) is the singular home; header icons reach History (📚) and Profile (👤). Keeps the indie-storybook feel.

---

## 6. Design system: **Geometric Clay**

### Palette
| Role | Hex | Use |
|---|---|---|
| `cream` | `#FBF6EA` | Dominant surface (~70%) |
| `peach` | `#FFE9D6` | Soft secondary surface |
| `rose` | `#F6A6B2` | Illustration / category |
| `teal` | `#A8DBC6` | Illustration / category / "correct" |
| `mustard` | `#F2C14E` | Illustration / category |
| `indigo` | `#6E4FE8` | Structural accent, primary button |
| `coral` | `#F26B5E` | **Sole CTA accent — one per screen** |
| `ink` | `#2C1B3C` | Foreground text & borders |
| `ink soft` | `#5B4A6D` | Secondary text |
| `surface` | `#FFFCF5` | Card surface |

### Typography
- **Display:** Fraunces (variable serif, `opsz` 9–144). Hero headlines use opsz 96–144.
- **Body:** Manrope (geometric sans).
- **Meta:** JetBrains Mono (uppercase, letter-spaced — for labels, dates, tabular numbers).
- **No Inter / Roboto / system sans / Comic Neue.**

### Surfaces
1.5px ink border. Radii: 10 / 18 / 28 / pill. Double shadow (outer drop + inner highlight) for soft 3D. Press = 2px Y nudge + softened shadow + iOS light haptic.

### Spacing
4 / 8 rhythm. Section spacing: 16 / 24 / 40 / 64.

### Motion
- 150–250ms spring transitions (Reanimated `withSpring`, damping ~14).
- Page transitions: scene crossfade + 6px upward translate; exit ~70% of enter duration.
- Stagger 40ms for grids (e.g. interest picker, history grid).
- `prefers-reduced-motion` → springs become 120ms linear; no parallax; no decorative breathing.

### Accessibility (non-negotiables)
- Body text ≥16px, line-height 1.5; Dynamic Type respected.
- Body / ink contrast 11.4:1 (AAA); coral / cream 4.7:1 (AA).
- All touch targets ≥44pt; pills use `hitSlop` if visually smaller.
- Coral never the sole indicator — always paired with icon or label.
- VoiceOver labels on illustrations; reading order = visual order.

---

## 7. Data model

### Sanity (content)
```ts
Topic {
  _id, slug, title, deck,
  category: ref(Category),
  ageBand: 'all' | '13+' | '16+',
  status: 'draft' | 'ready' | 'published',
  publishedAt: datetime,

  hero: image,                              // 4:3 AI-gen WebP
  scenesQuick: Scene[],                     // 4–6 scenes
  scenesDeep: Scene[],                      // 10–14 scenes
  quizQuick: Question[3],
  quizDeep: Question[5..7],
  sources: string[],
  authoringPrompts: { stylePrompt, scenePrompts[] }
}

Scene { id, image: ref, caption, accentColor?, motion?: 'drift'|'parallax'|'fade' }
Question { prompt, choices: [{text, isCorrect}], explanation }
Category { slug, name, color: token }
```

### Cloudflare D1 (server)
```sql
devices (
  id TEXT PRIMARY KEY,                  -- uuid generated on device
  push_token TEXT UNIQUE NOT NULL,
  prefs_json TEXT NOT NULL,             -- {categories[], localTime, tz, defaultDepth}
  created_at, last_seen_at
)
schedules (
  id, device_id, scheduled_for_utc, topic_slug,
  status: 'pending' | 'sent' | 'opened',
  INDEX (scheduled_for_utc, status)
)
delivery_log (device_id, topic_slug, channel: 'push' | 'local', delivered_at)
```
**No PII.** Device id ↔ push token only.

### Device (Expo)
- **MMKV** — `profile`: name?, avatarKey, ageBand, interests[], dailyTime, defaultDepth, deviceId, notifPermission.
- **expo-sqlite**:
  - `history` — topic_slug PK, explored_depth, quiz_score, quiz_total, reflection_text?, explored_at, **is_favorited**, **favorited_at?**, topic_snapshot_json.
  - `saved_topics` — topic_slug PK, saved_at, topic_snapshot_json.
  - `catalog_cache` — topic_slug, etag, json_blob, fetched_at (30-day rolling cache).

---

## 8. Authoring pipeline

Node CLI in `authoring/`. Per-topic loop:

1. **Seed expand** — `npm run author -- "<seed>"` calls Anthropic SDK; produces draft (title, deck, category, ageBand, both scene sets, both quiz sets, sources). Saved to `authoring/drafts/<slug>.json`. Opens in `$EDITOR`.
2. **Illustrate** — for each scene, calls image API with `stylePrompt + scenePrompt + style reference image`. Terminal preview · `[a]ccept / [r]eroll / [e]dit / [s]kip`. Saved to `authoring/assets/<slug>/<scene-id>.webp` at @1.5x and @3x.
3. **Quality check** — auto: contrast probe on hero, zod schema validation, source URL reachability. Manual: full text + asset preview.
4. **Publish** — pushes to Sanity (assets → CDN, doc → dataset, `status: 'ready'`). User flips to `'published'` in Sanity Studio when ready.
5. **Batch mode** — `npm run author -- --batch topics.txt` runs all seeds first, then illustrate stage with "next" between topics.
6. **Sanity-side assist** — custom input component in Sanity Studio with a "re-draft scene" button calling the same internal endpoint.

Repo:
```
authoring/
├── package.json
├── src/{seed,illustrate,check,publish}.ts
└── src/prompts/{style-lock.md, style-reference.webp, seed-template.md}
└── drafts/, assets/   # gitignored
```

---

## 9. Notification flow

### First-launch registration (during onboarding 1.8)
1. App generates `deviceId` (uuid) → MMKV.
2. Notification permission shown only *after* the value-prop screen (Apple HIG).
3. On grant: app fetches Expo push token → `POST /devices` with `{deviceId, pushToken, prefs}`.
4. App schedules **next 7 days of local notifications** as a fallback.

### Daily server push (primary)
1. `00:00 UTC` cron Worker: for each active device, compute next push instant in their `tz`.
2. Pick one unsent topic matching `categories`, write `schedules` row.
3. Every-5-min Worker: send pending schedules via Expo Push, mark `sent`.
4. Payload: `{ title, body: deck, data: { slug, deepLink: "curio://topic/<slug>" } }`.

### Tap → deep link
1. `curio://topic/<slug>` → Expo Router `/topic/[slug]`.
2. App fires `POST /devices/{id}/opened` (best-effort).
3. If already on Today, animate in instead of cold-navigate.

### Local fallback
- If server push fails or device offline, pre-scheduled local notification fires at the same `localTime`. Payload knows only the title — tap → Today screen → fetches.
- Every launch reschedules next 7 days from cached catalog.

### Resilience
- Expo "DeviceNotRegistered" → server marks token stale until re-register on next launch.
- `tz` change detected → `PATCH /devices/{id}`.
- 30-day catalog cache → app works fully offline.

### Privacy
- Server stores push token + categories + localTime + tz only.
- Settings → "Delete my data" → `DELETE /devices/{id}` + local DB wipe.

---

## 10. Open decisions to make during planning

These didn't need to be locked in brainstorming, but planning has to pick:

1. **Image generation provider** — Imagen 4 via Vertex AI, GPT Image, Replicate-hosted SDXL fine-tune, or Midjourney API. Evaluate on style-lock consistency + cost-per-image + commercial-use terms.
2. **Avatar set production** — same AI pipeline as topics, or pre-baked illustrator set for the 8–12 avatars (small fixed quantity favors illustrator).
3. **Sanity Studio hosting** — Sanity-hosted Studio vs. self-hosted on Cloudflare Pages.
4. **EAS vs self-hosted Expo build** — EAS free tier likely sufficient; revisit if iteration speed hurts.
5. **Initial topic library size before public launch** — recommend ≥30 topics so 4 weeks of daily use never repeats.
6. **Cron strategy** — single 00:00 UTC pass vs. hourly with cursor (matters at >10k devices, not before).

---

## 11. Phase-2 features (not designed yet)

- **Forum** — triggers full auth (Sanity-Auth or Supabase), posts collection, moderation, profile pages.
- **Tasks / real-world challenges** — small actions per topic, photo proof, streak chain.
- **Adaptive personalization** — quiz performance + dwell time feed a recommender for topic ordering and depth bias.
- **Streaks & gentle gamification** — explored-streak count, restoration grace, milestones.
- **Audio narration / TTS** — premium polish; optional autoplay for Quick mode.

---

## 12. Success criteria for v1

- A first-time user completes onboarding in ≤90 seconds median.
- 7-day notification opt-in retention ≥40% (industry benchmark for habit apps).
- Median time from notification tap → quiz finished ≤3 minutes (Quick) / ≤14 minutes (Deep).
- Zero PII on server.
- App launches and renders Today within 2 seconds on a mid-tier 2022 Android.
- All accessibility non-negotiables (§6) pass an automated axe scan + manual VoiceOver walkthrough.
