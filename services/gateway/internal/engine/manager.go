package engine

import (
	"context"
	"fmt"

	"tradelab/gateway/internal/exchange"
)

// Manager has a fixed process per symbol. Different symbols run concurrently;
// each process serializes its own requests to preserve arrival ordering.
type Manager struct{ processes map[string]*process }

func NewManager(path string) (*Manager, error) {
	manager := &Manager{processes: make(map[string]*process)}
	for _, symbol := range exchange.Symbols {
		process, err := start(path)
		if err != nil {
			manager.Close()
			return nil, fmt.Errorf("start %s engine: %w", symbol, err)
		}
		manager.processes[symbol] = process
	}
	return manager, nil
}

func (m *Manager) Submit(ctx context.Context, order exchange.Order) (exchange.Report, error) {
	if err := order.Validate(); err != nil {
		return exchange.Report{}, err
	}
	return m.execute(ctx, order.Symbol, fmt.Sprintf("v1\tSUBMIT\t%s\t%s\t%s\t%d\t%d\n", order.ID, order.Side, order.Type, order.PriceCents, order.Quantity))
}

func (m *Manager) Cancel(ctx context.Context, symbol, id string) (exchange.Report, error) {
	if !exchange.ValidID(id) {
		return exchange.Report{}, fmt.Errorf("invalid order id")
	}
	return m.execute(ctx, symbol, "v1\tCANCEL\t"+id+"\n")
}

func (m *Manager) execute(ctx context.Context, symbol, command string) (exchange.Report, error) {
	process, ok := m.processes[symbol]
	if !ok {
		return exchange.Report{}, exchange.ErrUnknownSymbol
	}
	report, err := process.request(ctx, command)
	report.Symbol = symbol
	if report.Trades == nil {
		report.Trades = []exchange.Trade{}
	}
	return report, err
}

func (m *Manager) Ready() bool {
	for _, process := range m.processes {
		if !process.ready() {
			return false
		}
	}
	return len(m.processes) == len(exchange.Symbols)
}

func (m *Manager) Close() {
	for _, process := range m.processes {
		process.close()
	}
}
