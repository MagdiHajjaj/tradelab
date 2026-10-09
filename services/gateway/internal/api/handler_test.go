package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealthAndMarkets(t *testing.T) {
	handler := NewHandler(nil)
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
	NewHandler(nil).ServeHTTP(r, httptest.NewRequest(http.MethodPost, "/v1/orders", strings.NewReader(`{"id":"test","symbol":"AAPL","side":"buy","type":"limit","price_cents":100,"quantity":1}`)))
	if r.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 without an engine, got %d", r.Code)
	}
}

func TestRejectsMalformedOrdersBeforeRouting(t *testing.T) {
	for _, body := range []string{
		`{}`, `null`, `{"id":"x"} {}`, `{"extra":true}`,
		`{"id":"x","symbol":"AAPL","side":"buy","type":"limit","price_cents":100.5,"quantity":1}`,
		`{"id":"x","symbol":"AAPL","side":"buy","type":"market","price_cents":1,"quantity":1}`,
		`{"id":"x\nSUBMIT","symbol":"AAPL","side":"buy","type":"limit","price_cents":100,"quantity":1}`,
		`{"id":"x","symbol":"UNKNOWN","side":"buy","type":"limit","price_cents":100,"quantity":1}`,
		strings.Repeat(" ", 5000) + `{}`,
	} {
		r := httptest.NewRecorder()
		NewHandler(nil).ServeHTTP(r, httptest.NewRequest(http.MethodPost, "/v1/orders", strings.NewReader(body)))
		if r.Code != http.StatusBadRequest {
			t.Errorf("body %q: expected 400, got %d", body, r.Code)
		}
	}
}

func TestReadinessRequiresAnEngine(t *testing.T) {
	r := httptest.NewRecorder()
	NewHandler(nil).ServeHTTP(r, httptest.NewRequest(http.MethodGet, "/readyz", nil))
	if r.Code != http.StatusServiceUnavailable {
		t.Fatalf("got %d", r.Code)
	}
}
