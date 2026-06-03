# Today Personalization — Design

Date: 2026-06-03
Status: Approved (brainstorming)

## Problem

Onboarding collects a profile (`name`, `avatarKey`, `defaultDepth`, …) and the
daily loop already loads it on the Today screen — but only to gate first-run.
After the gate passes, the profile is discarded, so the loop ignores everything
the user just told us:

- The Today header shows a generic `👤` icon with a **dead** `onPress={() => {}}`
  instead of the avatar the user picked.
- The screen never greets the user by name.
- The hero card's depth toggle always starts on **Quick**, ignoring the user's
  chosen `defaultDepth`.

This slice makes the loop feel personal by using data it already has.

## Scope

In scope (Today screen + hero card only):

1. Greet the user by name in the Today header.
2. Render the user's real avatar in the header (non-interactive for now).
3. Seed the hero card's depth toggle from `profile.defaultDepth`.

Explicitly **out of scope** (deferred):

- A tappable profile/settings screen. The avatar is display-only this slice —
  no `onPress`, no dead handler.
- Persisting the result-screen reflection, completion/"done for today" state,
  streaks. (Separate "make it feel complete" theme.)

## Design

### 1. Today holds the profile

`app/app/index.tsx` currently fetches the profile and keeps only a derived
`gate` state. Change the loader to also store the profile itself:

- Add `const [profile, setProfile] = useState<Profile | null>(null);`
- In the `getProfile().then(...)` handler (still under the `mounted` guard),
  call `setProfile(p)` alongside `setGate(p ? 'ready' : 'onboard')`.
- The `ready` branch only renders when `profile` is non-null (gate guarantees
  it), so reads like `profile.name` are safe.

No change to the loading/onboard branches.

### 2. Two-line personalized header

Replace the current header (`Today` meta label + dead `IconButton`) with:

- **Left:** a `meta` "Today" label, and — only when `profile.name` is set — a
  `title`-variant line `Hi, {name} 👋` beneath it. When `name` is absent
  (it's optional in `ProfileSchema`), the title line is omitted and the header
  matches today's exact look.
- **Right:** `<Avatar avatarKey={profile.avatarKey} size="sm" />`, display-only.

This reuses the existing `meta` + `title` rhythm already used on the quiz and
result screens. The `Avatar` component (`size="sm"` = 36px) already exists and
renders the chosen face; no new component needed.

Greeting copy: `Hi, {name} 👋`. Name is rendered verbatim (already validated to
1–40 chars by the schema at save time).

### 3. Hero card honors `defaultDepth`

`app/components/TopicHeroCard.tsx` hardcodes `useState<Depth>('quick')`. Add an
optional prop:

```ts
interface TopicHeroCardProps {
  topic: Topic;
  onExplore: (depth: Depth) => void;
  initialDepth?: Depth; // defaults to 'quick'
}
```

Seed state with `useState<Depth>(initialDepth ?? 'quick')`. Today passes
`initialDepth={profile.defaultDepth}`. `Depth` (`'quick' | 'deep'`) already
matches `DepthSchema`, so the profile value maps directly. The toggle remains
fully interactive — this only changes the starting position. Existing callers
that omit the prop are unaffected.

## Data flow

```
getProfile() ──▶ Today state { gate, profile }
                   │
                   ├─▶ header: name → greeting, avatarKey → <Avatar>
                   └─▶ <TopicHeroCard initialDepth={profile.defaultDepth} />
                                          │
                                          └─▶ SegmentedToggle starts on chosen depth
```

One read, on mount. No new persistence, no writes. Profile can't change during a
session yet (no editing surface), so a single fetch is sufficient.

## Error / edge handling

- **No name:** title line omitted; header degrades to current behavior.
- **Unknown `avatarKey`:** `Avatar` already falls back to a 🙂 placeholder.
- **`getProfile` returns null in `ready`:** impossible (gate sets `ready` only
  when profile is non-null), but the `ready` JSX is guarded by `profile &&` so a
  null can never throw.
- **Unknown/legacy `defaultDepth`:** `?? 'quick'` fallback covers a missing value;
  schema guarantees a valid one for saved profiles.

## Testing

- `TopicHeroCard`: unit test that `initialDepth="deep"` renders the Deep segment
  active on first paint, and that omitting the prop still starts on Quick.
- Today header greeting logic is trivial branch (name present/absent). If the
  existing app test setup mocks `getProfile`, add a case asserting the greeting
  renders with a name and is absent without one; otherwise cover via the hero
  card test + manual check (web + simulator) rather than over-mocking the route.
- Manual: fresh profile with name + Deep default → Today greets by name, shows
  avatar, hero starts on Deep. Profile without a name → no greeting line.

## Files touched

- `app/app/index.tsx` — store profile, render greeting + avatar, pass `initialDepth`.
- `app/components/TopicHeroCard.tsx` — add `initialDepth` prop.
- Test file for `TopicHeroCard` (new or existing).
