import { solve } from "@/lib/solve";
import { loadStore } from "@/lib/store";
import FitCheck from "../components/FitCheck";

export const metadata = { title: "Can we fit it? · Fernbrook stores" };

// No PlanGuard here: a broken plan hides only the "after merges" answer, and the
// "now" answer still works (see lib/fit.ts).
export default function FitPage() {
  const data = loadStore();
  const plan = solve(data);
  return <FitCheck data={data} plan={plan} />;
}
