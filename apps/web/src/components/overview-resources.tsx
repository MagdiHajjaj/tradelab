import { ArrowUpRight } from "lucide-react";
import type { View } from "./navigation";

export function OverviewResources({ setView }: { setView: (view: View) => void }) {
  return (
    <div className="research-notes">
      <span className="eyebrow">DEVELOPMENT LOG / 001</span>
      <p>Go → C++ order routing verified. Browser streaming is next.</p>
      <button onClick={() => setView("Architecture")}>
        System architecture <ArrowUpRight size={14} />
      </button>
      <button onClick={() => setView("Learning path")}>
        Reading list <ArrowUpRight size={14} />
      </button>
    </div>
  );
}
