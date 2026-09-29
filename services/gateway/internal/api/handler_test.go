package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthAndMarkets(t *testing.T) {
	handler := NewHandler()
	for _, path := range []string{"/healthz", "/v1/markets"} {
		r := httptest.NewRecorder()
		handler.ServeHTTP(r, httptest.NewRequest(http.MethodGet, path, nil))
		if r.Code != http.StatusOK || !json.Valid(r.Body.Bytes()) {
			t.Fatalf("%s: invalid response: %d %s", path, r.Code, r.Body.String())
		}
	}
}

func TestOrdersAreNotFalselyAccepted(t *testing.T) {
	r := httptest.NewRecorder()
	NewHandler().ServeHTTP(r, httptest.NewRequest(http.MethodPost, "/v1/orders", nil))
	if r.Code != http.StatusNotImplemented {
		t.Fatalf("expected 501 without an engine, got %d", r.Code)
	}
}
