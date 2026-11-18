import { SIZE_CLASSES, type Bin, type SizeClass, type StockRow, type StoreData } from "./model";
import { stockByBin, unitsInBin } from "./store";

export interface BinFill {
  bin: string;
  size: SizeClass;
  units: number;
  capacity: number | null;
}

export interface SizeFullness {
  size: SizeClass;
  bins: number;
  /** Units in every bin of this class, including bins with unknown capacity. */
  unitsUsed: number;
  /** Capacity of bins whose capacity is known. */
  knownCapacity: number;
  /** Units in bins whose capacity is known (the numerator of `percent`). */
  unitsInKnownBins: number;
  /** unitsInKnownBins / knownCapacity, 0-100, or null if no capacity is known. */
  percent: number | null;
  /** Bins left out of the percentage because their capacity is unknown. */
  excludedBins: string[];
  emptyBins: string[];
  underHalfBins: BinFill[];
}

export interface Fullness {
  bySize: SizeFullness[];
  overall: {
    bins: number;
    unitsUsed: number;
    knownCapacity: number;
    unitsInKnownBins: number;
    percent: number | null;
    emptyBins: string[];
    underHalfBins: BinFill[];
    excludedBins: string[];
  };
}

function pct(used: number, cap: number): number | null {
  return cap > 0 ? (used / cap) * 100 : null;
}

/**
 * How full the stores are. Pass `stock` to measure a different state, e.g. the
 * stock after the merges are applied; it defaults to the latest count.
 *
 * "Under half full" means holding stock but strictly less than half of a known capacity.
 */
export function computeFullness(data: Pick<StoreData, "bins">, stock: StockRow[]): Fullness {
  const byBin = stockByBin(stock);

  const fills: BinFill[] = data.bins.map((b: Bin) => ({
    bin: b.code,
    size: b.size,
    units: unitsInBin(byBin.get(b.code)),
    capacity: b.capacity,
  }));

  const summarise = (subset: BinFill[]) => {
    const known = subset.filter((f) => f.capacity !== null);
    const knownCapacity = known.reduce((s, f) => s + (f.capacity ?? 0), 0);
    const unitsInKnownBins = known.reduce((s, f) => s + f.units, 0);
    return {
      bins: subset.length,
      unitsUsed: subset.reduce((s, f) => s + f.units, 0),
      knownCapacity,
      unitsInKnownBins,
      percent: pct(unitsInKnownBins, knownCapacity),
      excludedBins: subset.filter((f) => f.capacity === null).map((f) => f.bin),
      emptyBins: subset.filter((f) => f.units === 0).map((f) => f.bin),
      underHalfBins: subset.filter(
        (f) => f.capacity !== null && f.units > 0 && f.units < f.capacity / 2,
      ),
    };
  };

  return {
    bySize: SIZE_CLASSES.map((size) => ({ size, ...summarise(fills.filter((f) => f.size === size)) })),
    overall: summarise(fills),
  };
}
