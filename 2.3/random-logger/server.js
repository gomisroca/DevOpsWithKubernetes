import express from "express";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT || 8080;
const PINGS_URL = process.env.PINGS_URL || "http://localhost:8081/pings";

app.get("/", async (req, res) => {
  const timestamp = new Date().toISOString();
  const uuid = uuidv4();

  let counter = await fetch(PINGS_URL)
    .then((res) => res.json())
    .then((data) => {
      return data.pongs;
    });

  const output = `${timestamp}: ${uuid}.\nPing / Pongs: ${counter}`;
  console.log(output);
  res.send(output);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
