import express from "express";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 8081;
const COUNTER_FILE = process.env.COUNTER_FILE || "/data/counter.txt";

let counter = 0;
if (fs.existsSync(COUNTER_FILE)) {
  const content = fs.readFileSync(COUNTER_FILE, "utf-8");
  counter = parseInt(content, 10) || 0;
}

app.get("/pingpong", (req, res) => {
  counter++;
  fs.writeFileSync(COUNTER_FILE, counter.toString());
  res.send(`pong ${counter}`);
});

app.listen(PORT, () => {
  console.log(`Ping-pong app listening on port ${PORT}`);
});
