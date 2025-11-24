import express from "express";
import cors from "cors";
import pkg from "pg";
import { connect } from "nats";

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 8081;
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@postgres.project.svc.cluster.local:5432/todo-app";
const NATS_URL = process.env.NATS_URL || "nats://nats:4222";

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      done BOOLEAN DEFAULT false
    );
  `);
}

let natsConnection;

async function initNats() {
  natsConnection = await connect({ servers: NATS_URL });
  console.log("Connected to NATS");
}

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/healthz", async (req, res) => {
  try {
    await pool.query("SELECT 1;");
    res.status(200).json({ status: "DB OK" });
  } catch (err) {
    res.status(500).json({ status: "DB Not Ready" });
  }
});

app.get("/todos", async (req, res) => {
  try {
    const todos = await pool.query("SELECT * FROM todos;");
    res.json(todos.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/todos", async (req, res) => {
  try {
    const text = req.body.text;
    if (!text) return res.status(400).send("Missing todo text");

    if (text.length > 140) {
      console.warn(`Rejected todo (too long, ${text.length} chars): ${text}`);
      return res
        .status(400)
        .json({ error: "Todo too long (max 140 characters)" });
    }

    console.log(`Accepted todo: "${text}"`);

    const result = await pool.query(
      "INSERT INTO todos (text, done) VALUES ($1, $2) RETURNING *;",
      [req.body.text, false]
    );

    natsConnection.publish(
      "todos.events",
      Buffer.from(
        JSON.stringify({
          type: "todo_created",
          todo: result.rows[0],
        })
      )
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { done } = req.body;

    if (typeof done !== "boolean")
      return res.status(400).json({ error: "Invalid done value" });

    const result = await pool.query(
      "UPDATE todos SET done = $1 WHERE id = $2 RETURNING *;",
      [done, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Todo not found" });

    natsConnection.publish(
      "todos.events",
      Buffer.from(
        JSON.stringify({
          type: "todo_updated",
          todo: result.rows[0],
        })
      )
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(PORT, "0.0.0.0", async () => {
  try {
    await initializeDatabase();
    await initNats();

    console.log(`Server listening on port ${PORT}`);
  } catch (err) {
    console.error("Error initializing database or NATS:", err);
    process.exit(1);
  }
});
