import express from "express";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 8080;
const LOG_PATH = "/shared/log.txt";

app.get("/", (req, res) => {
  try {
    const content = fs.existsSync(LOG_PATH)
      ? fs.readFileSync(LOG_PATH, "utf-8")
      : "No log file found yet.";
    res.type("text/plain").send(content);
  } catch (err) {
    res.status(500).send("Error reading log file");
  }
});

app.listen(PORT, () => {
  console.log(`Reader listening on port ${PORT}`);
});
