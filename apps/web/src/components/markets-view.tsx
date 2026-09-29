import { useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import { markets } from "@/lib/simulation";
import { quote } from "@/lib/paper-exchange";
import { PriceChart } from "./price-chart";

export function MarketsView({
  tick,
  onSelect,
}: {
  tick: number;
  onSelect: (symbol: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = markets.filter((m) =>
    `${m.symbol} ${m.name}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="panel markets-view">
      <div className="panel-title">
        <h2>
          Explore markets <span className="small-label">SYNTHETIC</span>
        </h2>
        <label className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbols…"
            aria-label="Search markets"
          />
        </label>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Price</th>
              <th>Sample change</th>
              <th>Sample volume</th>
              <th>Trend</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.symbol}>
                <td>
                  <b>{m.symbol}</b>
                  <small className="company-name">{m.name}</small>
                </td>
                <td>${quote(m.symbol, tick).price.toFixed(2)}</td>
                <td className={m.change > 0 ? "positive" : "negative"}>
                  {m.change > 0 ? "+" : ""}
                  {m.change}%
                </td>
                <td>{m.volume}</td>
                <td>
                  <PriceChart seed={i * 42 + 7} compact negative={m.change < 0} />
                </td>
                <td>
                  <button className="secondary-button" onClick={() => onSelect(m.symbol)}>
                    Trade <ArrowUpRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && <p className="empty-search">No markets found for “{query}”.</p>}
    </section>
  );
}
