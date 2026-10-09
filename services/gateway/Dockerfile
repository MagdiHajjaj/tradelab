FROM golang:1.26-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends cmake g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY services/matching-engine matching-engine
RUN cmake -S matching-engine -B /engine-build -DBUILD_TESTING=OFF -DCMAKE_BUILD_TYPE=Release && cmake --build /engine-build --parallel 2
COPY services/gateway gateway
WORKDIR /src/gateway
RUN go test ./... && CGO_ENABLED=0 go build -o /gateway ./cmd/gateway

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends libstdc++6 && rm -rf /var/lib/apt/lists/*
COPY --from=build /gateway /gateway
COPY --from=build /engine-build/engine_server /usr/local/bin/engine_server
USER 65532:65532
ENV GATEWAY_ADDR=:8080 ENGINE_PATH=/usr/local/bin/engine_server
EXPOSE 8080
ENTRYPOINT ["/gateway"]
