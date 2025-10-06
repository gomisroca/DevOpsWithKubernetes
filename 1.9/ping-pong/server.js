import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;

let counter = 0;

app.get("/pingpong", (req, res) => {
  res.send(`pong ${counter}`);
  counter++;
});

app.listen(PORT, () => {
  console.log(`Ping-pong app listening on port ${PORT}`);
});
