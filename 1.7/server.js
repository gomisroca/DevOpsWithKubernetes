import express from "express";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT || 8080;

setInterval(() => {
  console.log(`${new Date().toISOString()}: ${id}`);
}, 5000);

app.get("/status", (req, res) => {
  const id = uuidv4();
  const status = {
    timestamp: new Date().toISOString(),
    id: id,
  };
  res.json(status);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
