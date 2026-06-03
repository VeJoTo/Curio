// Local entry wrapper. In a pnpm workspace, pointing `main` straight at
// `expo-router/entry` makes Expo's web HTML reference the bundle via a hoisted
// `/../node_modules/...` path that browsers normalize away (404 → blank page).
// Re-exporting through a project-local file serves the bundle from a fetchable
// path while Metro resolves expo-router internally.
import 'expo-router/entry';
