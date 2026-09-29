"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown, ShieldCheck } from "lucide-react";
import { validateOrder, type Market, type Side, type OrderRequest } from "@/lib/simulation";

export function OrderTicket({
  market,
  cash,
  onSubmit,
}: {
  market: Market;
  cash: number;
  onSubmit: (request: OrderRequest) => string | null;
}) {
  const [side, setSide] = useState<Side>("buy");
  const [type, setType] = useState<"market" | "limit">("market");
  const [quantity, setQuantity] = useState("10");
  const [limit, setLimit] = useState(market.price.toFixed(2));
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const price = type === "limit" ? Number(limit) : market.price + (side === "buy" ? 0.01 : -0.01);
  const amount = Number(quantity) * price;
  return (
    <section className="panel order-ticket">
      <div className="panel-title">
        <h2>Order entry</h2>
        <span className="small-label">PAPER</span>
      </div>
      <div className="segmented side-toggle">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            className={side === s ? `selected ${s}` : ""}
            onClick={() => {
              setSide(s);
              setMessage("");
            }}
          >
            {s === "buy" ? "Buy / Long" : "Sell"}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const validation = validateOrder(Number(quantity), price);
          const result =
            validation ??
            onSubmit({
              side,
              type,
              quantity: Number(quantity),
              limit: Math.round(price * 100) / 100,
            });
          setError(!!result);
          setMessage(
            result ??
              `${side === "buy" ? "Buy" : "Sell"} order submitted for ${quantity} ${market.symbol}.`,
          );
        }}
      >
        <label className="field-label" htmlFor="order-type">
          Order type
        </label>
        <div className="select-wrap">
          <select
            id="order-type"
            value={type}
            onChange={(e) => setType(e.target.value as "market" | "limit")}
          >
            <option value="market">Market order</option>
            <option value="limit">Limit order</option>
          </select>
          <ChevronDown size={14} />
        </div>
        <label className="field-label" htmlFor="quantity">
          Quantity <span>Shares</span>
        </label>
        <div className="input-wrap">
          <input
            id="quantity"
            type="number"
            min="1"
            max="10000"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
          <span>{market.symbol}</span>
        </div>
        {type === "limit" && (
          <>
            <label className="field-label" htmlFor="limit-price">
              Limit price
            </label>
            <div className="input-wrap">
              <input
                id="limit-price"
                type="number"
                min="0.01"
                max="1000000"
                step="0.01"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                required
              />
              <span>USD</span>
            </div>
          </>
        )}
        <div className="quick-quantities">
          {[10, 25, 50, 100].map((q) => (
            <button type="button" key={q} onClick={() => setQuantity(String(q))}>
              {q}
            </button>
          ))}
        </div>
        <div className="order-summary">
          <div>
            <span>Estimated price</span>
            <b>${Number.isFinite(price) ? price.toFixed(2) : "—"}</b>
          </div>
          <div>
            <span>Estimated total</span>
            <strong>
              $
              {Number.isFinite(amount)
                ? amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "—"}
            </strong>
          </div>
        </div>
        <button className={`submit-order ${side}`} type="submit">
          {side === "buy" ? "Buy" : "Sell"} {market.symbol}
          <ArrowUpRight size={17} />
        </button>
        {message && (
          <p role="status" className={`form-message ${error ? "negative" : "positive"}`}>
            {message}
          </p>
        )}
      </form>
      <div className="buying-power">
        <span>Buying power</span>
        <b>
          ${cash.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </b>
      </div>
      <p className="paper-note">
        <ShieldCheck size={13} /> Paper account · No broker connected
      </p>
    </section>
  );
}
