import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Plan, StoreData } from "@/lib/model";
import PlanGuard from "./PlanGuard";

const data: StoreData = {
  bins: [
    { code: "S1", zone: "z", size: "Small", capacity: 10 },
    { code: "S2", zone: "z", size: "Small", capacity: 10 },
  ],
  products: [{ sku: "X", name: "Thing X", category: "c", size: "Small" }],
  stock: [
    { bin: "S1", sku: "X", quantity: 4, lastCounted: "2026-11-14" },
    { bin: "S2", sku: "X", quantity: 3, lastCounted: "2026-11-14" },
  ],
  incoming: [],
};

const step = (quantity: number) =>
  ({ type: "move", id: "m1", kind: "merge", sku: "X", quantity, from: "S2", to: "S1" }) as const;
const planOf = (quantity: number): Plan => {
  const s = step(quantity);
  const { type: _t, ...m } = s;
  return { moves: [m], putaways: [], unplaced: [], freedBins: ["S2"], steps: [s] };
};

describe("PlanGuard", () => {
  it("shows the moves when the plan is valid", () => {
    const html = renderToStaticMarkup(
      <PlanGuard data={data} plan={planOf(3)}>
        <p>THE-MOVES</p>
      </PlanGuard>,
    );
    expect(html).toContain("THE-MOVES");
    expect(html).not.toContain("breaks the store rules");
  });

  it("shows violations instead of the moves when the plan is broken", () => {
    const html = renderToStaticMarkup(
      <PlanGuard data={data} plan={planOf(30)}>
        <p>THE-MOVES</p>
      </PlanGuard>,
    );
    expect(html).not.toContain("THE-MOVES");
    expect(html).toContain("breaks the store rules");
    expect(html).toContain("insufficient-stock");
    expect(html).toContain("S2 only holds 3");
  });
});
