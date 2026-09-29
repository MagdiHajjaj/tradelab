import { Download, Inbox } from "lucide-react";
import type { PaperOrder } from "@/lib/simulation";

export function OrdersTable({
  orders,
  tab,
  setTab,
  onCancel,
}: {
  orders: PaperOrder[];
  tab: string;
  setTab: (tab: string) => void;
  onCancel: (id: string) => void;
}) {
  const visible = orders.filter(
    (o) =>
      tab === "All orders" || (tab === "Open orders" ? o.status === "Open" : o.status === "Filled"),
  );
  const exportOrders = () => {
    const csv = [
      "id,symbol,side,type,price,quantity,status,time",
      ...orders.map((o) =>
        [o.id, o.symbol, o.side, o.type, o.price.toFixed(2), o.quantity, o.status, o.time].join(
          ",",
        ),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "tradelab-paper-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="panel orders-panel">
      <div className="orders-header">
        <div className="table-tabs">
          {["All orders", "Open orders", "Filled"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? "active" : ""}>
              {t}
              {t === "All orders" && <span>{orders.length}</span>}
            </button>
          ))}
        </div>
        <button className="export-button" onClick={exportOrders}>
          <Download size={13} />
          Export CSV
        </button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Side</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Status</th>
              <th>Time</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => (
              <tr key={o.id}>
                <td className="symbol-cell">{o.symbol}</td>
                <td className={o.side === "buy" ? "positive" : "negative"}>
                  {o.side.toUpperCase()}
                </td>
                <td className="capitalize">{o.type}</td>
                <td>{o.quantity}</td>
                <td>${o.price.toFixed(2)}</td>
                <td>
                  <span className={`order-status ${o.status.toLowerCase()}`}>{o.status}</span>
                </td>
                <td className="muted">{o.time}</td>
                <td>
                  {o.status === "Open" && (
                    <button className="cancel-button" onClick={() => onCancel(o.id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length === 0 && (
        <div className="empty-orders">
          <Inbox size={22} />
          <div>
            <b>
              {tab === "Filled"
                ? "Your executions will appear here"
                : tab === "Open orders"
                  ? "No resting orders"
                  : "Your first trade starts here"}
            </b>
            <p>Use the order ticket to explore the simulated exchange.</p>
          </div>
          <span className="keyboard-hint">100% paper trading</span>
        </div>
      )}
    </section>
  );
}
