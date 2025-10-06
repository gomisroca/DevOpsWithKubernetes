const express = require("express");

const app = express();
const PORT = process.env.PORT || 8080;

// simple health route
app.get("/", (req, res) => {
  res.send(`Todo app server running on port ${PORT}`);
});

// start server
app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
