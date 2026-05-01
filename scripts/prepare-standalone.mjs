/**
 * `output: "standalone"` sonrası Next.js'in beklediği kopyalar.
 * Monorepo'da giriş noktası `.next/standalone/web/server.js` olabilir.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const nextDir = path.join(webRoot, ".next");
const standaloneDir = path.join(nextDir, "standalone");

if (!fs.existsSync(standaloneDir)) {
  console.error("Eksik: .next/standalone — önce `next build` (output: standalone) çalıştırın.");
  process.exit(1);
}

const nestedApp = path.join(standaloneDir, "web", "server.js");
const appRoot = fs.existsSync(nestedApp) ? path.join(standaloneDir, "web") : standaloneDir;

const staticSrc = path.join(nextDir, "static");
const staticDest = path.join(appRoot, ".next", "static");
const publicSrc = path.join(webRoot, "public");
const publicDest = path.join(appRoot, "public");

if (fs.existsSync(staticSrc)) {
  fs.mkdirSync(path.dirname(staticDest), { recursive: true });
  fs.cpSync(staticSrc, staticDest, { recursive: true });
  console.log("OK:", path.relative(webRoot, staticSrc), "->", path.relative(webRoot, staticDest));
} else {
  console.warn("Uyarı: .next/static yok.");
}

if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true });
  console.log("OK: public ->", path.relative(webRoot, publicDest));
}

console.log("Node ile çalıştır: node", path.join(path.relative(webRoot, appRoot), "server.js"));
console.log("Tam yol:", appRoot);
