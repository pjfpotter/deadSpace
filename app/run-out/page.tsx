import { computeRunOut } from "@/lib/run-out";
import { loadMovements, loadStore } from "@/lib/store";
import RunOutView from "../components/RunOutView";

export const metadata = { title: "What might run out · Fernbrook stores" };

export default function RunOutPage() {
  const data = loadStore();
  return <RunOutView runOut={computeRunOut(data, data.stock, loadMovements())} />;
}
