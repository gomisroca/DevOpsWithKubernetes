import express from "express";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT || 8080;
const COUNTER_FILE = process.env.COUNTER_FILE || "/data/counter.txt";

app.get("/", (req, res) => {
  const timestamp = new Date().toISOString();
  const uuid = uuidv4();

  let counter = 0;
  if (fs.existsSync(COUNTER_FILE)) {
    const content = fs.readFileSync(COUNTER_FILE, "utf-8");
    counter = parseInt(content, 10) || 0;
  }

  const output = `${timestamp}: ${uuid}.\nPing / Pongs: ${counter}`;
  console.log(output);
  res.send(output);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
