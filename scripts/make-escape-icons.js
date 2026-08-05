const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "icons");
const srcCandidates = [
  path.join(root, "assets", "escape-512.png"),
  path.join(process.env.USERPROFILE || "", ".cursor", "projects", "c-Users-marti-OneDrive-Desktop-digital-academy", "assets", "escape-512.png"),
];

async function main() {
  fs.mkdirSync(iconsDir, { recursive: true });
  let src = srcCandidates.find((p) => fs.existsSync(p));
  if (!src) {
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <rect width="512" height="512" rx="96" fill="#001820"/>
        <circle cx="256" cy="256" r="140" fill="none" stroke="#00ffff" stroke-width="22"/>
        <text x="256" y="280" text-anchor="middle" font-family="Courier New,monospace" font-size="120" font-weight="bold" fill="#00ffff">EH</text>
      </svg>`
    );
    src = path.join(iconsDir, "_tmp.svg");
    fs.writeFileSync(src, svg);
  }
  await sharp(src).resize(192, 192).png().toFile(path.join(iconsDir, "escape-192.png"));
  await sharp(src).resize(512, 512).png().toFile(path.join(iconsDir, "escape-512.png"));
  console.log("icons ok in", iconsDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
