# Go gateway

The future front door to independent C++ matching engines. The initial HTTP service uses only Go's standard library.

Requires Go 1.26+. From this folder:

```sh
go run ./cmd/gateway
go test ./...
go vet ./...
```

The default address is `127.0.0.1:8080`. Override it with `GATEWAY_ADDR`; Docker sets `:8080` inside its container.

| Route             | Behavior                                  |
| ----------------- | ----------------------------------------- |
| `GET /healthz`    | Process health and `mode: scaffold`       |
| `GET /v1/markets` | Supported symbol metadata                 |
| `POST /v1/orders` | HTTP 501 until C++ routing is implemented |

`cmd/gateway/main.go` configures the server. `internal/api/handler.go` owns routing and JSON responses. Tests use `httptest` without opening ports.

Next: versioned contracts, per-symbol C++ process management, order routing, and WebSocket subscriptions. A healthy gateway currently means the HTTP process is healthy, not that a matching engine is connected.
