package main

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

func main() {
	randomString := uuid.NewString()

	for {
		timestamp := time.Now().UTC().Format(time.RFC3339Nano)

		fmt.Printf("%s: %s\n", timestamp, randomString)

		time.Sleep(5 * time.Second)
	}
}
