import { markets } from "@/lib/simulation";
import { quote } from "@/lib/paper-exchange";
import { PriceChart } from "./price-chart";

export function MarketStrip({
  selected,
  onSelect,
  tick,
}: {
  selected: string;
  onSelect: (symbol: string) => void;
  tick: number;
}) {
  return (
    <div className="market-strip">
      {markets.map((m, i) => (
        <button
          key={m.symbol}
          className={`market-card ${selected === m.symbol ? "selected" : ""}`}
          onClick={() => onSelect(m.symbol)}
        >
          <div className="market-card-top">
            <span className="ticker-mark" style={{ color: m.color }}>
              {m.symbol.slice(0, 1)}
            </span>
            <b>{m.symbol}</b>
            <span className={m.change > 0 ? "positive" : "negative"}>
              {m.change > 0 ? "+" : ""}
              {m.change}%
            </span>
          </div>
          <div className="market-card-bottom">
            <strong>${quote(m.symbol, tick).price.toFixed(2)}</strong>
            <PriceChart seed={i * 42 + 7} compact negative={m.change < 0} />
          </div>
        </button>
      ))}
    </div>
  );
}
