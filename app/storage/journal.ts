import type { DayEntry } from '@curio/shared';
import { DayEntrySchema } from '@curio/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';

const JOURNAL_KEY = 'curio.journal';

type Journal = Record<string, DayEntry>;

export async function getJournal(): Promise<Journal> {
  // Never rejects: a read error, malformed JSON, or a bad shape resolves to {}.
  // Individual entries that fail validation are dropped; valid siblings kept.
  try {
    const raw = await AsyncStorage.getItem(JOURNAL_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    const out: Journal = {};
    for (const [key, value] of Object.entries(parsed)) {
      const result = DayEntrySchema.safeParse(value);
      if (result.success) {
        out[key] = result.data;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export async function getDay(dayKey: string): Promise<DayEntry | null> {
  const journal = await getJournal();
  return journal[dayKey] ?? null;
}

export async function recordDay(entry: DayEntry): Promise<void> {
  const valid = DayEntrySchema.parse(entry);
  const journal = await getJournal();
  journal[valid.date] = valid; // upsert by day — re-completing overwrites
  await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
}
