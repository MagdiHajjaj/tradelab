# Learning roadmap

## 01 — Explore the workspace

- [x] Organize services and document how to read the code.
- [x] Build an interactive responsive paper-trading dashboard.
- [x] Add a repeatable web build and browser tests.

## 02 — Understand an exchange

- [x] Implement C++20 limit orders with price-time priority.
- [x] Test best price, FIFO, partial fills, cancellation, and invalid input.
- [x] Keep matching separate from quantitative algorithms.
- [x] Add market orders and explicit execution reports to the C++ core.

## 03 — Connect the system

- [x] Scaffold the Go gateway with health and market metadata.
- [x] Define versioned order and execution-report contracts (streaming events follow with WebSockets).
- [x] Manage independent C++ engines per symbol in Go.
- [x] Route orders and cancellations through the gateway.
- [x] Verify Python → Go → C++ fills, concurrent requests, and engine failure handling.
- [ ] Stream market and execution events with WebSockets.
- [ ] Connect the dashboard through a replaceable data adapter.

## 04 — Test a quantitative idea

- [x] Implement a dependency-free offline Python crossover strategy.
- [x] Add a Python gateway client and a connected exchange demo.
- [ ] Add position sizing and backend account/risk checks.
- [ ] Run reproducible backtests with fees, spread, and slippage.
- [ ] Add mean reversion and compare results against a baseline.

## 05 — Measure and harden

- [ ] Benchmark throughput and latency before optimizing.
- [ ] Add structured logs and trace an order across services.
- [ ] Add event persistence, deterministic replay, and recovery.
- [ ] Explore market making and inventory constraints.
- [ ] Study deployment and performance tradeoffs on Linux.

Each milestone should end with a working example, a test of its core behavior, and a short explanation of what you learned.
