import {
  executeOrder,
  markets,
  orderCanFill,
  validateOrder,
  type PaperOrder,
  type OrderRequest,
} from "./simulation";

export type ExchangeState = {
  tick: number;
  cash: number;
  positions: Record<string, number>;
  orders: PaperOrder[];
};
export const initialExchange: ExchangeState = { tick: 0, cash: 100000, positions: {}, orders: [] };
export function quote(symbol: string, tick: number) {
  const base = markets.find((m) => m.symbol === symbol)!;
  return { ...base, price: Math.round((base.price + Math.sin(tick / 5) * 0.18) * 100) / 100 };
}
export function createOrder(
  state: ExchangeState,
  symbol: string,
  request: OrderRequest,
): { order?: PaperOrder; error?: string } {
  const market = quote(symbol, state.tick);
  const bid = Math.round((market.price - 0.01) * 100) / 100;
  const ask = Math.round((market.price + 0.01) * 100) / 100;
  const validation = validateOrder(request.quantity, request.limit);
  if (validation) return { error: validation };
  const filled = request.type === "market" || orderCanFill(request.side, request.limit, bid, ask);
  const price = filled ? (request.side === "buy" ? ask : bid) : request.limit;
  const order: PaperOrder = {
    id: crypto.randomUUID(),
    symbol,
    side: request.side,
    type: request.type,
    quantity: request.quantity,
    price,
    status: filled ? "Filled" : "Open",
    time: new Date().toLocaleTimeString("en-GB"),
  };
  const result = executeOrder(order, state);
  return result.error ? { error: result.error } : { order };
}
// Pure reducer: all account mutations live here, separate from the interface.
export function exchangeReducer(
  state: ExchangeState,
  action: { type: "tick" } | { type: "submit"; order: PaperOrder } | { type: "cancel"; id: string },
): ExchangeState {
  if (action.type === "cancel")
    return {
      ...state,
      orders: state.orders.map((o) =>
        o.id === action.id && o.status === "Open" ? { ...o, status: "Cancelled" } : o,
      ),
    };
  if (action.type === "submit") {
    if (action.order.status === "Open")
      return { ...state, orders: [action.order, ...state.orders] };
    const fill = executeOrder(action.order, state);
    if (fill.error) return state;
    return {
      ...state,
      cash: fill.cash!,
      positions: fill.positions!,
      orders: [action.order, ...state.orders],
    };
  }
  let next = { ...state, tick: state.tick + 1 };
  // Process oldest orders first, checking funds again when an order executes.
  const orders = [...state.orders]
    .reverse()
    .map((order) => {
      if (order.status !== "Open") return order;
      const market = quote(order.symbol, next.tick);
      const bid = Math.round((market.price - 0.01) * 100) / 100;
      const ask = Math.round((market.price + 0.01) * 100) / 100;
      if (!orderCanFill(order.side, order.price, bid, ask)) return order;
      const filled: PaperOrder = {
        ...order,
        price: order.side === "buy" ? ask : bid,
        status: "Filled",
      };
      const result = executeOrder(filled, next);
      if (result.error) return { ...order, status: "Cancelled" as const };
      next = { ...next, cash: result.cash!, positions: result.positions! };
      return filled;
    })
    .reverse();
  return { ...next, orders };
}
