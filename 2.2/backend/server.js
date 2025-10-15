import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8081;

const TODOS = [{ id: 1, text: "Learn Kubernetes" }];

app.use(cors());
app.use(express.json());

app.get("/todos", async (req, res) => {
  res.json(TODOS);
});

app.post("/todos", async (req, res) => {
  if (!req.body.text) {
    return res.status(400).send("Missing todo text");
  }

  TODOS.push({ id: TODOS.length + 1, text: req.body.text });
  res.status(201).json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
