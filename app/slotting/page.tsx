import { computeSlotting } from "@/lib/slotting";
import { loadMovements, loadStore } from "@/lib/store";
import SlottingView from "../components/SlottingView";

export const metadata = { title: "Fast movers · Fernbrook stores" };

export default function SlottingPage() {
  const data = loadStore();
  return <SlottingView slotting={computeSlotting(data, data.stock, loadMovements())} />;
}
