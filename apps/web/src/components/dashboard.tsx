"use client";

import { useEffect, useReducer, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Clock3,
  FlaskConical,
  Pause,
  Play,
  Wallet,
  Zap,
} from "lucide-react";
import { markets, type OrderRequest } from "@/lib/simulation";
import { createOrder, exchangeReducer, initialExchange, quote } from "@/lib/paper-exchange";
import { Navigation, type View } from "./navigation";
import { MarketStrip } from "./market-strip";
import { MarketChart } from "./market-chart";
import { MarketsView } from "./markets-view";
import { OverviewResources } from "./overview-resources";
import { OrderBook } from "./order-book";
import { OrderTicket } from "./order-ticket";
import { OrdersTable } from "./orders-table";
import { Architecture, LearningPath, Strategies } from "./project-views";

const money = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default function Dashboard() {
  const [view, setView] = useState<View>("Overview");
  const [menuOpen, setNavigationOpen] = useState(false);
  const [selected, setSelected] = useState("AAPL");
  const [running, setRunning] = useState(true);
  const [strategyRunning, setStrategyRunning] = useState(false);
  const [tab, setTab] = useState("All orders");
  const [state, dispatch] = useReducer(exchangeReducer, initialExchange);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => dispatch({ type: "tick" }), 2000);
    return () => clearInterval(timer);
  }, [running]);
  const market = quote(selected, state.tick);
  const filled = state.orders.filter((o) => o.status === "Filled");
  const equity =
    state.cash +
    Object.entries(state.positions).reduce(
      (total, [symbol, qty]) => total + quote(symbol, state.tick).price * qty,
      0,
    );
  const pnl = equity - 100000;
  const submit = (request: OrderRequest) => {
    const result = createOrder(state, selected, request);
    if (result.error) return result.error;
    if (result.order) dispatch({ type: "submit", order: result.order });
    return null;
  };
  const selectMarket = (symbol: string) => {
    setSelected(symbol);
    setView("Overview");
  };
  return (
    <div className="app-shell">
      <Navigation
        view={view}
        setView={setView}
        open={menuOpen}
        onOpen={() => setNavigationOpen(true)}
        onClose={() => setNavigationOpen(false)}
      />
      <main className="main">
        <div className="topbar">
          <span>
            EXPERIMENTAL EXCHANGE <span className="slash">/</span> LOCAL SESSION
          </span>
          <span className="environment">
            <span className={`status-dot ${running ? "" : "paused"}`} />
            {running ? "SIMULATION RUNNING" : "SIMULATION PAUSED"}
            <span className="slash">/</span>USD
          </span>
        </div>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">TRADELAB / RESEARCH & EXECUTION</div>
              <h1>
                {view === "Overview"
                  ? "Market monitor."
                  : view === "Strategies"
                    ? "Strategy lab"
                    : view}
              </h1>
              <p>
                {view === "Overview"
                  ? "Simulated equities. One session. Every order accounted for."
                  : "Exchange infrastructure & quantitative research."}
              </p>
            </div>
            <div className="heading-actions">
              <span className="session-pill">
                <span className={`status-dot ${running ? "" : "paused"}`} />
                {running ? "Simulation running" : "Simulation paused"}
              </span>
              <button
                className="secondary-button simulation-toggle"
                onClick={() => setRunning(!running)}
              >
                {running ? <Pause size={14} /> : <Play size={14} />}
                <span>{running ? "Pause" : "Resume"}</span>
              </button>
            </div>
          </div>
          {(view === "Overview" || view === "Activity") && (
            <div className="metrics-grid">
              <Metric
                label="Portfolio value"
                value={`$${money(equity)}`}
                icon={<Wallet size={16} />}
                detail={
                  <>
                    <span className={pnl >= 0 ? "positive" : "negative"}>
                      {pnl >= 0 ? "+" : "−"}${money(Math.abs(pnl))}
                    </span>
                    <span>this session</span>
                  </>
                }
              />
              <Metric
                label="Available balance"
                value={`$${money(state.cash)}`}
                icon={<Activity size={16} />}
                detail={
                  <>
                    <span className="status-dot" />
                    <span>Unallocated capital</span>
                  </>
                }
              />
              <Metric
                label="Executed orders"
                value={String(filled.length).padStart(2, "0")}
                icon={<Zap size={16} />}
                detail={
                  <>
                    <span className="positive">
                      {state.orders.filter((o) => o.status === "Open").length} open
                    </span>
                    <span>across {markets.length} markets</span>
                  </>
                }
              />
              <Metric
                label="Strategy signals"
                value={strategyRunning ? String(Math.floor(state.tick / 3)).padStart(2, "0") : "—"}
                icon={<FlaskConical size={16} />}
                detail={
                  <>
                    <span className={strategyRunning ? "positive" : "muted"}>
                      {strategyRunning ? "Preview running" : "No active strategies"}
                    </span>
                    <button aria-label="View strategies" onClick={() => setView("Strategies")}>
                      <ArrowUpRight size={14} />
                    </button>
                  </>
                }
              />
            </div>
          )}
          {view === "Overview" && (
            <>
              <MarketStrip selected={selected} onSelect={setSelected} tick={state.tick} />
              <div className="trading-grid">
                <MarketChart market={market} position={state.positions[selected] ?? 0} />
                <OrderBook market={market} tick={state.tick} />
                <OrderTicket key={selected} market={market} cash={state.cash} onSubmit={submit} />
              </div>
              <OrdersTable
                orders={state.orders}
                tab={tab}
                setTab={setTab}
                onCancel={(id) => dispatch({ type: "cancel", id })}
              />
              <OverviewResources setView={setView} />
            </>
          )}
          {view === "Markets" && <MarketsView tick={state.tick} onSelect={selectMarket} />}
          {view === "Activity" && (
            <OrdersTable
              orders={state.orders}
              tab={tab}
              setTab={setTab}
              onCancel={(id) => dispatch({ type: "cancel", id })}
            />
          )}
          {view === "Strategies" && (
            <Strategies running={strategyRunning} setRunning={setStrategyRunning} />
          )}
          {view === "Architecture" && <Architecture />}
          {view === "Learning path" && <LearningPath />}
          <footer className="page-footer">
            <span>
              <span className={`status-dot ${running ? "" : "paused"}`} />
              Browser simulation <span className="footer-divider">·</span> No live market connection
            </span>
            <span>
              <Clock3 size={12} />
              Session only <span className="footer-divider">·</span> v0.1.0
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}
function Metric({
  label,
  value,
  icon,
  detail,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <section className="panel metric">
      <div>
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <div className="metric-detail">{detail}</div>
    </section>
  );
}
