import { computeFlags } from "@/lib/flags";
import { computeFullness } from "@/lib/fullness";
import { loadStore } from "@/lib/store";
import FlagsPanel from "./components/FlagsPanel";
import FullnessView from "./components/FullnessView";

export default function Home() {
  const data = loadStore();
  const fullness = computeFullness(data, data.stock);
  const flags = computeFlags(data);

  return (
    <div className="space-y-10">
      <FullnessView fullness={fullness} />
      <FlagsPanel flags={flags} />
    </div>
  );
}
