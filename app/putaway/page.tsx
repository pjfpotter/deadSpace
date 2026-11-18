import { solve } from "@/lib/solve";
import { loadStore } from "@/lib/store";
import PlanGuard from "../components/PlanGuard";
import PutawayView from "../components/PutawayView";

export const metadata = { title: "Putaway · Fernbrook stores" };

export default function PutawayPage() {
  const data = loadStore();
  const plan = solve(data);

  return (
    <PlanGuard data={data} plan={plan}>
      <PutawayView plan={plan} incoming={data.incoming} products={data.products} />
    </PlanGuard>
  );
}
