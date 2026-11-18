import { describe, expect, it } from "vitest";
import { computeFullness } from "./fullness";
import { loadStore } from "./store";

const data = loadStore();
const f = computeFullness(data, data.stock);
const size = (s: string) => f.bySize.find((x) => x.size === s)!;

describe("computeFullness on the real data", () => {
  it("reports Small, Medium and Large utilisation", () => {
    expect(Math.round(size("Small").percent!)).toBe(43);
    expect(Math.round(size("Medium").percent!)).toBe(49);
    expect(Math.round(size("Large").percent!)).toBe(48);
  });

  it("excludes BULK-04 from the Bulk percentage and says so", () => {
    const bulk = size("Bulk");
    expect(bulk.excludedBins).toEqual(["BULK-04"]);
    expect(bulk.knownCapacity).toBe(900);
    expect(bulk.unitsInKnownBins).toBe(510); // 180 + 90 + 240
    expect(Math.round(bulk.percent!)).toBe(57);
    expect(bulk.unitsUsed).toBe(660); // BULK-04's 150 still counts as used
  });

  it("lists the empty bins", () => {
    expect(f.overall.emptyBins.sort()).toEqual(["A-05-1", "B-03-3"]);
    expect(size("Small").emptyBins).toEqual(["A-05-1"]);
    expect(size("Medium").emptyBins).toEqual(["B-03-3"]);
  });

  it("lists under-half bins with quantity and capacity", () => {
    const medium = size("Medium").underHalfBins.map((b) => b.bin).sort();
    expect(medium).toEqual(["B-01-2", "B-02-1", "B-02-2", "B-03-1"]);
    const legs = size("Medium").underHalfBins.find((b) => b.bin === "B-01-2")!;
    expect(legs).toMatchObject({ units: 14, capacity: 60 });
  });

  it("never lists an empty bin or an unknown-capacity bin as under half", () => {
    for (const b of f.overall.underHalfBins) {
      expect(b.units).toBeGreaterThan(0);
      expect(b.capacity).not.toBeNull();
    }
  });
});

describe("computeFullness edge cases", () => {
  const bins = [{ code: "A-01-1", zone: "z", size: "Small" as const, capacity: 60 }];
  const stock = (q: number) => [{ bin: "A-01-1", sku: "X", quantity: q, lastCounted: "2026-11-14" }];

  it("exactly half is not under half", () => {
    expect(computeFullness({ bins }, stock(30)).overall.underHalfBins).toEqual([]);
  });

  it("one under half is listed", () => {
    expect(computeFullness({ bins }, stock(29)).overall.underHalfBins).toHaveLength(1);
  });

  it("a size class with no known capacity has a null percent, not NaN", () => {
    const r = computeFullness({ bins: [{ ...bins[0], capacity: null }] }, stock(5));
    expect(r.bySize.find((s) => s.size === "Small")!.percent).toBeNull();
  });

  it("measures a different stock state when given one", () => {
    expect(computeFullness({ bins }, []).overall.emptyBins).toEqual(["A-01-1"]);
  });
});
