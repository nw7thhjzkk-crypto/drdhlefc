import fs from "node:fs";
import path from "node:path";

const srcDir = "scripts/visual-b64";
const destDir = "public/visuals";
fs.mkdirSync(destDir, { recursive: true });

for (const file of fs.readdirSync(srcDir)) {
  if (!file.endsWith(".webp.b64")) continue;
  const name = file.replace(/\.b64$/, "");
  const b64 = fs.readFileSync(path.join(srcDir, file), "utf8").replace(/\s+/g, "");
  fs.writeFileSync(path.join(destDir, name), Buffer.from(b64, "base64"));
  console.log("wrote", name);
}
