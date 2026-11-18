import { computeRealSpace } from "@/lib/real-space";
import { loadStore } from "@/lib/store";
import RealSpaceView from "../components/RealSpaceView";

export const metadata = { title: "Real space · Fernbrook stores" };

export default function RealSpacePage() {
  const data = loadStore();
  return <RealSpaceView space={computeRealSpace(data, data.stock)} />;
}
