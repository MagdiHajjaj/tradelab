import { useState } from "react";
import { Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { markets, type Market } from "@/lib/simulation";
import { PriceChart } from "./price-chart";

export function MarketChart({ market, position }: { market: Market; position: number }) {
  const [range, setRange] = useState("1D");
  return (
    <section className="panel chart-panel">
      <div className="chart-heading">
        <div className="instrument">
          <div>
            <h2>
              {market.symbol}
              <span>NASDAQ</span>
            </h2>
            <p>{market.name}</p>
          </div>
        </div>
        <span className="small-label">SYNTHETIC DATA</span>
      </div>
      <div className="chart-price">
        <strong>${market.price.toFixed(2)}</strong>
        <span className={market.change > 0 ? "positive" : "negative"}>
          {market.change > 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
          {market.change > 0 ? "+" : ""}
          {market.change}%
        </span>
        <span className="muted">sample session</span>
      </div>
      <div className="chart-toolbar">
        <div className="range-tabs">
          {["1H", "1D", "1W", "1M", "1Y", "ALL"].map((r) => (
            <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>
              {r}
            </button>
          ))}
        </div>
        <span>
          <Activity size={13} />
          Price
        </span>
      </div>
      <div className="chart-area">
        <PriceChart
          seed={
            markets.findIndex((m) => m.symbol === market.symbol) * 10 +
            ["1H", "1D", "1W", "1M", "1Y", "ALL"].indexOf(range) * 17 +
            4
          }
        />
        <div className="chart-axis">
          {[1.2, 0.6, 0, -0.6, -1.2].map((v) => (
            <span key={v}>{(market.price + v).toFixed(2)}</span>
          ))}
        </div>
      </div>
      <div className="time-axis">
        {(range === "1D"
          ? ["09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "16:00"]
          : range === "1H"
            ? ["00:00", "00:10", "00:20", "00:30", "00:40", "00:50", "01:00"]
            : ["Start", "", "", "Midpoint", "", "", "End"]
        ).map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
      <div className="chart-stats">
        <div>
          <span>Session high</span>
          <b>${(market.price + 1.24).toFixed(2)}</b>
        </div>
        <div>
          <span>Session low</span>
          <b>${(market.price - 2.36).toFixed(2)}</b>
        </div>
        <div>
          <span>Sample volume</span>
          <b>{market.volume}</b>
        </div>
        <div>
          <span>Your position</span>
          <b>{position} shares</b>
        </div>
      </div>
    </section>
  );
}
