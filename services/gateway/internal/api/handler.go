// Package api owns HTTP endpoints. Matching belongs in the separate C++ service.
package api

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"

	"tradelab/gateway/internal/exchange"
)

type Market struct {
	Symbol string `json:"symbol"`
	Name   string `json:"name"`
}

func NewHandler(router exchange.Router) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "gateway"})
	})
	mux.HandleFunc("GET /readyz", func(w http.ResponseWriter, r *http.Request) {
		if router == nil || !router.Ready() {
			writeError(w, http.StatusServiceUnavailable, "engine_unavailable")
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ready", "mode": "connected"})
	})
	mux.HandleFunc("GET /v1/markets", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, []Market{
			{"AAPL", "Apple Inc."}, {"NVDA", "NVIDIA Corporation"},
			{"MSFT", "Microsoft Corporation"}, {"TSLA", "Tesla, Inc."}, {"AMZN", "Amazon.com, Inc."},
		})
	})
	mux.HandleFunc("POST /v1/orders", func(w http.ResponseWriter, r *http.Request) {
		var order exchange.Order
		decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096))
		decoder.DisallowUnknownFields()
		if err := decoder.Decode(&order); err != nil {
			writeError(w, http.StatusBadRequest, "invalid_json")
			return
		}
		if decoder.Decode(new(any)) != io.EOF {
			writeError(w, http.StatusBadRequest, "expected_one_json_object")
			return
		}
		if err := order.Validate(); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		if router == nil {
			writeError(w, http.StatusServiceUnavailable, "engine_unavailable")
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		report, err := router.Submit(ctx, order)
		writeReport(w, report, err, http.StatusCreated)
	})
	mux.HandleFunc("DELETE /v1/orders/{symbol}/{id}", func(w http.ResponseWriter, r *http.Request) {
		if !exchange.ValidID(r.PathValue("id")) {
			writeError(w, http.StatusBadRequest, "invalid_order_id")
			return
		}
		if router == nil {
			writeError(w, http.StatusServiceUnavailable, "engine_unavailable")
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		report, err := router.Cancel(ctx, r.PathValue("symbol"), r.PathValue("id"))
		writeReport(w, report, err, http.StatusOK)
	})
	return mux
}

func writeReport(w http.ResponseWriter, report exchange.Report, err error, success int) {
	if err != nil {
		if errors.Is(err, exchange.ErrUnknownSymbol) {
			writeError(w, http.StatusBadRequest, "unknown_symbol")
			return
		}
		writeError(w, http.StatusServiceUnavailable, "engine_unavailable_outcome_unknown")
		return
	}
	if !report.OK {
		status := http.StatusBadRequest
		if report.Error == "duplicate_order_id" {
			status = http.StatusConflict
		}
		if report.Error == "order_not_found" {
			status = http.StatusNotFound
		}
		writeJSON(w, status, report)
		return
	}
	writeJSON(w, success, report)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
