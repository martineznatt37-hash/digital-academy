const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const src =
  process.argv[2] ||
  path.join(
    process.env.USERPROFILE || "",
    ".cursor/projects/c-Users-marti-OneDrive-Desktop-digital-academy/assets/c__Users_marti_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_WhatsApp_Image_2026-08-03_at_5.12.30_AM-7e0a454e-a869-4d6e-a20d-c01e7b303964.png"
  );

const outDir = path.join(__dirname, "..", "assets", "chars");
fs.mkdirSync(outDir, { recursive: true });

async function removeBg(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const avg = (r + g + b) / 3;
    // fondo azul oscuro / navy de la carta
    const isNavy = b > r + 25 && b > g + 15 && avg < 90;
    const isDarkBlue = r < 50 && g < 60 && b < 110 && b >= r && b >= g;
    if (isNavy || isDarkBlue) data[i + 3] = 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } }).png().toBuffer();
}

(async () => {
  const meta = await sharp(src).metadata();
  const w = meta.width;
  const h = meta.height;
  // Tres columnas de personajes (aprox. tercios, un poco de margen lateral)
  const cols = [
    { name: "zero.png", left: Math.round(w * 0.02), width: Math.round(w * 0.30) },
    { name: "engineer.png", left: Math.round(w * 0.34), width: Math.round(w * 0.32) },
    { name: "ghost.png", left: Math.round(w * 0.66), width: Math.round(w * 0.32) },
  ];
  // Recortar zona del sprite (sin textos inferiores)
  const top = Math.round(h * 0.14);
  const height = Math.round(h * 0.52);

  for (const c of cols) {
    const cropped = await sharp(src)
      .extract({ left: c.left, top, width: c.width, height })
      .png()
      .toBuffer();
    const cleaned = await removeBg(cropped);
    const finalBuf = await sharp(cleaned).trim({ threshold: 12 }).resize({ height: 512, fit: "inside" }).png().toFile(path.join(outDir, c.name));
    console.log("ok", c.name, finalBuf);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
