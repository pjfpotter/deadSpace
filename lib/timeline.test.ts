import { describe, expect, it } from "vitest";
import {
  addDays,
  analyse,
  binsNeeded,
  buildTimeline,
  checkAssumptions,
  defaultAssumptions,
  placeAt,
  snapshots,
} from "./timeline";
import { loadOrders, loadStore } from "./store";

const data = loadStore();
const orders = loadOrders();
const defaults = defaultAssumptions(orders);
const large = (needs: ReturnType<typeof analyse>["needs"][number]) => needs.find((c) => c.size === "Large")!;

describe("assumptions", () => {
  it("defaults to the day before the bench order is delivered, with a one-day lead", () => {
    expect(defaults).toEqual({ benchArrival: "2026-12-03", leadDays: 1 });
  });

  it("refuses an arrival on or before the last production run on the Incoming list", () => {
    const msg = checkAssumptions(data, orders, { ...defaults, benchArrival: "2026-11-27" });
    expect(msg).toMatch(/follow the production runs.*2026-11-27/);
    expect(checkAssumptions(data, orders, { ...defaults, benchArrival: "2026-11-28" })).toBeNull();
  });

  it("refuses benches that arrive after the bench order leaves, bad dates and bad lead times", () => {
    expect(checkAssumptions(data, orders, { ...defaults, benchArrival: "2026-12-04" })).toMatch(/CO-8801 leaves on 2026-12-03/);
    expect(checkAssumptions(data, orders, { ...defaults, benchArrival: "soon" })).toMatch(/real date/);
    expect(checkAssumptions(data, orders, { ...defaults, leadDays: 1.5 })).toMatch(/lead time/);
    expect(() => buildTimeline(data, orders, { ...defaults, benchArrival: "2026-11-01" })).toThrow();
  });
});

describe("timeline with default assumptions", () => {
  const t = buildTimeline(data, orders, defaults);
  const snaps = snapshots(t);
  const a = analyse(t);
  const at = (date: string, label: RegExp) => snaps.find((s) => s.date === date && label.test(s.label))!;

  it("starts from the existing plan: Large uses all 6 bins", () => {
    expect(snaps[0].units["FG-BEN-2S"]).toBe(29);
    expect(snaps[0].units["FG-BEN-3S"]).toBe(48);
    expect(large(a.needs[0])).toMatchObject({ needed: 6, available: 6, short: 0 });
  });

  it("on 3 Dec when the benches land: 2S 69, 3S 48, chairs 20, and Large needs 8 bins of 6", () => {
    const landed = at("2026-12-03", /extra benches arrive/);
    expect(landed.units).toMatchObject({ "FG-BEN-2S": 69, "FG-BEN-3S": 48, "FG-CHR-FLD": 20, "FG-TBL-BIS": 12, "FG-PLN-LRG": 7 });
    const l = large(a.needs[landed.index]);
    expect(l).toMatchObject({ needed: 8, available: 6, short: 2, capacity: 30 });
    const bins = Object.fromEntries(l.rows.map((r) => [r.sku, r.bins]));
    expect(bins).toEqual({ "FG-BEN-2S": 3, "FG-BEN-3S": 2, "FG-TBL-BIS": 1, "FG-CHR-FLD": 1, "FG-PLN-LRG": 1 });
    expect(a.peak).toEqual({ index: landed.index, short: 2, size: "Large" });
    expect(a.overDates.Large).toEqual(["2026-12-03"]);
  });

  it("units alone would fit (156 of 180): the shortfall is bins, not units", () => {
    const landed = at("2026-12-03", /extra benches arrive/);
    const total = ["FG-BEN-2S", "FG-BEN-3S", "FG-TBL-BIS", "FG-CHR-FLD", "FG-PLN-LRG"].reduce((s, k) => s + (landed.units[k] ?? 0), 0);
    expect(total).toBe(156);
  });

  it("after the first two orders leave, Large is back to 6 of 6; after CO-8803 it is 5 of 6", () => {
    const afterBoth = snaps.filter((s) => s.date === "2026-12-03").at(-1)!;
    expect(afterBoth.units).toMatchObject({ "FG-BEN-2S": 29, "FG-CHR-FLD": 4 });
    expect(large(a.needs[afterBoth.index])).toMatchObject({ needed: 6, short: 0 });
    const last = snaps.at(-1)!;
    expect(last.date).toBe("2026-12-10");
    expect(last.units["FG-BEN-3S"]).toBe(24);
    expect(large(a.needs[last.index])).toMatchObject({ needed: 5, short: 0 });
  });

  it("Small, Medium and Bulk fit at every point", () => {
    for (const classes of a.needs) {
      for (const c of classes.filter((x) => x.size !== "Large")) {
        expect(c.fits, `${c.size} needs ${c.needed} of ${c.available}`).toBe(true);
      }
    }
  });

  it("no order asks for more than is in the stores", () => {
    expect(snaps.some((s) => s.shortfall)).toBe(false);
  });

  it("reports a shortfall when a dispatch exceeds stock instead of clipping silently", () => {
    const big = [...orders.slice(0, 1), { ...orders[1], quantity: 500 }, orders[2]];
    const s = snapshots(buildTimeline(data, big, defaults)).find((x) => x.shortfall);
    expect(s?.shortfall).toEqual({ orderRef: "CO-8802", sku: "FG-CHR-FLD", short: 480 });
  });
});

describe("a bench that arrives earlier lengthens the peak", () => {
  it("shows Large over for more than one day when benches arrive 30 Nov", () => {
    const t = buildTimeline(data, orders, { ...defaults, benchArrival: "2026-11-30" });
    expect(analyse(t).overDates.Large).toEqual(["2026-11-30"]);
    expect(analyse(t).peak.short).toBe(2);
  });
});

describe("placement is checked by the real solver and validator", () => {
  const t = buildTimeline(data, orders, defaults);
  it("the existing-plan state fits and passes", () => {
    const p = placeAt(t, 0);
    expect(p.violations).toEqual([]);
    expect(p.fits).toBe(true);
  });
  it("the 3 Dec peak does not fit: benches are left unplaced rather than broken rules", () => {
    const peak = analyse(t).peak.index;
    const p = placeAt(t, peak);
    expect(p.violations).toEqual([]);
    expect(p.fits).toBe(false);
    expect(p.plan.unplaced.reduce((s, u) => s + u.quantity, 0)).toBeGreaterThan(0);
  });
});

describe("helpers", () => {
  it("binsNeeded and addDays", () => {
    expect(binsNeeded(0, 30)).toBe(0);
    expect(binsNeeded(30, 30)).toBe(1);
    expect(binsNeeded(31, 30)).toBe(2);
    expect(binsNeeded(4, 30)).toBe(1);
    expect(addDays("2026-12-01", -1)).toBe("2026-11-30");
  });
});
