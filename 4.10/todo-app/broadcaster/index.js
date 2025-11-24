import { connect } from "nats";

const NATS_URL = process.env.NATS_URL || "nats://nats:4222";
const ENDPOINT_URL = process.env.ENDPOINT_URL;

if (!ENDPOINT_URL) {
  console.error("Missing ENDPOINT_URL env variable");
  process.exit(1);
}

async function start() {
  const nc = await connect({ servers: NATS_URL });
  console.log("Broadcaster connected to NATS");

  const sub = nc.subscribe("todos.events", {
    queue: "broadcaster-workers",
  });

  console.log("Broadcaster subscribed to todos.events");

  for await (const msg of sub) {
    try {
      const event = JSON.parse(msg.data.toString());

      const text =
        event.type === "todo_created"
          ? `A todo was created: "${event.todo.text}"`
          : `A todo was updated: "${event.todo.text}" (done=${event.todo.done})`;

      await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: "bot",
          message: text,
        }),
      });

      console.log("Sent message:", text);
    } catch (err) {
      console.error("Error handling NATS event:", err);
    }
  }
}

start().catch((err) => {
  console.error("Broadcaster fatal error:", err);
  process.exit(1);
});
