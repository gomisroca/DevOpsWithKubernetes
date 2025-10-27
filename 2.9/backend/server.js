import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 8081;
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@postgres.project.svc.cluster.local:5432/todo-app";

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL
    );
  `);
}
app.use(cors());
app.use(express.json());

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
    if (!req.body.text) return res.status(400).send("Missing todo text");
    await pool.query("INSERT INTO todos (text) VALUES ($1);", [req.body.text]);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(PORT, "0.0.0.0", async () => {
  try {
    await initializeDatabase();
    console.log(`Server listening on port ${PORT}`);
  } catch (err) {
    console.error("Error initializing database:", err);
    process.exit(1);
  }
});
