# Python strategies

Algorithms live separately from the exchange. No third-party dependencies are needed for the initial experiment.

Requires Python 3.11+. From this folder:

```sh
python -m tradelab
python -m unittest discover -s tests -v
```

`tradelab/strategy.py` contains `MovingAverageCrossover`: provide one price at a time and receive `buy`, `sell`, or `None`. It warms up the slow window, remembers the previous nonzero fast/slow direction, and emits only when that direction changes.

`tradelab/__main__.py` supplies synthetic prices and prints signals. It does not submit orders. The algorithm has no exchange imports or network calls. The separate `client.py` adapter can submit orders to the Go gateway. Risk-aware sizing and an automated strategy runner are still future work.

To try the connected backend after starting the gateway:

```sh
python -m tradelab.exchange_demo
```

This demo places a resting sell, submits a market buy, and cancels the remainder. It uses virtual exchange orders, not a broker. Use a fresh backend session. `GatewayClient` accepts integer-cent prices and does not retry uncertain submissions automatically. See [API.md](../docs/API.md).

Experiment: change the fast/slow windows and observe when signals change. This demo has no return calculation and makes no claim about profitability.
