"""Small HTTP adapter. Strategies remain independent of this transport layer."""

import json
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


class GatewayError(Exception):
    def __init__(self, status: int, detail: str):
        super().__init__(f"Gateway returned HTTP {status}: {detail}")
        self.status = status
        self.detail = detail


class GatewayClient:
    def __init__(self, base_url: str = "http://127.0.0.1:8080", timeout: float = 5):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _request(self, method: str, path: str, payload: dict | None = None) -> dict:
        data = None if payload is None else json.dumps(payload, allow_nan=False).encode("utf-8")
        request = Request(self.base_url + path, data=data, method=method,
                          headers={"Content-Type": "application/json"})
        try:
            with urlopen(request, timeout=self.timeout) as response:
                return json.load(response)
        except HTTPError as error:
            with error:
                detail = json.load(error).get("error", "unknown_error")
            raise GatewayError(error.code, detail) from error
        # Never retry automatically: a timeout may occur after an execution.

    def ready(self) -> dict:
        return self._request("GET", "/readyz")

    def submit(self, *, order_id: str, symbol: str, side: str, quantity: int,
               price_cents: int | None = None) -> dict:
        return self._request("POST", "/v1/orders", {
            "id": order_id, "symbol": symbol, "side": side, "quantity": quantity,
            "type": "market" if price_cents is None else "limit",
            "price_cents": 0 if price_cents is None else price_cents,
        })

    def cancel(self, symbol: str, order_id: str) -> dict:
        return self._request("DELETE", f"/v1/orders/{quote(symbol, safe='')}/{quote(order_id, safe='')}")
