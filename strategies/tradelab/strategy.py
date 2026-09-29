"""A deliberately small, dependency-free moving average crossover strategy."""

from collections import deque
from math import isfinite
from statistics import fmean


class MovingAverageCrossover:
    """Emit a signal only when fast/slow ordering changes after warm-up.

    Feed one completed price observation at a time; never future observations.
    The strategy knows nothing about exchange internals or account balances.
    """

    def __init__(self, fast: int = 5, slow: int = 20):
        if not 0 < fast < slow:
            raise ValueError("Windows must satisfy 0 < fast < slow")
        self.fast = fast
        self.prices: deque[float] = deque(maxlen=slow)
        self.previous_direction: int | None = None

    def update(self, price: float) -> str | None:
        if not isfinite(price) or price <= 0:
            raise ValueError("Price must be positive and finite")
        self.prices.append(price)
        if len(self.prices) < self.prices.maxlen:
            return None
        difference = fmean(list(self.prices)[-self.fast:]) - fmean(self.prices)
        if difference == 0:
            return None
        direction = 1 if difference > 0 else -1
        signal = None
        if self.previous_direction is not None and direction != self.previous_direction:
            signal = "buy" if direction > 0 else "sell"
        self.previous_direction = direction
        return signal
