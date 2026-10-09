"""Submit real simulated-exchange orders through Go into C++.

Run against a fresh gateway: python -m tradelab.exchange_demo
This demonstrates transport and fills, not strategy profitability or account risk.
"""

import argparse
import json
from uuid import uuid4

from .client import GatewayClient


def run(base_url: str) -> list[dict]:
    client = GatewayClient(base_url)
    client.ready()
    prefix = uuid4().hex[:12]
    reports = [
        client.submit(order_id=f"{prefix}-ask", symbol="AAPL", side="sell", quantity=5, price_cents=22842),
        client.submit(order_id=f"{prefix}-buy", symbol="AAPL", side="buy", quantity=3),
        client.cancel("AAPL", f"{prefix}-ask"),
    ]
    for report in reports:
        print(json.dumps(report))
    return reports


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gateway", default="http://127.0.0.1:8080")
    run(parser.parse_args().gateway)
