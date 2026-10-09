// Package engine owns the C++ child processes and their private pipe protocol.
package engine

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"
	"time"

	"tradelab/gateway/internal/exchange"
)

type process struct {
	cmd      *exec.Cmd
	input    io.WriteCloser
	replies  chan []byte
	stopped  chan struct{}
	exited   chan struct{}
	gate     chan struct{}
	once     sync.Once
	sequence uint64 // Protected by gate; only one request may own the pipe.
}

func start(path string) (*process, error) {
	cmd := exec.Command(path)
	cmd.Stderr = os.Stderr
	input, err := cmd.StdinPipe()
	if err != nil {
		return nil, err
	}
	output, err := cmd.StdoutPipe()
	if err != nil {
		_ = input.Close()
		return nil, err
	}
	if err = cmd.Start(); err != nil {
		_ = input.Close()
		_ = output.Close()
		return nil, err
	}
	p := &process{cmd: cmd, input: input, replies: make(chan []byte, 1), stopped: make(chan struct{}), exited: make(chan struct{}), gate: make(chan struct{}, 1)}
	go func() {
		defer close(p.exited)
		defer close(p.replies)
		scanner := bufio.NewScanner(output)
		scanner.Buffer(make([]byte, 4096), 4*1024*1024)
	readLoop:
		for scanner.Scan() {
			line := append([]byte(nil), scanner.Bytes()...)
			select {
			case p.replies <- line:
			case <-p.stopped:
				break readLoop
			}
		}
		// A broken/oversized reply invalidates this session. Never restart a book silently.
		p.stop()
		_ = cmd.Wait() // Read loop finishes before Wait closes the stdout pipe.
	}()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	report, err := p.request(ctx, "v1\tPING\n")
	if err != nil || !report.OK || report.Status != "ready" {
		p.close()
		return nil, fmt.Errorf("engine handshake failed: %w", exchange.ErrUnavailable)
	}
	return p, nil
}

func (p *process) stop() {
	p.once.Do(func() {
		close(p.stopped)
		_ = p.input.Close()
		_ = p.cmd.Process.Kill()
	})
}

func (p *process) close() { p.stop(); <-p.exited }
func (p *process) ready() bool {
	select {
	case <-p.stopped:
		return false
	default:
		return true
	}
}

func (p *process) request(ctx context.Context, line string) (exchange.Report, error) {
	select {
	case p.gate <- struct{}{}:
	case <-ctx.Done():
		return exchange.Report{}, ctx.Err()
	case <-p.stopped:
		return exchange.Report{}, exchange.ErrUnavailable
	}
	defer func() { <-p.gate }()
	if err := ctx.Err(); err != nil {
		return exchange.Report{}, err
	}
	if !p.ready() {
		return exchange.Report{}, exchange.ErrUnavailable
	}

	// Commands are <=256 bytes and there is at most one outstanding command per pipe.
	if _, err := io.WriteString(p.input, line); err != nil {
		p.stop()
		return exchange.Report{}, exchange.ErrUnavailable
	}
	select {
	case data, ok := <-p.replies:
		var report exchange.Report
		if !ok || json.Unmarshal(data, &report) != nil || report.Version != 1 || report.Sequence != p.sequence+1 {
			p.stop()
			return exchange.Report{}, exchange.ErrUnavailable
		}
		p.sequence = report.Sequence
		return report, nil
	case <-ctx.Done():
		// The command may already have matched. Kill this session rather than misattribute a late reply.
		p.stop()
		return exchange.Report{}, exchange.ErrUnavailable
	case <-p.stopped:
		return exchange.Report{}, exchange.ErrUnavailable
	}
}
