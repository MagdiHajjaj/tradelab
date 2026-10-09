import {
  ArrowRight,
  BookOpen,
  Check,
  Circle,
  Code2,
  Cpu,
  Network,
  FlaskConical,
  Play,
  Square,
} from "lucide-react";

const strategies = [
  {
    name: "Moving average crossover",
    tag: "TREND FOLLOWING",
    desc: "Compare a fast and slow moving average. A crossover generates a directional signal.",
    code: "strategies/tradelab/strategy.py",
    window: "Fast 5 / Slow 20",
  },
  {
    name: "Mean reversion",
    tag: "STATISTICAL",
    desc: "Explore whether price returns toward its recent average after a large deviation.",
    code: "Planned · milestone 04",
    window: "Z-score threshold",
  },
  {
    name: "Market making",
    tag: "LIQUIDITY",
    desc: "Quote both sides of the order book and study spread capture and inventory risk.",
    code: "Planned · milestone 05",
    window: "Inventory-aware quotes",
  },
];
export function Strategies({
  running,
  setRunning,
}: {
  running: boolean;
  setRunning: (running: boolean) => void;
}) {
  return (
    <div className="view-content">
      <div className="section-intro">
        <span className="eyebrow">QUANTITATIVE RESEARCH</span>
        <h2>Strategy register.</h2>
        <p>Signal generation, parameters, and experiment status.</p>
      </div>
      <div className="strategy-grid">
        {strategies.map((s, i) => (
          <section className="panel strategy-card" key={s.name}>
            <FlaskConical size={25} className="positive" />
            <span className="eyebrow">{s.tag}</span>
            <h2>{s.name}</h2>
            <p>{s.desc}</p>
            <div className="strategy-param">{s.window}</div>
            <code>{s.code}</code>
            <button
              className={i === 0 ? "primary-button" : "secondary-button"}
              disabled={i !== 0}
              onClick={() => setRunning(!running)}
            >
              {i === 0 ? (
                running ? (
                  <>
                    <Square size={14} /> Stop signal preview
                  </>
                ) : (
                  <>
                    <Play size={14} /> Start signal preview
                  </>
                )
              ) : (
                "Coming in a future milestone"
              )}
            </button>
          </section>
        ))}
      </div>
      <div className="info-strip">
        <BookOpen size={18} />
        <span>
          {running
            ? "Signal preview is running. The overview shows illustrative signals; it does not submit orders."
            : "Run the Python strategy locally to inspect real crossover signals. Browser previews use illustrative data."}
        </span>
      </div>
    </div>
  );
}
export function Architecture() {
  const services = [
    {
      icon: Code2,
      title: "Web dashboard",
      tech: "Next.js · React · TypeScript",
      path: "apps/web",
      text: "Visualize the market and place paper orders in an isolated browser simulation.",
      status: "Interactive demo",
    },
    {
      icon: Network,
      title: "API gateway",
      tech: "Go · HTTP",
      path: "services/gateway",
      text: "Route orders and cancellations to five C++ engines. Readiness tracks process availability.",
      status: "Order routing ready",
    },
    {
      icon: Cpu,
      title: "Matching engine",
      tech: "C++20 · Google Test",
      path: "services/matching-engine",
      text: "Match limit orders at the resting price with price-time priority and integer prices.",
      status: "Core implemented",
    },
    {
      icon: FlaskConical,
      title: "Strategy engine",
      tech: "Python · Standard library",
      path: "strategies",
      text: "Generate offline crossover signals. A separate HTTP client can submit exchange orders.",
      status: "Strategy + HTTP client",
    },
  ];
  return (
    <div className="view-content">
      <div className="section-intro">
        <span className="eyebrow">SYSTEM REFERENCE</span>
        <h2>Understand every layer.</h2>
        <p>Service responsibilities and current implementation status.</p>
      </div>
      <div className="architecture-grid">
        {services.map((s) => (
          <section className="panel architecture-card" key={s.title}>
            <s.icon size={26} className="positive" />
            <span className="status-tag">{s.status}</span>
            <h2>{s.title}</h2>
            <b>{s.tech}</b>
            <p>{s.text}</p>
            <code>{s.path}</code>
          </section>
        ))}
      </div>
      <div className="info-strip">
        <ArrowRight size={18} />
        <span>
          Planned flow: Dashboard / Python → Go gateway → per-symbol C++ engine → execution events →
          dashboard.
        </span>
      </div>
    </div>
  );
}
export function LearningPath() {
  const steps = [
    {
      title: "Find your way around",
      detail:
        "Start with docs/CODE_TOUR.md, then open the README in each service. Run the dashboard and submit your first paper order.",
      done: true,
    },
    {
      title: "Build an order book",
      detail:
        "Read order_book.hpp, follow add() in order_book.cpp, and run the Google Test suite. Explore partial fills and FIFO priority.",
      done: true,
    },
    {
      title: "Connect the services",
      detail:
        "Go now routes orders to C++ by symbol. Next: book snapshots, WebSocket events, and the browser data adapter.",
      done: false,
    },
    {
      title: "Run your first strategy",
      detail:
        "Run the connected Python exchange demo, then add risk-aware sizing before wiring crossover signals into a strategy runner.",
      done: false,
    },
    {
      title: "Measure, then optimize",
      detail:
        "Add reproducible benchmarks, persistence, risk limits, and performance attribution. Document what each experiment teaches you.",
      done: false,
    },
  ];
  return (
    <div className="view-content learning-view">
      <div className="section-intro">
        <span className="eyebrow">PROJECT NOTES</span>
        <h2>Build sequence.</h2>
        <p>A practical route from your first order to a distributed trading system.</p>
      </div>
      {steps.map((s, i) => (
        <section className="panel learning-step" key={s.title}>
          <div className={`step-number ${s.done ? "done" : ""}`}>
            {s.done ? <Check size={21} /> : String(i + 1).padStart(2, "0")}
          </div>
          <div>
            <span className="eyebrow">MILESTONE {String(i + 1).padStart(2, "0")}</span>
            <h2>{s.title}</h2>
            <p>{s.detail}</p>
          </div>
          <span className="step-state">
            {s.done ? (
              "Foundation ready"
            ) : (
              <>
                <Circle size={11} /> Planned
              </>
            )}
          </span>
        </section>
      ))}
    </div>
  );
}
