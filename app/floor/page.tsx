import { templateInstruction } from "@/lib/instructions";
import { planHash } from "@/lib/progress";
import { solve } from "@/lib/solve";
import { loadStore } from "@/lib/store";
import FloorChecklist, { type FloorStep } from "../components/FloorChecklist";
import PlanGuard from "../components/PlanGuard";

export const metadata = { title: "Floor checklist · Fernbrook stores" };

export default function FloorPage() {
  const data = loadStore();
  const plan = solve(data);

  const name = (sku: string) => data.products.find((p) => p.sku === sku)?.name ?? sku;
  const due = (ref: string) => data.incoming.find((l) => l.reference === ref)?.expectedDate;

  // Steps are already in an order where each can be done when reached (see solver).
  const steps: FloorStep[] = plan.steps.map((s) => ({
    id: s.id,
    group: s.type === "putaway" ? "delivery" : s.kind === "fix-mixed" ? "fix" : "merge",
    text: templateInstruction(s, name, { dueDate: s.type === "putaway" ? due(s.reference) : undefined }),
    detail: s.type === "move" ? `${s.from} → ${s.to}` : `→ ${s.to}`,
  }));

  return (
    <PlanGuard data={data} plan={plan}>
      <FloorChecklist steps={steps} hash={planHash(plan.steps)} />
    </PlanGuard>
  );
}
