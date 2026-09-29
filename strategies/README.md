# Python strategies

Algorithms live separately from the exchange. No third-party dependencies are needed for the initial experiment.

Requires Python 3.11+. From this folder:

```sh
python -m tradelab
python -m unittest discover -s tests -v
```

`tradelab/strategy.py` contains `MovingAverageCrossover`: provide one price at a time and receive `buy`, `sell`, or `None`. It warms up the slow window, remembers the previous nonzero fast/slow direction, and emits only when that direction changes.

`tradelab/__main__.py` supplies synthetic prices and prints signals. It does not submit orders. The algorithm has no exchange imports or network calls. A gateway adapter and risk-aware sizing will be added after the order API is connected.

Experiment: change the fast/slow windows and observe when signals change. This demo has no return calculation and makes no claim about profitability.
