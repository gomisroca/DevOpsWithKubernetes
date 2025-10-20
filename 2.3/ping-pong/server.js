import express from "express";

const app = express();
const PORT = process.env.PORT || 8081;

let counter = 0;

app.get("/pings", (req, res) => {
  counter++;
  res.json({ pongs: counter });
});

app.listen(PORT, () => {
  console.log(`Ping-pong app listening on port ${PORT}`);
});
