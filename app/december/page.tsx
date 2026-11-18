import { loadOrders, loadStore } from "@/lib/store";
import DecemberView from "../components/DecemberView";

export const metadata = { title: "December orders · Fernbrook stores" };

// The sums run in the browser from fixtures (see DecemberView). The page itself needs
// no PlanGuard: any placement it calls a fit is checked by the validator inside planLevers.
export default function DecemberPage() {
  return <DecemberView data={loadStore()} orders={loadOrders()} />;
}
