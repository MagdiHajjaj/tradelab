# Start reading here

TradeLab is organized by **what each part is responsible for**. You can learn one language and one service at a time. There is no need to understand the whole repository before making a change.

## 1. Open the dashboard

Run `npm ci` and `npm run dev` from the repository root.

Read these files in order:

1. [`apps/web/src/app/page.tsx`](../apps/web/src/app/page.tsx) — the page entry. It renders the dashboard.
2. [`apps/web/src/components/dashboard.tsx`](../apps/web/src/components/dashboard.tsx) — connects navigation, session state, and the feature components.
3. [`apps/web/src/components/order-ticket.tsx`](../apps/web/src/components/order-ticket.tsx) — the form that turns a click into an order request.
4. [`apps/web/src/lib/paper-exchange.ts`](../apps/web/src/lib/paper-exchange.ts) — creates orders, processes ticks, and updates the account. This is the browser simulation, separate from the real C++ order book.
5. [`apps/web/src/lib/simulation.ts`](../apps/web/src/lib/simulation.ts) — shared types, sample markets, validation, and account arithmetic.

**Follow a buy:** order form → `createOrder()` → `exchangeReducer()` → `executeOrder()` → React renders the new cash, position, and activity row.

**Follow a limit order:** the reducer stores an open order → a timer dispatches a tick → the quote changes → the limit is checked → the account is checked → the order fills or is cancelled for insufficient funds/shares.

UI components receive data through props and report actions through callbacks. Domain logic under `lib/` does not import UI components. Tests sit beside the logic they explain.

## 2. Learn the actual matching rules

Open [`services/matching-engine/include/tradelab/order_book.hpp`](../services/matching-engine/include/tradelab/order_book.hpp). It defines the vocabulary: an order, a trade, and an order book.

Then read [`order_book.cpp`](../services/matching-engine/src/order_book.cpp):

1. `add()` validates an order and selects the opposite side of the book.
2. `match()` visits the best price first.
3. A deque keeps arrival order within each price level.
4. A trade uses the resting order's price and the smaller remaining quantity.
5. Any unfilled incoming quantity rests on the book.

Read the [tests](../services/matching-engine/tests/order_book_test.cpp) next. Each test demonstrates one rule with tiny numbers. Modify one example and predict the result before running it.

## 3. Find the service boundary

[`services/gateway/cmd/gateway/main.go`](../services/gateway/cmd/gateway/main.go) starts the server. [`internal/api/handler.go`](../services/gateway/internal/api/handler.go) defines its routes.

The gateway currently returns `501 engine_not_connected` for order requests. This is the next boundary to implement: route each symbol to its own C++ engine and publish resulting events over WebSockets. See the [architecture guide](ARCHITECTURE.md).

## 4. Try an algorithm separately

Read [`strategies/tradelab/strategy.py`](../strategies/tradelab/strategy.py). `update()` consumes one price and may emit `buy` or `sell`. It does not reach into the order book, alter balances, or know how the exchange works.

[`__main__.py`](../strategies/tradelab/__main__.py) supplies synthetic prices and prints signals. Later, a separate adapter can convert signals into gateway requests.

## Where do I change something?

| I want to…                                   | Start with…                                                      |
| -------------------------------------------- | ---------------------------------------------------------------- |
| Change colors, spacing, or responsive layout | `apps/web/src/app/globals.css` (numbered sections)               |
| Change the main navigation                   | `apps/web/src/components/navigation.tsx`                         |
| Change the chart                             | `apps/web/src/components/market-chart.tsx` and `price-chart.tsx` |
| Change order form behavior                   | `apps/web/src/components/order-ticket.tsx`                       |
| Change paper fills or account state          | `apps/web/src/lib/paper-exchange.ts`                             |
| Change sample symbols                        | `apps/web/src/lib/simulation.ts` and gateway market metadata     |
| Change exchange matching rules               | `services/matching-engine/src/order_book.cpp`                    |
| Add an HTTP route                            | `services/gateway/internal/api/handler.go`                       |
| Add a quantitative strategy                  | A new module under `strategies/tradelab/`                        |
| Change CI                                    | `.github/workflows/ci.yml`                                       |

## Small conventions

- `apps/` contains user-facing applications. `services/` contains independently runnable backend processes. `strategies/` contains algorithms and experiments.
- Use integer cents inside the C++ exchange; explain units in names such as `price_cents`.
- Keep algorithms independent of transport and UI. Prefer small functions with clear input and output.
- Add tests for behavioral rules, especially ordering, fills, and balance changes.
- Update the relevant service README when its run command, boundary, or capabilities change.
- New ideas go into the roadmap before they grow into a large abstraction.
