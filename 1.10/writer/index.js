import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const LOG_PATH = "/shared/log.txt";
const id = uuidv4();

console.log(`Writer started with ID: ${id}`);

setInterval(() => {
  const line = `${new Date().toISOString()}: ${id}\n`;
  fs.appendFileSync(LOG_PATH, line);
  console.log(`Wrote: ${line.trim()}`);
}, 5000);
