import { ArrowUpRight, ArrowRight, BookOpen } from "lucide-react";
import type { View } from "./sidebar";

export function OverviewResources({ setView }: { setView: (view: View) => void }) {
  return (
    <div className="bottom-grid">
      <section className="panel system-panel">
        <div className="panel-title">
          <h2>Under the hood</h2>
          <button onClick={() => setView("Architecture")}>
            View architecture <ArrowUpRight size={13} />
          </button>
        </div>
        <div className="service-list">
          <div>
            <span className="service-symbol">C++</span>
            <span>
              <b>Matching engine</b>
              <small>Price-time priority</small>
            </span>
            <span className="service-status">Core ready</span>
          </div>
          <div>
            <span className="service-symbol go">Go</span>
            <span>
              <b>API gateway</b>
              <small>Independent service</small>
            </span>
            <span className="service-status">Scaffold</span>
          </div>
          <div>
            <span className="service-symbol py">Py</span>
            <span>
              <b>Strategy engine</b>
              <small>Moving average crossover</small>
            </span>
            <span className="service-status">Offline</span>
          </div>
        </div>
      </section>
      <section className="panel learn-card">
        <span className="learn-art">
          <BookOpen size={30} />
        </span>
        <div>
          <span className="eyebrow">LEARN BY BUILDING</span>
          <h2>What happens after you click buy?</h2>
          <p>Follow an order from the gateway to the matching engine.</p>
          <button onClick={() => setView("Learning path")}>
            Explore the learning path <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </div>
  );
}
