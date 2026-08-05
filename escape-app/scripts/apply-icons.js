const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const parent = path.join(root, "..");
const iconSrc = [
  path.join(parent, "icons", "escape-512.png"),
  path.join(root, "www", "icons", "escape-512.png"),
].find((p) => fs.existsSync(p));

if (!iconSrc) {
  console.error("No se encontró icons/escape-512.png");
  process.exit(1);
}

const res = path.join(root, "android", "app", "src", "main", "res");
const sizes = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};
const fgSizes = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};
const splashSizes = {
  "drawable": 480,
  "drawable-port-mdpi": 320,
  "drawable-port-hdpi": 480,
  "drawable-port-xhdpi": 720,
  "drawable-port-xxhdpi": 960,
  "drawable-port-xxxhdpi": 1280,
  "drawable-land-mdpi": 480,
  "drawable-land-hdpi": 800,
  "drawable-land-xhdpi": 1280,
  "drawable-land-xxhdpi": 1600,
  "drawable-land-xxxhdpi": 1920,
};

async function makeIcon(size, out) {
  await sharp(iconSrc).resize(size, size).png().toFile(out);
}

async function makeSplash(size, out, landscape) {
  const w = landscape ? size : Math.round(size * 0.56);
  const h = landscape ? Math.round(size * 0.56) : size;
  const icon = Math.round(Math.min(w, h) * 0.42);
  const img = await sharp(iconSrc).resize(icon, icon).png().toBuffer();
  await sharp({
    create: {
      width: w,
      height: h,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([{ input: img, gravity: "centre" }])
    .png()
    .toFile(out);
}

(async () => {
  for (const [folder, size] of Object.entries(sizes)) {
    const dir = path.join(res, folder);
    fs.mkdirSync(dir, { recursive: true });
    await makeIcon(size, path.join(dir, "ic_launcher.png"));
    await makeIcon(size, path.join(dir, "ic_launcher_round.png"));
  }
  for (const [folder, size] of Object.entries(fgSizes)) {
    const dir = path.join(res, folder);
    await makeIcon(size, path.join(dir, "ic_launcher_foreground.png"));
  }
  for (const [folder, size] of Object.entries(splashSizes)) {
    const dir = path.join(res, folder);
    fs.mkdirSync(dir, { recursive: true });
    const landscape = folder.includes("land");
    await makeSplash(size, path.join(dir, "splash.png"), landscape);
  }
  fs.writeFileSync(
    path.join(res, "values", "ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#000000</color>\n</resources>\n`
  );
  console.log("Iconos y splash aplicados");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
