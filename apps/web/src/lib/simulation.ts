export type Side = "buy" | "sell";
export type OrderRequest = {
  side: Side;
  type: "market" | "limit";
  quantity: number;
  limit: number;
};
export type PaperOrder = {
  id: string;
  symbol: string;
  side: Side;
  type: "market" | "limit";
  price: number;
  quantity: number;
  status: "Filled" | "Open" | "Cancelled";
  time: string;
};
export type Market = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: string;
  color: string;
};
export const markets: Market[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 228.42,
    change: 1.24,
    volume: "42.8M",
    color: "#d0d5dd",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 132.65,
    change: 2.86,
    volume: "186.2M",
    color: "#b9f56b",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 425.52,
    change: 0.78,
    volume: "18.4M",
    color: "#89baf6",
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    price: 248.5,
    change: -1.32,
    volume: "67.1M",
    color: "#ee9b87",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com, Inc.",
    price: 192.73,
    change: 0.64,
    volume: "28.6M",
    color: "#f1c885",
  },
];
// Deterministic, synthetic series. Never sourced from an exchange.
export function series(seed: number, count = 72) {
  let state = seed >>> 0;
  let value = 0;
  return Array.from({ length: count }, (_, i) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    value += (state / 4294967296 - 0.46) * 1.8;
    return value + i * 0.045;
  });
}
export function validateOrder(quantity: number, price: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000)
    return "Enter a whole quantity between 1 and 10,000.";
  if (!Number.isFinite(price) || price < 0.01 || price > 1000000)
    return "Enter a price between $0.01 and $1,000,000.";
  return null;
}
export function orderCanFill(side: Side, limit: number, bid: number, ask: number) {
  return side === "buy" ? limit >= ask : limit <= bid;
}
export function executeOrder(
  order: PaperOrder,
  account: { cash: number; positions: Record<string, number> },
) {
  const held = account.positions[order.symbol] ?? 0;
  const cents = Math.round(order.price * 100) * order.quantity;
  const cashCents = Math.round(account.cash * 100);
  if (order.side === "buy" && cents > cashCents)
    return { error: "Insufficient paper buying power." };
  if (order.side === "sell" && order.quantity > held)
    return { error: "Not enough shares. Short selling is not enabled." };
  return {
    cash: (cashCents + (order.side === "buy" ? -cents : cents)) / 100,
    positions: {
      ...account.positions,
      [order.symbol]: held + (order.side === "buy" ? order.quantity : -order.quantity),
    },
  };
}
