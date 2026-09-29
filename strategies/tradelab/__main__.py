"""Run an offline signal experiment: python -m tradelab."""

import json
from math import sin

from .strategy import MovingAverageCrossover


def main() -> None:
    strategy = MovingAverageCrossover()
    print("TradeLab · synthetic price experiment · no orders submitted")
    for tick in range(100):
        price = round(100 + sin(tick / 5) * 3 + tick * 0.01, 2)
        signal = strategy.update(price)
        if signal:
            print(json.dumps({"tick": tick, "symbol": "AAPL", "price": price, "signal": signal}))


if __name__ == "__main__":
    main()
