import { SIZE_CLASSES, type SizeClass, type StockRow, type StoreData } from "./model";
import { BIN_VOLUME_M3, SPACE_PER_UNIT_M3 } from "./space-weights";
import { stockByBin, unitsInBin } from "./store";

export interface SpaceBin {
  bin: string;
  units: number;
  spaceUsedM3: number;
  binVolumeM3: number;
}

export interface SpaceClass {
  size: SizeClass;
  /** Percentage full by units against known capacity (same basis as the fullness page), or null. */
  unitsPercent: number | null;
  /** Percentage full by estimated space against assumed bin volume, or null. */
  spacePercent: number | null;
  spaceUsedM3: number;
  spaceAvailableM3: number;
  /** Bins left out of both percentages because their capacity is unknown. */
  excludedBins: string[];
  bins: SpaceBin[];
}

export interface RealSpace {
  classes: SpaceClass[];
  weights: Record<SizeClass, number>;
  binVolumes: Record<SizeClass, number>;
}

/** Space used = units × assumed space per unit. Information only: it never changes the plan. */
export function spaceUsed(units: number, size: SizeClass, weights = SPACE_PER_UNIT_M3): number {
  return units * weights[size];
}

export function computeRealSpace(
  data: Pick<StoreData, "bins">,
  stock: StockRow[],
  weights = SPACE_PER_UNIT_M3,
  binVolumes = BIN_VOLUME_M3,
): RealSpace {
  const byBin = stockByBin(stock);
  const classes = SIZE_CLASSES.map((size): SpaceClass => {
    const bins: SpaceBin[] = [];
    const excludedBins: string[] = [];
    let unitsKnown = 0;
    let capKnown = 0;
    let used = 0;
    let avail = 0;
    for (const b of data.bins.filter((x) => x.size === size)) {
      const units = unitsInBin(byBin.get(b.code));
      bins.push({ bin: b.code, units, spaceUsedM3: spaceUsed(units, size, weights), binVolumeM3: binVolumes[size] });
      if (b.capacity === null) {
        excludedBins.push(b.code);
        continue;
      }
      unitsKnown += units;
      capKnown += b.capacity;
      used += spaceUsed(units, size, weights);
      avail += binVolumes[size];
    }
    return {
      size,
      unitsPercent: capKnown > 0 ? (unitsKnown / capKnown) * 100 : null,
      spacePercent: avail > 0 ? (used / avail) * 100 : null,
      spaceUsedM3: used,
      spaceAvailableM3: avail,
      excludedBins,
      bins,
    };
  });
  return { classes, weights, binVolumes };
}
