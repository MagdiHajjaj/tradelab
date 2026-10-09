# Backend API v1

The Go gateway starts one C++ process for each supported symbol: `AAPL`, `NVDA`, `MSFT`, `TSLA`, and `AMZN`. Books start empty. Python can submit orders through HTTP. The browser remains a separate paper simulation until the WebSocket/data-adapter milestone.

## Start and verify

From the repository root:

```sh
python scripts/check_backend.py
```

This builds both binaries, runs C++/Go/Python tests, then starts a temporary gateway and checks Python-to-C++ executions. It requires Go 1.26+, CMake 3.24+, Git, Python 3.11+, and a C++20 compiler. It also recognizes the portable tools already installed in this Windows workspace. The first CMake configure fetches Google Test if it is not cached.

Start a fresh exchange after verification, from the repository root on PowerShell:

```powershell
$env:ENGINE_PATH = (Resolve-Path 'build/engine/engine_server.exe').Path
$env:PATH = 'C:\msys64\ucrt64\bin;' + $env:PATH # Only for this workspace's MinGW compiler
./build/gateway.exe
```

For a Visual Studio build, use `build/engine/Debug/engine_server.exe` instead. On Linux:

```sh
ENGINE_PATH="$PWD/build/engine/engine_server" ./build/gateway
```

The gateway binds to `127.0.0.1:8080` by default. `GATEWAY_ADDR` changes the listening address. In another terminal:

```sh
cd strategies
python -m tradelab.exchange_demo
```

The demo rests five AAPL shares, buys three, then cancels the remaining two. Use a fresh gateway so unrelated resting liquidity cannot interfere with the example.

## HTTP routes

| Method and path                   | Result                                                               |
| --------------------------------- | -------------------------------------------------------------------- |
| `GET /healthz`                    | HTTP process liveness                                                |
| `GET /readyz`                     | 200 only while all five engine sessions are available; otherwise 503 |
| `GET /v1/markets`                 | Supported symbol metadata                                            |
| `POST /v1/orders`                 | Submit a limit or market order; returns an execution report          |
| `DELETE /v1/orders/{symbol}/{id}` | Cancel the remaining resting quantity                                |

### Submit a limit order

```json
{
  "id": "ask-001",
  "symbol": "AAPL",
  "side": "sell",
  "type": "limit",
  "price_cents": 22842,
  "quantity": 5
}
```

Use `type: "market"` and zero/omitted `price_cents` for a market order. Prices and quantities must be integers. Valid quantity is 1–1,000,000; a limit price is 1–100,000,000 cents. IDs contain 1–64 ASCII letters, digits, underscores, or hyphens. Unknown JSON fields, multiple JSON values, and bodies over 4 KiB are rejected.

An ID is unique within a symbol's engine lifetime, including after full execution or cancellation. Reusing it gives 409; it is not an idempotent replay mechanism.

### Execution report

Submitting a market buy for three shares against the resting example returns HTTP 201:

```json
{
  "version": 1,
  "sequence": 3,
  "symbol": "AAPL",
  "ok": true,
  "order_id": "buy-001",
  "status": "filled",
  "filled_quantity": 3,
  "remaining_quantity": 0,
  "cancelled_quantity": 0,
  "trades": [{ "maker_id": "ask-001", "taker_id": "buy-001", "price_cents": 22842, "quantity": 3 }]
}
```

Status describes the incoming order after processing:

- `open`: an unfilled limit order rests on the book.
- `partially_filled`: a limit order executed some quantity and its remainder rests.
- `filled`: the whole incoming quantity executed.
- `cancelled`: a cancellation removed resting quantity, or a market order's unfilled remainder was cancelled.

Market orders are **immediate-or-cancel**. A market order may have both positive `filled_quantity` and positive `cancelled_quantity`; its final status is `cancelled`. Read the quantities and trades, not just the status. A market order never rests. Prices are always the maker's resting prices.

Reports describe a single operation, not a persistent order-history record. A maker's fills appear in the taker's `trades` array. Cancellation reports contain only the quantity cancelled in that operation.

### Errors and sequencing

| HTTP status | Meaning                                                |
| ----------- | ------------------------------------------------------ |
| 400         | Invalid request, unknown symbol, or protocol rejection |
| 404         | No resting order with this ID on the selected symbol   |
| 409         | Duplicate order ID                                     |
| 503         | Engine unavailable or response uncertain               |

`sequence` increases per engine command, including the startup handshake and engine rejections. It is not global across symbols and resets when the gateway restarts. HTTP validation errors never enter an engine and have no sequence.

If a process dies, returns malformed output, or a dispatched request times out, that engine session becomes unavailable. The gateway does not silently restart an empty book or automatically retry an order. A 503 after dispatch can mean an order executed but its report was lost. Persistence and reconciliation are future work. Restarting the gateway resets every book.

## Private Go ↔ C++ transport

The transport is deliberately small: one tab-separated command line on stdin, one JSON report line on stdout. Gateway validation prevents tabs/newlines in IDs. The C++ parser independently validates commands. One request at a time owns each pipe; separate symbols can process concurrently.

```text
v1<TAB>PING
v1<TAB>SUBMIT<TAB>ask-001<TAB>sell<TAB>limit<TAB>22842<TAB>5
v1<TAB>CANCEL<TAB>ask-001
```

`<TAB>` represents an actual tab; terminate each command with a newline. Stdout is reserved for replies; diagnostics use stderr. Replies are limited to 4 MiB by the gateway; exceeding that limit invalidates the session instead of returning an incomplete execution report. The HTTP handler allows three seconds for an engine operation.

This is a local educational exchange: no authentication, brokerage connection, account balances, or pre-trade risk enforcement is implemented in the backend. Browser cash/position checks belong only to the isolated browser simulation. WebSockets, book snapshots, historical reports, persistence, and a strategy runner with risk limits remain future milestones.
