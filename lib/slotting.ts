import { SIZE_CLASSES, type Bin, type Movement, type SizeClass, type StockRow, type StoreData } from "./model";
import { OUTBOUND_TYPES } from "./run-out";
import { stockByBin } from "./store";

/** How "easy to reach" is decided. Shown in the view. A stated assumption. */
export const REACH_RULE =
  "Lower bay numbers are easier to reach, then lower shelf numbers. Bulk bays are ordered by bay number.";

/** Sort key for how hard a bin is to reach: lower is easier. Null if the code is not recognised. */
export function reachKey(code: string): [number, number] | null {
  const shelf = /^[A-Z]+-(\d+)-(\d+)$/.exec(code);
  if (shelf) return [Number(shelf[1]), Number(shelf[2])];
  const bulk = /^BULK-(\d+)$/.exec(code);
  if (bulk) return [Number(bulk[1]), 0];
  return null;
}

/** Negative when `a` is easier to reach than `b`. */
export function easier(a: string, b: string): number {
  const ka = reachKey(a) ?? [Infinity, Infinity];
  const kb = reachKey(b) ?? [Infinity, Infinity];
  const d0 = ka[0] === kb[0] ? 0 : ka[0] < kb[0] ? -1 : 1;
  const d1 = ka[1] === kb[1] ? 0 : ka[1] < kb[1] ? -1 : 1;
  return d0 || d1 || a.localeCompare(b);
}

export interface PickRank {
  sku: string;
  name: string;
  picks: number;
}

export interface SwapSide {
  sku: string;
  name: string;
  picks: number;
  quantity: number;
  from: string;
  to: string;
}

export interface Swap {
  size: SizeClass;
  /** Busier product: moves to the easier bin. */
  fast: SwapSide;
  /** Quieter product: moves to the harder bin. */
  slow: SwapSide;
}

export interface Slotting {
  ranking: { size: SizeClass; products: PickRank[] }[];
  swaps: Swap[];
}

/** Outbound movements per product (the number of picks, not units). */
export function pickCounts(movements: Movement[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of movements) {
    if (OUTBOUND_TYPES.includes(m.type)) out.set(m.sku, (out.get(m.sku) ?? 0) + 1);
  }
  return out;
}

interface Holding {
  bin: Bin;
  sku: string;
  quantity: number;
  picks: number;
}

/**
 * Optional swaps that put busier products in easier bins. A swap only happens between two
 * single-product bins of the same size class, and only when each product's stock fits the
 * other bin's known capacity. This reads the latest count and never touches the plan.
 */
export function computeSlotting(
  data: Pick<StoreData, "bins" | "products">,
  stock: StockRow[],
  movements: Movement[],
): Slotting {
  const picks = pickCounts(movements);
  const name = (sku: string) => data.products.find((p) => p.sku === sku)?.name ?? sku;

  const ranking = SIZE_CLASSES.map((size) => ({
    size,
    products: data.products
      .filter((p) => p.size === size)
      .map((p) => ({ sku: p.sku, name: p.name, picks: picks.get(p.sku) ?? 0 }))
      .sort((a, b) => b.picks - a.picks || a.name.localeCompare(b.name)),
  }));

  const byBin = stockByBin(stock);
  const swaps: Swap[] = [];

  for (const size of SIZE_CLASSES) {
    const holdings: Holding[] = [];
    for (const bin of data.bins) {
      if (bin.size !== size || bin.capacity === null) continue;
      const rows = byBin.get(bin.code) ?? [];
      if (rows.length !== 1) continue; // empty or mixed bins are left alone
      const sku = rows[0].sku;
      const product = data.products.find((p) => p.sku === sku);
      if (!product || product.size !== size) continue;
      holdings.push({ bin, sku, quantity: rows[0].quantity, picks: picks.get(sku) ?? 0 });
    }

    // Candidate pairs: the busier product sits in the harder-to-reach bin.
    const candidates: { easy: Holding; hard: Holding; gain: number }[] = [];
    for (const easy of holdings) {
      for (const hard of holdings) {
        if (easy === hard || easier(easy.bin.code, hard.bin.code) >= 0) continue;
        if (hard.picks <= easy.picks || hard.sku === easy.sku) continue;
        if (hard.quantity > easy.bin.capacity! || easy.quantity > hard.bin.capacity!) continue;
        candidates.push({ easy, hard, gain: hard.picks - easy.picks });
      }
    }
    candidates.sort((a, b) => b.gain - a.gain || easier(a.easy.bin.code, b.easy.bin.code));

    const used = new Set<string>();
    for (const { easy, hard } of candidates) {
      if (used.has(easy.bin.code) || used.has(hard.bin.code)) continue;
      used.add(easy.bin.code);
      used.add(hard.bin.code);
      swaps.push({
        size,
        fast: { sku: hard.sku, name: name(hard.sku), picks: hard.picks, quantity: hard.quantity, from: hard.bin.code, to: easy.bin.code },
        slow: { sku: easy.sku, name: name(easy.sku), picks: easy.picks, quantity: easy.quantity, from: easy.bin.code, to: hard.bin.code },
      });
    }
  }
  return { ranking, swaps };
}
