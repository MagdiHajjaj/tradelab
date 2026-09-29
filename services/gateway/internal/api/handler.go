// Package api owns HTTP endpoints. Matching belongs in the separate C++ service.
package api

import (
	"encoding/json"
	"net/http"
)

type Market struct {
	Symbol string `json:"symbol"`
	Name   string `json:"name"`
}

func NewHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "gateway", "mode": "scaffold"})
	})
	mux.HandleFunc("GET /v1/markets", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, []Market{
			{"AAPL", "Apple Inc."}, {"NVDA", "NVIDIA Corporation"},
			{"MSFT", "Microsoft Corporation"}, {"TSLA", "Tesla, Inc."}, {"AMZN", "Amazon.com, Inc."},
		})
	})
	// Honest boundary: never acknowledge an order that cannot reach an engine.
	mux.HandleFunc("POST /v1/orders", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusNotImplemented, map[string]string{
			"error": "engine_not_connected", "message": "Order routing is planned for milestone 03. Use the browser paper simulation.",
		})
	})
	return mux
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
