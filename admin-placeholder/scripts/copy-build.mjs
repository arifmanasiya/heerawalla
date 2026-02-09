import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);
const dist = join(root, "dist");

const targets = [
  { src: join(dist, "app.js"), dest: join(root, "app.js") },
  { src: join(dist, "detail.js"), dest: join(root, "detail.js") }
];

for (const { src, dest } of targets) {
  if (!existsSync(src)) {
    console.warn(`Missing build output: ${src}`);
    continue;
  }
  const destDir = dirname(dest);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  copyFileSync(src, dest);
}
