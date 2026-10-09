package api_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"sync"
	"testing"

	"tradelab/gateway/internal/api"
	"tradelab/gateway/internal/engine"
	"tradelab/gateway/internal/exchange"
)

func connectedServer(t *testing.T) *httptest.Server {
	t.Helper()
	path := os.Getenv("ENGINE_TEST_PATH")
	if path == "" {
		t.Skip("set ENGINE_TEST_PATH to run real C++ integration tests")
	}
	manager, err := engine.NewManager(path)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(manager.Close)
	server := httptest.NewServer(api.NewHandler(manager))
	t.Cleanup(server.Close)
	return server
}

func send(t *testing.T, server *httptest.Server, method, path string, order any, expected int) exchange.Report {
	t.Helper()
	body, _ := json.Marshal(order)
	request, err := http.NewRequest(method, server.URL+path, bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	response, err := server.Client().Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	var report exchange.Report
	if err := json.NewDecoder(response.Body).Decode(&report); err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != expected {
		t.Fatalf("%s %s: expected %d, got %d: %+v", method, path, expected, response.StatusCode, report)
	}
	return report
}

func TestIntegrationHTTPTradeFlow(t *testing.T) {
	server := connectedServer(t)
	maker := exchange.Order{ID: "maker", Symbol: "AAPL", Side: "sell", Type: "limit", PriceCents: 100, Quantity: 5}
	opened := send(t, server, "POST", "/v1/orders", maker, http.StatusCreated)
	if opened.Status != "open" || opened.RemainingQuantity != 5 {
		t.Fatalf("wrong resting report: %+v", opened)
	}
	// Same ID is allowed in another symbol; books and seen-ID sets are isolated.
	maker.Symbol = "NVDA"
	send(t, server, "POST", "/v1/orders", maker, http.StatusCreated)
	maker.Symbol = "AAPL"
	send(t, server, "POST", "/v1/orders", maker, http.StatusConflict)
	taker := exchange.Order{ID: "taker", Symbol: "AAPL", Side: "buy", Type: "market", Quantity: 8}
	filled := send(t, server, "POST", "/v1/orders", taker, http.StatusCreated)
	if filled.Status != "cancelled" || filled.FilledQuantity != 5 || filled.CancelledQuantity != 3 || filled.RemainingQuantity != 0 || len(filled.Trades) != 1 {
		t.Fatalf("incorrect IOC report: %+v", filled)
	}
	if filled.Trades[0].PriceCents != 100 || filled.Trades[0].MakerID != "maker" || filled.Sequence <= opened.Sequence {
		t.Fatalf("incorrect execution details: %+v", filled)
	}
	cancelled := send(t, server, "DELETE", "/v1/orders/NVDA/maker", nil, http.StatusOK)
	if cancelled.CancelledQuantity != 5 {
		t.Fatalf("cross-symbol state leak: %+v", cancelled)
	}
	send(t, server, "DELETE", "/v1/orders/NVDA/maker", nil, http.StatusNotFound)
	send(t, server, "DELETE", "/v1/orders/UNKNOWN/maker", nil, http.StatusBadRequest)
}

func TestIntegrationConcurrentOrdersDoNotOverfill(t *testing.T) {
	server := connectedServer(t)
	send(t, server, "POST", "/v1/orders", exchange.Order{ID: "liquidity", Symbol: "AAPL", Side: "sell", Type: "limit", PriceCents: 100, Quantity: 10}, http.StatusCreated)
	var workers sync.WaitGroup
	reports := make(chan exchange.Report, 20)
	failures := make(chan error, 20)
	for i := 0; i < 20; i++ {
		workers.Add(1)
		go func(i int) {
			defer workers.Done()
			order := exchange.Order{ID: fmt.Sprintf("buy-%d", i), Symbol: "AAPL", Side: "buy", Type: "market", Quantity: 1}
			data, _ := json.Marshal(order)
			response, err := server.Client().Post(server.URL+"/v1/orders", "application/json", bytes.NewReader(data))
			if err != nil {
				failures <- err
				return
			}
			defer response.Body.Close()
			var report exchange.Report
			if err = json.NewDecoder(response.Body).Decode(&report); err != nil {
				failures <- err
				return
			}
			if response.StatusCode != http.StatusCreated {
				failures <- fmt.Errorf("status %d", response.StatusCode)
				return
			}
			reports <- report
		}(i)
	}
	workers.Wait()
	close(reports)
	close(failures)
	for err := range failures {
		t.Error(err)
	}
	var filled, cancelled int64
	sequences := make(map[uint64]bool)
	for report := range reports {
		filled += report.FilledQuantity
		cancelled += report.CancelledQuantity
		if sequences[report.Sequence] {
			t.Error("duplicate reply sequence")
		}
		sequences[report.Sequence] = true
	}
	if filled != 10 || cancelled != 10 || len(sequences) != 20 {
		t.Fatalf("filled=%d cancelled=%d replies=%d", filled, cancelled, len(sequences))
	}
}
