import type { Step } from "./model";

/**
 * Plain-English instruction for a step, built only from the step's own facts
 * (product, quantity, bins, reference). No LLM involved in the MVP, so it cannot
 * name a wrong bin or quantity.
 */
export function templateInstruction(
  step: Step,
  productName: (sku: string) => string,
  opts: { dueDate?: string } = {},
): string {
  const what = `${step.quantity} × ${productName(step.sku)}`;
  if (step.type === "move") {
    const tail = step.frees ? ` Bin ${step.frees} is then empty.` : "";
    return step.kind === "fix-mixed"
      ? `Take ${what} out of ${step.from} (it holds two products) and put them in ${step.to}.${tail}`
      : `Take ${what} from ${step.from} and put them in ${step.to}.${tail}`;
  }
  const when = opts.dueDate ? ` due ${opts.dueDate}` : "";
  const first = step.madeRoomBy ? ` Do step ${step.madeRoomBy} first, which empties it.` : "";
  const how = step.topUp ? "top up the bin that already holds it:" : "use this empty bin:";
  return `When ${step.reference}${when} arrives, put ${what} in ${step.to} (${how.replace(/:$/, "")}).${first}`;
}
