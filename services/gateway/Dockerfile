FROM golang:1.26-alpine AS build
WORKDIR /src
COPY . .
RUN go test ./... && CGO_ENABLED=0 go build -o /gateway ./cmd/gateway
FROM scratch
COPY --from=build /gateway /gateway
USER 65532:65532
ENV GATEWAY_ADDR=:8080
EXPOSE 8080
ENTRYPOINT ["/gateway"]
