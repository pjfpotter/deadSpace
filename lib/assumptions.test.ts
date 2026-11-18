import { describe, expect, it } from "vitest";
import { assumptionRegister, openQuestions } from "./assumptions";
import { loadOrders, loadStore } from "./store";
import { defaultAssumptions } from "./timeline";

const data = loadStore();
const register = assumptionRegister(data, defaultAssumptions(loadOrders()));

describe("assumptions register", () => {
  it("covers every assumption the spec requires", () => {
    expect(register.map((r) => r.id)).toEqual([
      "bench-arrival",
      "lead-days",
      "orders-from-stock",
      "no-other-outbound",
      "large-only-large",
      "one-product-per-bin",
      "capacity-units",
      "stale-counts",
      "plan-first",
    ]);
  });

  it("gives every entry a source, an effect and an owner", () => {
    for (const r of register) {
      expect(["Brief", "Data", "Our guess"]).toContain(r.source);
      expect(r.effect.length).toBeGreaterThan(20);
      expect(r.owner.length).toBeGreaterThan(2);
    }
  });

  it("names the bins really counted on 7 Nov, taken from the data", () => {
    const stale = register.find((r) => r.id === "stale-counts")!;
    expect(stale.assumption).toContain("C-01-2");
    expect(stale.assumption).toContain("C-02-2");
  });

  it("states the default bench date and lead time", () => {
    expect(register[0].assumption).toContain("2026-12-03");
    expect(register[1].assumption).toContain("1 day before");
  });

  it("lists the open questions, each saying what it would change", () => {
    const q = openQuestions();
    expect(q.map((x) => x.id)).toEqual(["bench-date", "bench-promised", "bulk-for-large", "orders-source"]);
    for (const x of q) expect(x.changes.length).toBeGreaterThan(20);
  });
});
