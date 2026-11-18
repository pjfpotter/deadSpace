import type { Step } from "./model";

/** Short, stable fingerprint of a plan's steps (FNV-1a). Different plan, different key. */
export function planHash(steps: Step[]): string {
  const text = JSON.stringify(
    steps.map((s) =>
      s.type === "move"
        ? ["m", s.id, s.sku, s.quantity, s.from, s.to]
        : ["p", s.id, s.reference, s.sku, s.quantity, s.to],
    ),
  );
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export const progressKey = (hash: string) => `fernbrook-floor:${hash}`;

export interface MinimalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Read ticked step ids. Never throws: blocked storage, bad JSON or a different
 * shape all give "nothing ticked". Ids not in `validIds` (an old plan) are ignored.
 */
export function loadTicks(storage: MinimalStorage | null, hash: string, validIds: string[]): Set<string> {
  try {
    const raw = storage?.getItem(progressKey(hash));
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const valid = new Set(validIds);
    return new Set(parsed.filter((x): x is string => typeof x === "string" && valid.has(x)));
  } catch {
    return new Set();
  }
}

/** Save ticks. Returns false if the browser would not store them. Never throws. */
export function saveTicks(storage: MinimalStorage | null, hash: string, ticks: Set<string>): boolean {
  try {
    if (!storage) return false;
    storage.setItem(progressKey(hash), JSON.stringify([...ticks].sort()));
    return true;
  } catch {
    return false;
  }
}

/** The browser's localStorage, or null where it is blocked or missing. */
export function browserStorage(): MinimalStorage | null {
  try {
    const s = window.localStorage;
    const probe = "fernbrook-floor:probe";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}
