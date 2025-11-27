
FROM golang:1.25.1 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download
RUN go mod tidy

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o controller .

FROM gcr.io/distroless/static:nonroot

WORKDIR /

# Copy the compiled binary
COPY --from=builder /app/controller /controller

USER nonroot:nonroot

ENTRYPOINT ["/controller"]
