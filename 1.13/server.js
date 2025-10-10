import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 8080;
const IMAGE_FILE = process.env.IMAGE_FILE || "/data/image.jpg";

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

app.use(express.static("public"));

app.get("/image", async (req, res) => {
  if (fs.existsSync(IMAGE_FILE)) {
    res.sendFile(IMAGE_FILE);
  } else {
    await getImage();
    res.status(404).send("Image not found");
  }
});

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
