import express from "express";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 8080;
const PINGS_URL = process.env.PINGS_URL || "http://localhost:8081/pings";
const MESSAGE = process.env.MESSAGE || "No message set";

const INFO_FILE_PATH = path.join("/app/config", "information.txt");

let infoFileContent = "File not found";
if (fs.existsSync(INFO_FILE_PATH)) {
  infoFileContent = fs.readFileSync(INFO_FILE_PATH, "utf8");
}

app.get("/", async (req, res) => {
  const timestamp = new Date().toISOString();
  const uuid = uuidv4();

  let counter = await fetch(PINGS_URL)
    .then((res) => res.json())
    .then((data) => {
      return data.pongs;
    });

  const output = `${timestamp}: ${uuid}
    Ping / Pongs: ${counter}
    MESSAGE: ${MESSAGE}
    INFO FILE CONTENT: ${infoFileContent}
    Greetings: Hello from version ${process.env.VERSION}`;

  console.log(output);
  res.send(output);
});

app.get("/healthz", async (req, res) => {
  try {
    await fetch(PINGS_URL).then((r) => r.json());
    res.status(200).send("OK");
  } catch {
    res.status(500).send("Ping-pong not available");
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
