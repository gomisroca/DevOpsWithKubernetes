import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 8080;
const IMAGE_FILE = process.env.IMAGE_FILE || "/data/image.jpg";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8081";

const dataDir = path.dirname(IMAGE_FILE);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

async function getImage() {
  const now = Date.now();

  // Refresh every 10 minutes
  if (fs.existsSync(IMAGE_FILE)) {
    const stats = fs.statSync(IMAGE_FILE);
    const age = (now - stats.mtimeMs) / 1000 / 60;
    if (age < 10) {
      console.log("Serving cached image");
      return IMAGE_FILE;
    }
  }

  console.log("Fetching new image from Lorem Picsum...");
  const res = await fetch("https://picsum.photos/1200", { redirect: "follow" });
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(IMAGE_FILE, buffer);
  return IMAGE_FILE;
}

app.use(express.json());
app.use(express.static("public"));

app.get("/healthz", async (req, res) => {
  try {
    res.status(200).json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error" });
  }
});

app.get("/image", async (req, res) => {
  if (fs.existsSync(IMAGE_FILE)) {
    res.sendFile(IMAGE_FILE);
  } else {
    await getImage();
    res.status(404).send("Image not found");
  }
});

app.get("/todos", async (req, res) => {
  try {
    const response = await fetch(`${BACKEND_URL}/todos`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching todos:", err);
    res.status(500).send("Error fetching todos");
  }
});

app.post("/todos", async (req, res) => {
  await fetch(`${BACKEND_URL}/todos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });
  res.status(201).send("Todo added");
});

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
