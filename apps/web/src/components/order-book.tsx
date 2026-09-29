import { ListFilter } from "lucide-react";
import type { Market } from "@/lib/simulation";

export function OrderBook({ market, tick }: { market: Market; tick: number }) {
  const rows = Array.from({ length: 6 }, (_, i) => ({
    size: 100 + ((i * 137 + tick * 31) % 690),
    gap: i + 1,
  }));
  return (
    <section className="panel order-book">
      <div className="panel-title">
        <h2>Order book</h2>
        <ListFilter size={15} className="muted" />
      </div>
      <div className="book-row book-heading">
        <span>Price (USD)</span>
        <span>Size</span>
        <span>Total</span>
      </div>
      {[...rows].reverse().map((r, i) => (
        <div className="book-row ask" key={r.gap}>
          <div className="depth" style={{ width: `${25 + i * 12}%` }} />
          <span>{(market.price + r.gap * 0.01).toFixed(2)}</span>
          <span>{r.size}</span>
          <span>
            {rows
              .slice(0, r.gap)
              .reduce((a, b) => a + b.size, 0)
              .toLocaleString()}
          </span>
        </div>
      ))}
      <div className="spread">
        <strong>
          {market.price.toFixed(2)} <span>↑</span>
        </strong>
        <span>
          Spread <b>$0.02</b>
        </span>
      </div>
      {rows.map((r, i) => (
        <div className="book-row bid" key={r.gap}>
          <div className="depth" style={{ width: `${25 + i * 12}%` }} />
          <span>{(market.price - r.gap * 0.01).toFixed(2)}</span>
          <span>{r.size + 50}</span>
          <span>
            {rows
              .slice(0, r.gap)
              .reduce((a, b) => a + b.size + 50, 0)
              .toLocaleString()}
          </span>
        </div>
      ))}
      <div className="book-balance">
        <span>Buy 56%</span>
        <span>44% Sell</span>
      </div>
      <div className="balance-bar">
        <div />
      </div>
    </section>
  );
}
