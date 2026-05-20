# Curio Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working pnpm monorepo skeleton with four workspaces (`app/`, `api/`, `authoring/`, `shared/`), shared zod schemas, linting, type-checking, tests, and green CI on first PR.

**Architecture:** Single git repo, pnpm workspaces. `shared/` exports zod schemas that all other workspaces consume. Each leaf workspace has a tiny "smoke" implementation (Expo boots, Hono returns 200, CLI prints help) so the toolchain is proven end-to-end before any real features are built.

**Tech Stack:** pnpm 9 · Node 20 LTS · TypeScript 5.5 · zod 3 · Biome 1.9 (lint + format) · Vitest 2 (tests for `shared` & `api`) · Hono 4 + wrangler 3 (for `api`) · Expo SDK 51 + Expo Router 3 (for `app`) · GitHub Actions (CI).

**Spec reference:** `docs/superpowers/specs/2026-05-20-curio-design.md`, sections §4 (Tech stack), §7 (Data model — schemas come from here).

**Branch strategy:** Per user's GitHub-issues workflow, all of Plan 1 happens on one feature branch `feat/foundation` opened from `main`. Each task commits separately; PR is opened after Task 8.

---

## File Structure

```
Curio/
├── .editorconfig
├── .gitignore
├── .nvmrc
├── biome.json
├── package.json                     # root, sets up workspaces + scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json               # shared compiler options
├── README.md
├── .github/workflows/ci.yml
├── shared/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                 # re-exports
│   │   ├── schemas/topic.ts         # Topic + Scene + Question + Category
│   │   ├── schemas/profile.ts       # device-side profile
│   │   └── schemas/device.ts        # server-side device row
│   └── test/schemas.test.ts
├── api/
│   ├── package.json
│   ├── tsconfig.json
│   ├── wrangler.toml
│   ├── src/index.ts                 # Hono app, GET /health
│   └── test/health.test.ts
├── app/
│   ├── package.json
│   ├── tsconfig.json
│   ├── app.json                     # Expo config
│   ├── app/_layout.tsx              # Expo Router root
│   └── app/index.tsx                # splash route
└── authoring/
    ├── package.json
    ├── tsconfig.json
    └── src/cli.ts                   # commander-based CLI
```

**Boundary discipline**
- `shared/` is the only workspace whose code other workspaces import. It depends on nothing but `zod`.
- `api/`, `app/`, `authoring/` never import from each other — only from `shared/`.
- All zod schemas live in `shared/` so server and client validate the same shapes.

---

## Pre-task: install pnpm if missing

```bash
which pnpm || npm install -g pnpm@9
pnpm --version    # should be 9.x
node --version    # should be 20.x — install via nvm if not
```

---

### Task 1: Repo skeleton & branch

**Files:**
- Create: `.gitignore`, `.editorconfig`, `.nvmrc`, `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`, `README.md`

- [ ] **Step 1: Cut feature branch**

```bash
cd /Users/vera/Documents/Curio
git checkout -b feat/foundation
```

- [ ] **Step 2: Write `.nvmrc`**

```
20
```

- [ ] **Step 3: Write `.editorconfig`**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 4: Replace `.gitignore`**

The existing `.gitignore` only has `.superpowers/`. Replace with:

```gitignore
# OS / editor
.DS_Store
.idea/
.vscode/
*.swp

# Node
node_modules/
*.log
.pnpm-store/
.pnpm-debug.log*

# Build artefacts
dist/
build/
.tsbuildinfo
*.tsbuildinfo
.expo/
.expo-shared/
.wrangler/

# Env
.env
.env.local
.env.*.local
!.env.example

# Authoring work-in-progress (per spec §8)
authoring/drafts/
authoring/assets/

# Brainstorming mockups (kept local)
.superpowers/
```

- [ ] **Step 5: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - shared
  - api
  - app
  - authoring
```

- [ ] **Step 6: Write root `package.json`**

```json
{
  "name": "curio",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@9.12.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "typecheck": "pnpm -r typecheck",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "test": "pnpm -r --if-present test"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "typescript": "5.5.4"
  }
}
```

- [ ] **Step 7: Write `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 8: Write `README.md`**

```markdown
# Curio

A daily-curiosity mobile app. One illustrated topic a day, with quick or deep-dive flows and a small quiz.

## Repo layout

```
shared/      zod schemas (single source of truth)
api/         Cloudflare Workers + Hono (push, devices, schedules)
app/         Expo + Expo Router (iOS + Android)
authoring/   Node CLI for AI-assisted topic authoring
```

## Setup

```bash
nvm use            # Node 20
pnpm install
pnpm typecheck
pnpm lint
pnpm test
```

## Design docs

- Spec: `docs/superpowers/specs/2026-05-20-curio-design.md`
- Plans: `docs/superpowers/plans/`
```

- [ ] **Step 9: Install root dev deps**

```bash
pnpm install
```

Expected: `node_modules/` appears at root, no errors.

- [ ] **Step 10: Commit**

```bash
git add .nvmrc .editorconfig .gitignore pnpm-workspace.yaml package.json tsconfig.base.json README.md pnpm-lock.yaml
git commit -m "chore: repo skeleton & pnpm workspaces"
```

---

### Task 2: `shared/` workspace + Topic schema (TDD)

**Files:**
- Create: `shared/package.json`, `shared/tsconfig.json`, `shared/src/index.ts`, `shared/src/schemas/topic.ts`, `shared/test/schemas.test.ts`

- [ ] **Step 1: Write `shared/package.json`**

```json
{
  "name": "@curio/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./schemas/*": "./src/schemas/*.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "3.23.8"
  },
  "devDependencies": {
    "@types/node": "20.16.5",
    "typescript": "5.5.4",
    "vitest": "2.1.1"
  }
}
```

- [ ] **Step 2: Write `shared/tsconfig.json`**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "types": ["node"]
  },
  "include": ["src/**/*", "test/**/*"]
}
```

- [ ] **Step 3: Install deps**

```bash
pnpm install
```

- [ ] **Step 4: Write the failing test for Topic schema**

`shared/test/schemas.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { TopicSchema, type Topic } from '../src/schemas/topic.js';

describe('TopicSchema', () => {
  const validTopic: Topic = {
    slug: 'the-northern-lights',
    title: 'The Northern Lights',
    deck: 'A solar wind, a magnetic field, and a 100-kilometer-tall curtain of green light.',
    categorySlug: 'earth-and-sky',
    ageBand: 'all',
    status: 'published',
    publishedAt: '2026-05-20T08:00:00.000Z',
    heroImageUrl: 'https://cdn.sanity.io/.../hero.webp',
    scenesQuick: [
      { id: 'q1', imageUrl: 'https://cdn.sanity.io/.../q1.webp', caption: 'It starts at the sun.', motion: 'fade' }
    ],
    scenesDeep: [
      { id: 'd1', imageUrl: 'https://cdn.sanity.io/.../d1.webp', caption: 'It starts at the sun.', motion: 'fade' }
    ],
    quizQuick: [
      { prompt: 'What causes the lights?', choices: [
        { text: 'Solar wind hitting the atmosphere', isCorrect: true },
        { text: 'Reflected moonlight', isCorrect: false }
      ], explanation: 'Charged solar particles excite atmospheric gases.' }
    ],
    quizDeep: [
      { prompt: 'What causes the lights?', choices: [
        { text: 'Solar wind hitting the atmosphere', isCorrect: true },
        { text: 'Reflected moonlight', isCorrect: false }
      ], explanation: 'Charged solar particles excite atmospheric gases.' }
    ],
    sources: ['https://nasa.gov/.../aurora']
  };

  it('parses a valid topic', () => {
    const result = TopicSchema.safeParse(validTopic);
    expect(result.success).toBe(true);
  });

  it('rejects a topic with an empty title', () => {
    const result = TopicSchema.safeParse({ ...validTopic, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects scenesQuick with fewer than 4 scenes', () => {
    const result = TopicSchema.safeParse({ ...validTopic, scenesQuick: [] });
    expect(result.success).toBe(false);
  });

  it('rejects quizQuick with non-3 question count', () => {
    const result = TopicSchema.safeParse({ ...validTopic, quizQuick: [] });
    expect(result.success).toBe(false);
  });

  it('requires at least one correct choice', () => {
    const bad = {
      ...validTopic,
      quizQuick: [{
        prompt: 'X?',
        choices: [{ text: 'a', isCorrect: false }, { text: 'b', isCorrect: false }],
        explanation: 'x'
      }]
    };
    const result = TopicSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 5: Run the test (should fail — file does not exist yet)**

```bash
pnpm --filter @curio/shared test
```

Expected: FAIL — `Cannot find module '../src/schemas/topic.js'`.

- [ ] **Step 6: Write `shared/src/schemas/topic.ts`**

```typescript
import { z } from 'zod';

const AgeBand = z.enum(['all', '13+', '16+']);
const Status = z.enum(['draft', 'ready', 'published']);
const Motion = z.enum(['drift', 'parallax', 'fade']);

export const SceneSchema = z.object({
  id: z.string().min(1),
  imageUrl: z.string().url(),
  caption: z.string().min(1).max(280),
  accentColor: z.string().optional(),
  motion: Motion.optional(),
});
export type Scene = z.infer<typeof SceneSchema>;

export const ChoiceSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

export const QuestionSchema = z.object({
  prompt: z.string().min(1),
  choices: z.array(ChoiceSchema)
    .min(2)
    .max(4)
    .refine((cs) => cs.some((c) => c.isCorrect), {
      message: 'At least one choice must be marked correct',
    }),
  explanation: z.string().min(1),
});
export type Question = z.infer<typeof QuestionSchema>;

export const TopicSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(120),
  deck: z.string().min(1).max(280),
  categorySlug: z.string().min(1),
  ageBand: AgeBand,
  status: Status,
  publishedAt: z.string().datetime().nullable().optional(),

  heroImageUrl: z.string().url(),
  scenesQuick: z.array(SceneSchema).min(4).max(6),
  scenesDeep: z.array(SceneSchema).min(10).max(14),
  quizQuick: z.array(QuestionSchema).length(3),
  quizDeep: z.array(QuestionSchema).min(5).max(7),
  sources: z.array(z.string().url()),
});
export type Topic = z.infer<typeof TopicSchema>;
```

- [ ] **Step 7: Write `shared/src/index.ts`**

```typescript
export * from './schemas/topic.js';
```

- [ ] **Step 8: Run the tests — should pass**

```bash
pnpm --filter @curio/shared test
```

Expected: PASS — all 5 tests green.

- [ ] **Step 9: Typecheck**

```bash
pnpm --filter @curio/shared typecheck
```

Expected: no output, exit code 0.

- [ ] **Step 10: Commit**

```bash
git add shared/ pnpm-lock.yaml
git commit -m "feat(shared): Topic + Scene + Question schemas"
```

---

### Task 3: Remaining shared schemas (Category, Profile, Device)

**Files:**
- Create: `shared/src/schemas/category.ts`, `shared/src/schemas/profile.ts`, `shared/src/schemas/device.ts`
- Modify: `shared/src/index.ts`, `shared/test/schemas.test.ts`

- [ ] **Step 1: Extend failing test**

Append to `shared/test/schemas.test.ts`:

```typescript
import { CategorySchema } from '../src/schemas/category.js';
import { ProfileSchema, type Profile } from '../src/schemas/profile.js';
import { DeviceSchema, type Device } from '../src/schemas/device.js';

describe('CategorySchema', () => {
  it('parses a valid category', () => {
    const result = CategorySchema.safeParse({
      slug: 'earth-and-sky',
      name: 'Earth & Sky',
      colorToken: 'teal',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown colorToken', () => {
    const result = CategorySchema.safeParse({ slug: 'x', name: 'X', colorToken: 'magenta' });
    expect(result.success).toBe(false);
  });
});

describe('ProfileSchema', () => {
  const validProfile: Profile = {
    deviceId: 'd1a2b3c4-1111-2222-3333-444455556666',
    name: 'Vera',
    avatarKey: 'avatar-04',
    ageBand: 'all',
    interests: ['earth-and-sky', 'biology'],
    dailyTime: '08:00',
    defaultDepth: 'quick',
    notifPermission: 'granted',
  };

  it('parses a valid profile', () => {
    expect(ProfileSchema.safeParse(validProfile).success).toBe(true);
  });

  it('rejects dailyTime in 12h format', () => {
    expect(ProfileSchema.safeParse({ ...validProfile, dailyTime: '8:00 AM' }).success).toBe(false);
  });

  it('rejects empty interests', () => {
    expect(ProfileSchema.safeParse({ ...validProfile, interests: [] }).success).toBe(false);
  });

  it('allows missing name (skip on onboarding 1.2)', () => {
    const { name: _, ...withoutName } = validProfile;
    expect(ProfileSchema.safeParse(withoutName).success).toBe(true);
  });
});

describe('DeviceSchema', () => {
  const validDevice: Device = {
    id: 'd1a2b3c4-1111-2222-3333-444455556666',
    pushToken: 'ExponentPushToken[xxxxxxxx]',
    prefs: {
      categories: ['earth-and-sky'],
      localTime: '08:00',
      tz: 'Europe/Oslo',
      defaultDepth: 'quick',
    },
  };

  it('parses a valid device row', () => {
    expect(DeviceSchema.safeParse(validDevice).success).toBe(true);
  });

  it('rejects malformed push token', () => {
    expect(DeviceSchema.safeParse({ ...validDevice, pushToken: 'fcm-xyz' }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — confirm failure**

```bash
pnpm --filter @curio/shared test
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Write `shared/src/schemas/category.ts`**

```typescript
import { z } from 'zod';

// Tokens from spec §6 — keep in sync with app theme
export const ColorToken = z.enum(['rose', 'teal', 'mustard', 'indigo', 'coral']);

export const CategorySchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  colorToken: ColorToken,
});
export type Category = z.infer<typeof CategorySchema>;
```

- [ ] **Step 4: Write `shared/src/schemas/profile.ts`**

```typescript
import { z } from 'zod';

const AgeBand = z.enum(['under-13', '13-17', '18-24', '25-34', '35-44', '45-54', '55+']);
const Depth = z.enum(['quick', 'deep']);
const NotifPermission = z.enum(['granted', 'denied', 'undetermined']);

const HHmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be 24h HH:mm');

export const ProfileSchema = z.object({
  deviceId: z.string().uuid(),
  name: z.string().min(1).max(40).optional(),
  avatarKey: z.string().min(1),
  ageBand: AgeBand,
  interests: z.array(z.string().min(1)).min(1).max(12),
  dailyTime: HHmm,
  defaultDepth: Depth,
  notifPermission: NotifPermission,
});
export type Profile = z.infer<typeof ProfileSchema>;
```

- [ ] **Step 5: Write `shared/src/schemas/device.ts`**

```typescript
import { z } from 'zod';

const HHmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const Depth = z.enum(['quick', 'deep']);
const ExpoPushToken = z.string().regex(/^Expo(nent)?PushToken\[[^\]]+\]$/);

export const DevicePrefsSchema = z.object({
  categories: z.array(z.string().min(1)).min(1),
  localTime: HHmm,
  tz: z.string().min(1),
  defaultDepth: Depth,
});

export const DeviceSchema = z.object({
  id: z.string().uuid(),
  pushToken: ExpoPushToken,
  prefs: DevicePrefsSchema,
  createdAt: z.string().datetime().optional(),
  lastSeenAt: z.string().datetime().optional(),
});
export type Device = z.infer<typeof DeviceSchema>;
```

- [ ] **Step 6: Update `shared/src/index.ts`**

```typescript
export * from './schemas/topic.js';
export * from './schemas/category.js';
export * from './schemas/profile.js';
export * from './schemas/device.js';
```

- [ ] **Step 7: Run tests — should pass**

```bash
pnpm --filter @curio/shared test
```

Expected: PASS — all tests green (5 from Task 2 + 9 new).

- [ ] **Step 8: Typecheck**

```bash
pnpm --filter @curio/shared typecheck
```

Expected: no output.

- [ ] **Step 9: Commit**

```bash
git add shared/
git commit -m "feat(shared): Category, Profile, Device schemas"
```

---

### Task 4: `api/` workspace with `GET /health` (TDD)

**Files:**
- Create: `api/package.json`, `api/tsconfig.json`, `api/wrangler.toml`, `api/src/index.ts`, `api/test/health.test.ts`

- [ ] **Step 1: Write `api/package.json`**

```json
{
  "name": "@curio/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@curio/shared": "workspace:*",
    "hono": "4.6.3",
    "zod": "3.23.8"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "4.20240925.0",
    "typescript": "5.5.4",
    "vitest": "2.1.1",
    "wrangler": "3.78.0"
  }
}
```

- [ ] **Step 2: Write `api/tsconfig.json`**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*", "test/**/*"]
}
```

- [ ] **Step 3: Write `api/wrangler.toml`**

```toml
name = "curio-api"
main = "src/index.ts"
compatibility_date = "2024-10-01"
compatibility_flags = ["nodejs_compat"]

# D1 and KV bindings will be added in the API plan (Plan 4).
```

- [ ] **Step 4: Install deps**

```bash
pnpm install
```

- [ ] **Step 5: Write the failing test**

`api/test/health.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import app from '../src/index.js';

describe('GET /health', () => {
  it('returns 200 with ok payload', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ status: 'ok', service: 'curio-api' });
  });

  it('unknown routes return 404', async () => {
    const res = await app.request('/nope');
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 6: Run test — confirm fail**

```bash
pnpm --filter @curio/api test
```

Expected: FAIL — `Cannot find module '../src/index.js'`.

- [ ] **Step 7: Write `api/src/index.ts`**

```typescript
import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', service: 'curio-api' }));

export default app;
```

- [ ] **Step 8: Run tests — should pass**

```bash
pnpm --filter @curio/api test
```

Expected: PASS — 2 tests green.

- [ ] **Step 9: Typecheck**

```bash
pnpm --filter @curio/api typecheck
```

Expected: no output.

- [ ] **Step 10: Smoke-run with wrangler**

```bash
pnpm --filter @curio/api dev
```

In another terminal:
```bash
curl -s http://localhost:8787/health
```

Expected: `{"status":"ok","service":"curio-api"}`. Stop wrangler with Ctrl-C.

- [ ] **Step 11: Commit**

```bash
git add api/ pnpm-lock.yaml
git commit -m "feat(api): hono worker skeleton with /health endpoint"
```

---

### Task 5: `app/` workspace — bootable Expo app

**Files:**
- Create: `app/package.json`, `app/tsconfig.json`, `app/app.json`, `app/metro.config.js`, `app/app/_layout.tsx`, `app/app/index.tsx`

> Note: this task uses verification-by-running rather than unit tests. Boot is the smoke test.

- [ ] **Step 1: Write `app/package.json`**

```json
{
  "name": "@curio/app",
  "version": "0.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@curio/shared": "workspace:*",
    "expo": "~51.0.31",
    "expo-router": "~3.5.23",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1"
  },
  "devDependencies": {
    "@types/react": "~18.2.79",
    "typescript": "5.5.4"
  }
}
```

- [ ] **Step 2: Write `app/tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@curio/shared": ["../shared/src/index.ts"],
      "@curio/shared/*": ["../shared/src/*"]
    }
  },
  "include": ["app/**/*", "index.ts"]
}
```

- [ ] **Step 3: Write `app/app.json`**

```json
{
  "expo": {
    "name": "Curio",
    "slug": "curio",
    "scheme": "curio",
    "version": "0.1.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "ios": { "supportsTablet": false, "bundleIdentifier": "no.canuto.curio" },
    "android": { "package": "no.canuto.curio" },
    "plugins": ["expo-router"],
    "experiments": { "typedRoutes": true }
  }
}
```

- [ ] **Step 4: Write `app/metro.config.js`**

Metro doesn't read tsconfig `paths` — it needs explicit watchFolders to resolve the pnpm workspace.

```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

- [ ] **Step 5: Write `app/app/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 6: Write `app/app/index.tsx`**

```tsx
import { Text, View } from 'react-native';
import { TopicSchema } from '@curio/shared';

export default function Index() {
  // Smoke check: shared schemas import correctly from the app workspace.
  const verify = typeof TopicSchema.parse === 'function' ? 'ok' : 'broken';

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBF6EA' }}>
      <Text style={{ fontSize: 32, color: '#2C1B3C', fontWeight: '700' }}>Curio</Text>
      <Text style={{ marginTop: 8, color: '#5B4A6D' }}>shared schemas: {verify}</Text>
    </View>
  );
}
```

- [ ] **Step 7: Install deps**

```bash
pnpm install
```

- [ ] **Step 8: Typecheck**

```bash
pnpm --filter @curio/app typecheck
```

Expected: no output.

- [ ] **Step 9: Smoke-run Expo (verification, not unit test)**

```bash
pnpm --filter @curio/app start
```

Press `w` for web preview (fastest verification). Confirm in browser:
- "Curio" headline renders
- subtitle reads `shared schemas: ok`

Stop with Ctrl-C.

- [ ] **Step 10: Commit**

```bash
git add app/ pnpm-lock.yaml
git commit -m "feat(app): expo router skeleton with shared schema smoke check"
```

---

### Task 6: `authoring/` CLI skeleton (TDD)

**Files:**
- Create: `authoring/package.json`, `authoring/tsconfig.json`, `authoring/src/cli.ts`, `authoring/test/cli.test.ts`

- [ ] **Step 1: Write `authoring/package.json`**

```json
{
  "name": "@curio/authoring",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "bin": {
    "curio-author": "./dist/cli.js"
  },
  "scripts": {
    "author": "tsx src/cli.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@curio/shared": "workspace:*",
    "commander": "12.1.0",
    "zod": "3.23.8"
  },
  "devDependencies": {
    "@types/node": "20.16.5",
    "tsx": "4.19.1",
    "typescript": "5.5.4",
    "vitest": "2.1.1"
  }
}
```

- [ ] **Step 2: Write `authoring/tsconfig.json`**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "Node16",
    "moduleResolution": "Node16",
    "types": ["node"]
  },
  "include": ["src/**/*", "test/**/*"]
}
```

- [ ] **Step 3: Install deps**

```bash
pnpm install
```

- [ ] **Step 4: Write the failing test**

`authoring/test/cli.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildProgram } from '../src/cli.js';

describe('curio-author CLI', () => {
  it('prints help text including "seed"', () => {
    const program = buildProgram();
    const help = program.helpInformation();
    expect(help).toContain('curio-author');
    expect(help).toContain('seed');
  });

  it('declares program version', () => {
    const program = buildProgram();
    expect(program.version()).toBe('0.0.0');
  });

  it('seed command requires a topic argument', () => {
    const program = buildProgram();
    const seed = program.commands.find((c) => c.name() === 'seed');
    expect(seed).toBeDefined();
    expect(seed!.usage()).toContain('<topic>');
  });
});
```

- [ ] **Step 5: Run test — confirm fail**

```bash
pnpm --filter @curio/authoring test
```

Expected: FAIL — `Cannot find module '../src/cli.js'`.

- [ ] **Step 6: Write `authoring/src/cli.ts`**

```typescript
import { Command } from 'commander';

export function buildProgram(): Command {
  const program = new Command();

  program
    .name('curio-author')
    .description('Curio AI-assisted topic authoring CLI')
    .version('0.0.0');

  program
    .command('seed')
    .description('expand a seed phrase into a draft topic')
    .argument('<topic>', 'the topic seed phrase')
    .action((_topic: string) => {
      // Implementation lands in the Authoring plan (Plan 3).
      throw new Error('Not implemented in foundation plan');
    });

  return program;
}

// Entry point — guarded so tests can import without running argv parsing.
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  buildProgram().parse(process.argv);
}
```

- [ ] **Step 7: Run test — should pass**

```bash
pnpm --filter @curio/authoring test
```

Expected: PASS — 3 tests green.

- [ ] **Step 8: Smoke-run CLI**

```bash
pnpm --filter @curio/authoring author -- --help
```

Expected: help text printed, listing the `seed` command.

- [ ] **Step 9: Typecheck**

```bash
pnpm --filter @curio/authoring typecheck
```

Expected: no output.

- [ ] **Step 10: Commit**

```bash
git add authoring/ pnpm-lock.yaml
git commit -m "feat(authoring): cli skeleton with seed command stub"
```

---

### Task 7: Biome config + root scripts

**Files:**
- Create: `biome.json`

- [ ] **Step 1: Write `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "ignore": [
      "**/node_modules",
      "**/dist",
      "**/.expo",
      "**/.wrangler",
      "**/coverage",
      "pnpm-lock.yaml"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "semicolons": "always", "trailingCommas": "all" }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "useImportType": "error",
        "noNonNullAssertion": "off"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  }
}
```

- [ ] **Step 2: Run formatter once (will rewrite files in-place)**

```bash
pnpm lint:fix
```

Expected: a handful of formatting changes across the four workspaces.

- [ ] **Step 3: Verify lint passes**

```bash
pnpm lint
```

Expected: `Checked … files. No fixes needed.` (or similar 0-issues output).

- [ ] **Step 4: Verify typecheck still passes across the monorepo**

```bash
pnpm typecheck
```

Expected: each workspace prints no errors.

- [ ] **Step 5: Verify tests still pass across the monorepo**

```bash
pnpm test
```

Expected: shared + api + authoring all pass; app reports no tests (because it has none yet) — that's fine.

- [ ] **Step 6: Commit**

```bash
git add biome.json $(git diff --name-only)
git commit -m "chore: biome lint + format config"
```

---

### Task 8: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: ci

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Test
        run: pnpm test
```

- [ ] **Step 2: Sanity-run the same commands locally**

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
```

All four should exit 0. If any fail, fix before opening the PR.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "chore(ci): typecheck + lint + test on PR and main"
```

- [ ] **Step 4: Push branch**

```bash
git push -u origin feat/foundation
```

- [ ] **Step 5: Open PR via gh CLI**

```bash
gh pr create \
  --title "Foundation: pnpm workspaces + shared schemas + smoke services" \
  --body "$(cat <<'EOF'
## Summary
- pnpm monorepo with `shared/`, `api/`, `app/`, `authoring/` workspaces
- Zod schemas for Topic, Scene, Question, Category, Profile, Device (from spec §7)
- Hono Worker with `/health`
- Bootable Expo Router app with shared-schema smoke check
- Commander CLI skeleton (seed command stub)
- Biome lint+format; GitHub Actions CI

## Test plan
- [ ] CI green on PR (lint + typecheck + tests across all workspaces)
- [ ] `pnpm --filter @curio/api dev` + `curl localhost:8787/health` returns `{"status":"ok","service":"curio-api"}`
- [ ] `pnpm --filter @curio/app start` boots Expo; web preview shows "Curio" + "shared schemas: ok"
- [ ] `pnpm --filter @curio/authoring author -- --help` prints help

## Spec reference
docs/superpowers/specs/2026-05-20-curio-design.md (§4 Tech stack, §7 Data model)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: Watch CI**

```bash
gh pr checks --watch
```

Expected: `verify` job passes. If it fails, fix on the branch and push again.

- [ ] **Step 7: Merge after CI green and review**

Don't merge automatically — hand back to user for review and merge. Stop here.

---

## Self-review checklist (run before handing off)

After all tasks land, verify against the spec:

| Spec section | Plan task |
|---|---|
| §4 Tech stack: pnpm + TS + Expo + Hono + Workers | Tasks 1, 4, 5 |
| §4 Tech stack: zod (shared) | Tasks 2, 3 |
| §4 Tech stack: Biome + GH Actions | Tasks 7, 8 |
| §7 Topic + Scene + Question + Category schemas | Tasks 2, 3 |
| §7 Profile (device side) | Task 3 |
| §7 Device (server side, push token + prefs) | Task 3 |
| §4 Repo layout: `app/ api/ authoring/ shared/` | Task 1 |
| §4 CI: typecheck on PR | Task 8 |

Out of scope of this plan (handled in later plans):
- Actual API endpoints `/devices`, `/topics` → Plan 4
- D1 schema → Plan 4
- Push delivery + cron → Plan 4
- Sanity client wiring → Plans 2 & 4
- Expo screens, design tokens, navigation → Plan 5
- AI authoring implementation (seed/illustrate/check/publish bodies) → Plan 3
- EAS build setup → Plan 5

## Done when
- PR `feat/foundation` is open, CI is green, and a human has reviewed and merged.
