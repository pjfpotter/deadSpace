import type { Plan, StoreData } from "@/lib/model";
import { validatePlan } from "@/lib/validate";

/**
 * Every page that shows a plan renders it through this guard. If the plan breaks
 * a store rule, the violations are shown instead of the moves, so a bad plan can
 * never reach the floor.
 */
export default function PlanGuard({
  data,
  plan,
  children,
}: {
  data: StoreData;
  plan: Plan;
  children: React.ReactNode;
}) {
  const violations = validatePlan(data, plan);
  if (violations.length === 0) return <>{children}</>;

  return (
    <section role="alert" className="rounded-lg border border-bad bg-surface p-4">
      <h2 className="text-lg font-semibold text-bad">This plan breaks the store rules, so it is not shown</h2>
      <p className="mt-1 text-sm text-muted">
        Nothing below has been checked off to the floor. Fix the problems and try again.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {violations.map((v, i) => (
          <li key={i}>
            <span className="font-mono text-xs text-muted">{v.rule}</span> {v.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
