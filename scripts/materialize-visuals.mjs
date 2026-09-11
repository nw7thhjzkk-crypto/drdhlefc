import fs from "node:fs";
import path from "node:path";

const srcDir = "scripts/visual-b64";
const destDir = "public/visuals";
fs.mkdirSync(destDir, { recursive: true });

if (!fs.existsSync(srcDir)) process.exit(0);

const names = new Set();
for (const file of fs.readdirSync(srcDir)) {
  if (file.endsWith(".webp.b64")) names.add(file.replace(/\.b64$/, ""));
  const m = file.match(/^(.+\.webp)\.b64\.\d+$/);
  if (m) names.add(m[1]);
}

for (const name of names) {
  const whole = path.join(srcDir, name + ".b64");
  let b64 = "";
  if (fs.existsSync(whole)) {
    b64 = fs.readFileSync(whole, "utf8");
  } else {
    const parts = fs
      .readdirSync(srcDir)
      .filter((f) => f.startsWith(name + ".b64."))
      .sort();
    b64 = parts.map((f) => fs.readFileSync(path.join(srcDir, f), "utf8")).join("");
  }
  b64 = b64.replace(/\s+/g, "");
  if (!b64) continue;
  fs.writeFileSync(path.join(destDir, name), Buffer.from(b64, "base64"));
  console.log("wrote", name, Buffer.from(b64, "base64").length);
}
