# Build stage
FROM golang:1.25 AS builder

WORKDIR /app

# Copy go.mod and go.sum first (for dependency caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source
COPY . .

# Build the app
RUN go build -o app .

# Runtime stage
FROM gcr.io/distroless/base-debian12
COPY --from=builder /app/app /app/app
CMD ["/app/app"]
