package engine

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"tradelab/gateway/internal/exchange"
)

func realManager(t *testing.T) *Manager {
	t.Helper()
	path := os.Getenv("ENGINE_TEST_PATH")
	if path == "" {
		t.Skip("set ENGINE_TEST_PATH to run process lifecycle tests")
	}
	manager, err := NewManager(path)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(manager.Close)
	return manager
}

func TestMissingExecutableFailsStartup(t *testing.T) {
	_, err := NewManager("definitely-not-a-tradelab-engine")
	if err == nil {
		t.Fatal("missing binary must not yield a ready manager")
	}
}

func TestEngineExitFailsClosedAndKeepsOtherSymbolsAlive(t *testing.T) {
	manager := realManager(t)
	if !manager.Ready() {
		t.Fatal("expected all five engines ready")
	}
	failed := manager.processes["AAPL"]
	if err := failed.cmd.Process.Kill(); err != nil {
		t.Fatal(err)
	}
	select {
	case <-failed.exited:
	case <-time.After(3 * time.Second):
		t.Fatal("engine was not reaped")
	}
	if manager.Ready() {
		t.Fatal("dead engine must fail readiness")
	}
	order := exchange.Order{ID: "one", Symbol: "AAPL", Side: "buy", Type: "limit", PriceCents: 100, Quantity: 1}
	if _, err := manager.Submit(context.Background(), order); !errors.Is(err, exchange.ErrUnavailable) {
		t.Fatalf("got %v", err)
	}
	order.Symbol = "NVDA"
	if report, err := manager.Submit(context.Background(), order); err != nil || !report.OK {
		t.Fatalf("healthy symbol failed: %v %+v", err, report)
	}
}

func TestCancelledRequestDoesNotEnterBook(t *testing.T) {
	manager := realManager(t)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	order := exchange.Order{ID: "cancelled-request", Symbol: "AAPL", Side: "buy", Type: "limit", PriceCents: 100, Quantity: 1}
	if _, err := manager.Submit(ctx, order); !errors.Is(err, context.Canceled) {
		t.Fatalf("got %v", err)
	}
	if report, err := manager.Submit(context.Background(), order); err != nil || !report.OK {
		t.Fatalf("cancelled request consumed id: %v %+v", err, report)
	}
}

func TestMalformedProtocolDoesNotDesynchronizeReplies(t *testing.T) {
	manager := realManager(t)
	process := manager.processes["AAPL"]
	report, err := process.request(context.Background(), "v1\tSUBMIT\tbad\tbuy\tlimit\t100\t1\textra\n")
	if err != nil || report.OK || report.Error != "invalid_order" {
		t.Fatalf("expected protocol rejection: %v %+v", err, report)
	}
	order := exchange.Order{ID: "bad", Symbol: "AAPL", Side: "buy", Type: "limit", PriceCents: 100, Quantity: 1}
	accepted, err := manager.Submit(context.Background(), order)
	if err != nil || !accepted.OK || accepted.Sequence != report.Sequence+1 {
		t.Fatalf("malformed input consumed ID or broke sequencing: %v %+v", err, accepted)
	}
}

func TestDispatchedTimeoutInvalidatesSession(t *testing.T) {
	manager := realManager(t)
	process := manager.processes["AAPL"]
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()
	// Omit the newline to simulate a child that never returns a complete reply.
	_, err := process.request(ctx, "v1\tPING")
	if !errors.Is(err, exchange.ErrUnavailable) {
		t.Fatalf("got %v", err)
	}
	if process.ready() || manager.Ready() {
		t.Fatal("timed-out session must not accept later orders")
	}
	select {
	case <-process.exited:
	case <-time.After(3 * time.Second):
		t.Fatal("timed-out process was not reaped")
	}
}
