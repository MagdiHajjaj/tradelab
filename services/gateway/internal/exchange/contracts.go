// Package exchange defines the public order contract without transport details.
package exchange

import (
	"context"
	"errors"
	"regexp"
)

var ErrUnavailable = errors.New("engine unavailable; order outcome may be unknown")
var ErrUnknownSymbol = errors.New("unknown symbol")
var identifier = regexp.MustCompile(`^[A-Za-z0-9_-]{1,64}$`)

var Symbols = []string{"AAPL", "NVDA", "MSFT", "TSLA", "AMZN"}

type Order struct {
	ID         string `json:"id"`
	Symbol     string `json:"symbol"`
	Side       string `json:"side"`
	Type       string `json:"type"`
	PriceCents int64  `json:"price_cents"`
	Quantity   int64  `json:"quantity"`
}

func ValidID(id string) bool { return identifier.MatchString(id) }

func (o Order) Validate() error {
	if !ValidID(o.ID) {
		return errors.New("id must contain 1-64 ASCII letters, digits, underscores, or hyphens")
	}
	if o.Side != "buy" && o.Side != "sell" {
		return errors.New("side must be buy or sell")
	}
	if o.Type != "limit" && o.Type != "market" {
		return errors.New("type must be limit or market")
	}
	if o.Quantity < 1 || o.Quantity > 1000000 {
		return errors.New("quantity must be between 1 and 1000000")
	}
	if o.Type == "limit" && (o.PriceCents < 1 || o.PriceCents > 100000000) {
		return errors.New("limit price_cents must be between 1 and 100000000")
	}
	if o.Type == "market" && o.PriceCents != 0 {
		return errors.New("market price_cents must be zero or omitted")
	}
	for _, symbol := range Symbols {
		if symbol == o.Symbol {
			return nil
		}
	}
	return ErrUnknownSymbol
}

type Trade struct {
	MakerID    string `json:"maker_id"`
	TakerID    string `json:"taker_id"`
	PriceCents int64  `json:"price_cents"`
	Quantity   int64  `json:"quantity"`
}

type Report struct {
	Version           int     `json:"version"`
	Sequence          uint64  `json:"sequence"`
	Symbol            string  `json:"symbol"`
	OK                bool    `json:"ok"`
	OrderID           string  `json:"order_id,omitempty"`
	Status            string  `json:"status,omitempty"`
	FilledQuantity    int64   `json:"filled_quantity"`
	RemainingQuantity int64   `json:"remaining_quantity"`
	CancelledQuantity int64   `json:"cancelled_quantity"`
	Trades            []Trade `json:"trades"`
	Error             string  `json:"error,omitempty"`
}

// API handlers depend on this boundary; they do not manage pipes or processes.
type Router interface {
	Submit(context.Context, Order) (Report, error)
	Cancel(context.Context, string, string) (Report, error)
	Ready() bool
}
