"""Python -> real Go HTTP server -> real per-symbol C++ engines."""

import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import unittest

from tradelab.client import GatewayClient, GatewayError


@unittest.skipUnless(os.environ.get("GATEWAY_TEST_PATH") and os.environ.get("ENGINE_TEST_PATH"),
                     "run python scripts/check_backend.py to build and test the complete backend")
class BackendIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.log = tempfile.TemporaryFile()
        cls.addClassCleanup(cls.log.close)
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            port = listener.getsockname()[1]
        env = dict(os.environ, ENGINE_PATH=str(Path(os.environ["ENGINE_TEST_PATH"]).resolve()),
                   GATEWAY_ADDR=f"127.0.0.1:{port}")
        cls.process = subprocess.Popen([str(Path(os.environ["GATEWAY_TEST_PATH"]).resolve())],
                                       env=env, stdout=cls.log, stderr=cls.log)
        cls.addClassCleanup(cls.stop_gateway)
        cls.client = GatewayClient(f"http://127.0.0.1:{port}", timeout=2)
        for _ in range(100):
            if cls.process.poll() is not None:
                cls.log.seek(0)
                raise RuntimeError(cls.log.read().decode(errors="replace"))
            try:
                if cls.client.ready()["status"] == "ready":
                    return
            except (OSError, GatewayError):
                pass
            time.sleep(0.05)
        raise RuntimeError("Gateway did not become ready")

    @classmethod
    def stop_gateway(cls):
        cls.process.terminate()
        try:
            cls.process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            cls.process.kill()
            cls.process.wait(timeout=5)

    def test_python_order_fills_in_cpp_and_cancellation_removes_remainder(self):
        opened = self.client.submit(order_id="python-ask", symbol="MSFT", side="sell",
                                    price_cents=42552, quantity=10)
        self.assertEqual(opened["remaining_quantity"], 10)
        filled = self.client.submit(order_id="python-buy", symbol="MSFT", side="buy", quantity=6)
        self.assertEqual(filled["status"], "filled")
        self.assertEqual(filled["filled_quantity"], 6)
        self.assertEqual(filled["trades"], [{"maker_id": "python-ask", "taker_id": "python-buy",
                                            "price_cents": 42552, "quantity": 6}])
        cancelled = self.client.cancel("MSFT", "python-ask")
        self.assertEqual(cancelled["cancelled_quantity"], 4)
        empty = self.client.submit(order_id="python-empty", symbol="MSFT", side="buy", quantity=1)
        self.assertEqual(empty["cancelled_quantity"], 1)
        self.assertEqual(empty["filled_quantity"], 0)

    def test_duplicate_rejection_does_not_add_liquidity(self):
        order = dict(order_id="duplicate", symbol="TSLA", side="sell", price_cents=100, quantity=2)
        self.client.submit(**order)
        with self.assertRaises(GatewayError) as result:
            self.client.submit(**order)
        self.assertEqual(result.exception.status, 409)
        self.assertEqual(result.exception.detail, "duplicate_order_id")
        filled = self.client.submit(order_id="duplicate-check", symbol="TSLA", side="buy", quantity=4)
        self.assertEqual(filled["filled_quantity"], 2)
        self.assertEqual(filled["cancelled_quantity"], 2)

    def test_invalid_requests_and_unknown_cancellations_are_explicit(self):
        with self.assertRaises(GatewayError) as bad:
            self.client.submit(order_id="bad", symbol="AAPL", side="buy", quantity=-1)
        self.assertEqual(bad.exception.status, 400)
        with self.assertRaises(GatewayError) as missing:
            self.client.cancel("AAPL", "missing")
        self.assertEqual(missing.exception.status, 404)


if __name__ == "__main__":
    unittest.main()
