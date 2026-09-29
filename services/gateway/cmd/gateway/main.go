package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"tradelab/gateway/internal/api"
)

func main() {
	addr := os.Getenv("GATEWAY_ADDR")
	if addr == "" {
		addr = "127.0.0.1:8080"
	}
	server := &http.Server{
		Addr: addr, Handler: api.NewHandler(),
		ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second,
		WriteTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second,
	}
	log.Printf("TradeLab gateway listening on %s (scaffold mode)", addr)
	log.Fatal(server.ListenAndServe())
}
