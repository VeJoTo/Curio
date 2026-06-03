/**
 * The personalized greeting line for the Today header, or `null` when the
 * profile has no usable name (`name` is optional in ProfileSchema). A null
 * result means the header omits the title line and shows only the "Today" meta.
 */
export function greetingLine(name?: string): string | null {
  const trimmed = name?.trim();
  return trimmed ? `Hi, ${trimmed} 👋` : null;
}
