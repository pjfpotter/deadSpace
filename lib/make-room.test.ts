import { describe, expect, it } from "vitest";
import { planLevers } from "./make-room";
import { loadOrders, loadStore } from "./store";
import { analyse, buildTimeline, defaultAssumptions, placeAt, snapshots } from "./timeline";

const data = loadStore();
const orders = loadOrders();
const defaults = defaultAssumptions(orders);
const kinds = (r: ReturnType<typeof planLevers>) => r.steps.map((s) => `${s.kind}${s.applied ? "+" : "-"}${s.alternative ? "(alt)" : ""}`);

describe("planLevers with the default assumptions", () => {
  const t = buildTimeline(data, orders, defaults);
  const room = planLevers(t);

  it("starts 2 bins short, closes 1 by dispatching CO-8803 early, then the rest by splitting the benches", () => {
    expect(room.before.peak.short).toBe(2);
    const early = room.steps.find((s) => s.kind === "dispatch-early")!;
    expect(early).toMatchObject({ shortBefore: 2, shortAfter: 1, binsFreed: 1, applied: true, needsDecision: false });
    expect(early.detail).toMatch(/CO-8803.*2026-12-10 to 2026-12-02/);
    const split = room.steps.find((s) => s.kind === "split-receipt")!;
    expect(split).toMatchObject({ shortBefore: 1, shortAfter: 0, applied: true });
    expect(room.shortAfter).toBe(0);
  });

  it("lists the levers in order, with cross-dock shown as an alternative result", () => {
    expect(kinds(room)).toEqual(["existing-merges+", "dispatch-early+", "split-receipt+", "cross-dock-(alt)"]);
    const dock = room.steps.find((s) => s.kind === "cross-dock")!;
    expect(dock).toMatchObject({ shortAfter: 0, applied: false, alternative: true });
  });

  it("names who must agree and the latest date", () => {
    expect(room.steps.find((s) => s.kind === "dispatch-early")).toMatchObject({ deadline: "2026-12-02", owner: expect.stringMatching(/Customer/) });
    expect(room.steps.find((s) => s.kind === "split-receipt")).toMatchObject({ deadline: "2026-12-03", owner: expect.stringMatching(/Production/) });
  });

  it("the combined result is recomputed: Large peaks at 6 of 6 and the real solver and validator agree at every date", () => {
    expect(room.after.peak.short).toBe(0);
    const peakLarge = Math.max(...room.after.needs.map((n) => n.find((c) => c.size === "Large")!.needed));
    expect(peakLarge).toBe(6);
    expect(room.placementProblems).toEqual([]);
    expect(room.fits).toBe(true);
    room.after.snapshots.forEach((_, i) => expect(placeAt(room.final, i).fits).toBe(true));
  });

  it("does not change the timeline it was given", () => {
    expect(analyse(t).peak.short).toBe(2);
    expect(t.notes).toEqual([]);
  });

  it("every applied lever keeps the rules: nothing here needs a decision", () => {
    expect(room.steps.some((s) => s.needsDecision)).toBe(false);
  });
});

describe("dispatching early alone leaves 7 bins against 6", () => {
  it("is 7 of 6 after only CO-8803 moves", () => {
    const t = buildTimeline(data, orders, defaults);
    const early = planLevers(t).steps.find((s) => s.kind === "dispatch-early")!;
    expect(early.shortAfter).toBe(1);
  });
});

describe("when nothing needs to give", () => {
  it("returns just the existing merges and fits", () => {
    const small = orders.map((o) => (o.sku === "FG-BEN-2S" ? { ...o, quantity: 1 } : o));
    const room = planLevers(buildTimeline(data, small, defaults));
    expect(kinds(room)).toEqual(["existing-merges+"]);
    expect(room.fits).toBe(true);
  });
});

describe("when levers 1 to 4 are not enough", () => {
  it("states the shortfall and offers a decision, applying nothing silently", () => {
    // Pretend one Large bin is not available: the stores are short before any order arrives,
    // and no dispatch, split or cross-dock can change that.
    const fewer = { ...data, bins: data.bins.map((b) => (b.code === "C-03-2" ? { ...b, size: "Medium" as const } : b)) };
    const room = planLevers(buildTimeline(fewer, orders, defaults));
    const last = room.steps.at(-1)!;
    expect(last).toMatchObject({ kind: "rule-change", needsDecision: true, applied: false });
    expect(last.detail).toMatch(/Still \d+ bins? short/);
    expect(room.shortAfter).toBeGreaterThan(0);
    expect(room.fits).toBe(false);
    expect(room.steps.filter((s) => s.applied && s.needsDecision)).toEqual([]);
  });

  it("a very large bench order is solved by batching or cross-docking, never by a bench in a non-Large bin", () => {
    const huge = orders.map((o) => (o.sku === "FG-BEN-2S" ? { ...o, quantity: 100 } : o));
    const room = planLevers(buildTimeline(data, huge, defaults));
    expect(room.fits).toBe(true);
    for (const i of room.after.snapshots.keys()) {
      const p = placeAt(room.final, i);
      for (const s of p.plan.steps) {
        if (s.sku === "FG-BEN-2S") expect(p.data.bins.find((b) => b.code === s.to)?.size).toBe("Large");
      }
    }
  });
});

describe("a deliberately overfull placement is reported, not shown as a fit", () => {
  it("the 3 Dec peak without levers is not a fit", () => {
    const t = buildTimeline(data, orders, defaults);
    const peak = analyse(t).peak.index;
    expect(snapshots(t)[peak].units["FG-BEN-2S"]).toBe(69);
    expect(placeAt(t, peak).fits).toBe(false);
  });
});
