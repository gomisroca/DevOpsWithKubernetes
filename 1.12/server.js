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

// simple health route
app.get("/", async (req, res) => {
  try {
    await getImage();
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>The Project App</title>
        </head>
        <body>
          <h1>The Project App</h1>
          <img src="/image" alt="Random Image" style="max-width:100%; height:auto;" />
          <p>DevOps with Kubernetes 2025</p>
        </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching image");
  }
});

app.get("/image", (req, res) => {
  if (fs.existsSync(IMAGE_FILE)) {
    res.sendFile(IMAGE_FILE);
  } else {
    res.status(404).send("Image not found");
  }
});

// start server
app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
