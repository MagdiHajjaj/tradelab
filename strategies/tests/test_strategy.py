import unittest

from tradelab.strategy import MovingAverageCrossover


class CrossoverTests(unittest.TestCase):
    def test_warmup_and_changes_only(self):
        strategy = MovingAverageCrossover(fast=2, slow=3)
        signals = [strategy.update(price) for price in [3, 2, 1, 2, 3, 4, 3, 2]]
        self.assertEqual(signals, [None, None, None, None, "buy", None, None, "sell"])

    def test_flat_market_does_not_emit_signals(self):
        strategy = MovingAverageCrossover(2, 3)
        self.assertTrue(all(strategy.update(100) is None for _ in range(20)))

    def test_rejects_bad_input(self):
        with self.assertRaises(ValueError):
            MovingAverageCrossover(5, 2)
        for price in [0, -1, float("nan"), float("inf")]:
            with self.assertRaises(ValueError):
                MovingAverageCrossover().update(price)


if __name__ == "__main__":
    unittest.main()
