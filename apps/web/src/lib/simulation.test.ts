import assert from "node:assert/strict";
import { test } from "node:test";
import { executeOrder, orderCanFill, validateOrder, type PaperOrder } from "./simulation";
import { createOrder, exchangeReducer, initialExchange } from "./paper-exchange";

test("invalid quantities and non-finite prices are rejected", () => {
  for (const qty of [0, -1, 1.5, NaN, Infinity, 10001]) assert.ok(validateOrder(qty, 20));
  for (const price of [0, -1, NaN, Infinity, 1000001]) assert.ok(validateOrder(1, price));
  assert.equal(validateOrder(10, 228.42), null);
});
test("limit orders execute only when they cross the spread", () => {
  assert.equal(orderCanFill("buy", 100, 99, 101), false);
  assert.equal(orderCanFill("buy", 101, 99, 101), true);
  assert.equal(orderCanFill("sell", 100, 99, 101), false);
  assert.equal(orderCanFill("sell", 99, 99, 101), true);
});
test("fills conserve cash and shares and reject overspending and naked sells", () => {
  const order: PaperOrder = {
    id: "1",
    symbol: "AAPL",
    side: "buy",
    type: "market",
    price: 0.1,
    quantity: 3,
    status: "Filled",
    time: "12:00",
  };
  const result = executeOrder(order, { cash: 100, positions: {} });
  assert.deepEqual(result, { cash: 99.7, positions: { AAPL: 3 } });
  assert.ok(executeOrder({ ...order, quantity: 10000 }, { cash: 10, positions: {} }).error);
  assert.ok(executeOrder({ ...order, side: "sell" }, { cash: 100, positions: {} }).error);
  assert.deepEqual(
    executeOrder(
      { ...order, side: "sell" },
      result as { cash: number; positions: Record<string, number> },
    ),
    { cash: 100, positions: { AAPL: 0 } },
  );
});

test("a resting sell fills when the synthetic bid reaches its limit", () => {
  const state = { ...initialExchange, positions: { AAPL: 10 } };
  const result = createOrder(state, "AAPL", {
    side: "sell",
    type: "limit",
    quantity: 5,
    limit: 228.44,
  });
  assert.equal(result.order?.status, "Open");
  const submitted = exchangeReducer(state, { type: "submit", order: result.order! });
  const next = exchangeReducer(submitted, { type: "tick" });
  assert.equal(next.orders[0].status, "Filled");
  assert.equal(next.positions.AAPL, 5);
  assert.equal(next.cash, 101142.25);
});

test("resting orders cannot oversell when several become executable on the same tick", () => {
  const state = { ...initialExchange, positions: { AAPL: 5 } };
  const request = { side: "sell" as const, type: "limit" as const, quantity: 5, limit: 228.44 };
  const first = createOrder(state, "AAPL", request).order!;
  const submitted = exchangeReducer(state, { type: "submit", order: first });
  const second = createOrder(submitted, "AAPL", request).order!;
  const next = exchangeReducer(exchangeReducer(submitted, { type: "submit", order: second }), {
    type: "tick",
  });
  assert.equal(next.positions.AAPL, 0);
  assert.equal(next.orders.find((o) => o.id === first.id)?.status, "Filled");
  assert.equal(next.orders.find((o) => o.id === second.id)?.status, "Cancelled");
});
