import { stockAfter } from "@/lib/apply";
import { computeFullness } from "@/lib/fullness";
import { solve } from "@/lib/solve";
import { loadStore } from "@/lib/store";
import MergesView from "../components/MergesView";
import PlanGuard from "../components/PlanGuard";

export const metadata = { title: "Merges · Fernbrook stores" };

export default function MergesPage() {
  const data = loadStore();
  const plan = solve(data);

  const empties = (steps: typeof plan.steps) => computeFullness(data, stockAfter(data, steps)).overall.emptyBins;
  const moveSteps = plan.steps.filter((s) => s.type === "move");

  const empty = {
    now: computeFullness(data, data.stock).overall.emptyBins.length,
    afterMerges: empties(moveSteps).length,
    afterDeliveries: empties(plan.steps).length,
    spareAfterDeliveries: empties(plan.steps),
  };

  return (
    <PlanGuard data={data} plan={plan}>
      <MergesView plan={plan} products={data.products} empty={empty} />
    </PlanGuard>
  );
}
