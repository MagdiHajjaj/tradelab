# Go gateway

The HTTP front door to five independent C++ matching engines. Uses only Go's standard library.

## Run

Requires Go 1.26+ and a built `engine_server`. From the repository root, `python scripts/check_backend.py` builds and tests the whole backend. See [API.md](../../docs/API.md) for platform-specific startup commands.

Set `ENGINE_PATH` to the absolute engine executable path, then run `go run ./cmd/gateway` from this folder. The gateway handshakes with all five children before opening its HTTP port; a missing or broken executable fails startup. The default address is `127.0.0.1:8080`; override it with `GATEWAY_ADDR`.

| Route                             | Behavior                                                   |
| --------------------------------- | ---------------------------------------------------------- |
| `GET /healthz`                    | HTTP process liveness                                      |
| `GET /readyz`                     | All five engine sessions must be available                 |
| `GET /v1/markets`                 | Supported symbol metadata                                  |
| `POST /v1/orders`                 | Submit market or limit orders and return execution reports |
| `DELETE /v1/orders/{symbol}/{id}` | Cancel resting quantity                                    |

## Read the code

- `cmd/gateway/main.go`: startup, signal handling, and shutdown.
- `internal/exchange/contracts.go`: public types, validation, and the router interface.
- `internal/api/handler.go`: HTTP decoding and response codes.
- `internal/engine/manager.go`: one engine process per symbol.
- `internal/engine/process.go`: bounded replies, sequential pipe access, and failure handling.

`go test ./...` runs unit tests. Set `ENGINE_TEST_PATH` to the built engine executable to include real process and HTTP integration tests. `go test -race ./...` also checks concurrent access (requires a supported CGO compiler). `go vet ./...` checks common mistakes. The root verification script sets the paths for you.

Engine failures invalidate a session instead of restarting an empty book. Restarting the gateway resets every book. WebSockets, persistence, backend account/risk checks, authentication, and browser integration are not implemented yet.
