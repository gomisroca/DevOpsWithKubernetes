import express from "express";
import pkg from "pg";

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 8081;
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@postgres.exercises.svc.cluster.local:5432/pingpong";

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS counter (
      id SERIAL PRIMARY KEY,
      value INT NOT NULL DEFAULT 0
    );
  `);

  const result = await pool.query("SELECT COUNT(*) FROM counter;");
  if (parseInt(result.rows[0].count) === 0) {
    await pool.query("INSERT INTO counter (value) VALUES (0);");
  }
}

app.get("/pings", async (req, res) => {
  await pool.query("UPDATE counter SET value = value + 1 WHERE id = 1;");
  const { rows } = await pool.query("SELECT value FROM counter WHERE id = 1;");
  res.json({ pongs: rows[0].value });
});

app.get("/healthz", async (req, res) => {
  try {
    await pool.query("SELECT 1;");
    res.sendStatus(200).send("OK");
  } catch (err) {
    res.sendStatus(500).send("DB not ready");
  }
});

app.listen(PORT, "0.0.0.0", async () => {
  try {
    await initializeDatabase();
    console.log(`Ping-pong app listening on port ${PORT}`);
  } catch (err) {
    console.error("Error initializing database:", err);
    process.exit(1);
  }
});
