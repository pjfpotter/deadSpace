import type { IncomingLine, Movement, Product, StockRow, StoreData } from "./model";

/** Products with fewer days of cover than this are flagged. A stated assumption. */
export const COVER_THRESHOLD_DAYS = 7;

/** Movement types that take stock out of a bin. */
export const OUTBOUND_TYPES: Movement["type"][] = ["customer_dispatch", "production_issue"];

export type RunOutStatus = "out-of-stock" | "at-risk" | "ok" | "unknown";

export interface RunOutRow {
  sku: string;
  name: string;
  counted: number;
  /** Average outbound units per day over the history, 0 if none. */
  dailyUse: number;
  /** counted / dailyUse, or null when there is no outbound history. Never Infinity or NaN. */
  coverDays: number | null;
  status: RunOutStatus;
  incoming: IncomingLine[];
}

export interface RunOut {
  rows: RunOutRow[];
  /** Working days of history the averages used (distinct dates with movements). */
  historyDays: number;
  firstDate: string | null;
  lastDate: string | null;
  threshold: number;
}

/**
 * Days of history = distinct dates with at least one movement (the stores are not
 * moving stock on weekends, so calendar days would understate daily use).
 */
export function historySpan(movements: Pick<Movement, "date">[]): { days: number; first: string | null; last: string | null } {
  if (movements.length === 0) return { days: 0, first: null, last: null };
  const dates = [...new Set(movements.map((m) => m.date))].sort();
  return { days: dates.length, first: dates[0], last: dates[dates.length - 1] };
}

export function computeRunOut(
  data: Pick<StoreData, "products" | "incoming">,
  stock: StockRow[],
  movements: Movement[],
  threshold = COVER_THRESHOLD_DAYS,
): RunOut {
  const span = historySpan(movements);
  const counted = new Map<string, number>();
  for (const r of stock) counted.set(r.sku, (counted.get(r.sku) ?? 0) + r.quantity);
  const outbound = new Map<string, number>();
  for (const m of movements) {
    if (OUTBOUND_TYPES.includes(m.type)) outbound.set(m.sku, (outbound.get(m.sku) ?? 0) + m.quantity);
  }

  const rows = data.products.map((p: Product): RunOutRow => {
    const have = counted.get(p.sku) ?? 0;
    const used = outbound.get(p.sku) ?? 0;
    const dailyUse = span.days > 0 ? used / span.days : 0;
    const coverDays = dailyUse > 0 ? have / dailyUse : null;
    let status: RunOutStatus;
    if (have === 0) status = "out-of-stock";
    else if (coverDays === null) status = "unknown";
    else status = coverDays < threshold ? "at-risk" : "ok";
    return {
      sku: p.sku,
      name: p.name,
      counted: have,
      dailyUse,
      coverDays,
      status,
      incoming: data.incoming.filter((l) => l.sku === p.sku).sort((a, b) => a.expectedDate.localeCompare(b.expectedDate)),
    };
  });

  const rank = { "out-of-stock": 0, "at-risk": 1, unknown: 2, ok: 3 } as const;
  rows.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      (a.coverDays ?? Infinity) - (b.coverDays ?? Infinity) ||
      a.name.localeCompare(b.name),
  );
  return { rows, historyDays: span.days, firstDate: span.first, lastDate: span.last, threshold };
}
