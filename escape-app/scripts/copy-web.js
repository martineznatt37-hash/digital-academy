const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const parent = path.join(root, "..");
const www = path.join(root, "www");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

fs.mkdirSync(www, { recursive: true });
fs.copyFileSync(path.join(parent, "escape-del-hacker.html"), path.join(www, "index.html"));
fs.copyFileSync(path.join(parent, "escape-public", "manifest.webmanifest"), path.join(www, "manifest.webmanifest"));
fs.copyFileSync(path.join(parent, "escape-public", "sw-escape.js"), path.join(www, "sw-escape.js"));
copyDir(path.join(parent, "icons"), path.join(www, "icons"));
copyDir(path.join(parent, "escape-public", "assets"), path.join(www, "assets"));
console.log("www actualizado desde escape-del-hacker.html + assets");
