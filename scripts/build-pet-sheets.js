/**
 * Copia las imágenes de referencia del usuario y genera sprite sheets (4 fotogramas).
 * Requiere: npm install sharp (en la raíz del proyecto)
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const petsDir = path.join(root, 'images', 'pets');
const assetsDirs = [
  path.join(root, 'assets'),
  path.join(process.env.USERPROFILE || '', '.cursor', 'projects', 'c-Users-marti-OneDrive-Desktop-digital-academy', 'assets')
];

const REFS = [
  ['owl', 'owl-sprite'],
  ['wolf', 'lobo-x-ref'],
  ['dinosaur', 'dinosaur-sprite']
];

function findAsset(partial) {
  for (const dir of assetsDirs) {
    if (!fs.existsSync(dir)) continue;
    const hit = fs.readdirSync(dir).find(f => f.includes(partial));
    if (hit) return path.join(dir, hit);
  }
  return null;
}

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('Instala sharp: npm install sharp');
    process.exit(1);
  }

  fs.mkdirSync(petsDir, { recursive: true });

  for (const [name, partial] of REFS) {
    const srcPath = findAsset(partial);
    if (!srcPath) {
      console.warn(`No se encontró asset para ${name}`);
      continue;
    }

    const outPng = path.join(petsDir, `${name}.png`);
    fs.copyFileSync(srcPath, outPng);

    const meta = await sharp(srcPath).metadata();
    const fw = meta.width;
    const fh = meta.height;
    const pad = 16;

    const frameDefs = [
      { dy: 0, scale: 1, rotate: 0 },
      { dy: -10, scale: 1, rotate: -2 },
      { dy: 6, scale: 1, rotate: 2 },
      { dy: -16, scale: 1.06, rotate: 0 }
    ];

    const frameH = fh + pad * 2;
    const frames = [];

    for (const def of frameDefs) {
      const sw = Math.round(fw * def.scale);
      const sh = Math.round(fh * def.scale);
      const frame = sharp({
        create: {
          width: fw + pad * 2,
          height: frameH,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      }).composite([{
        input: await sharp(srcPath)
          .resize(sw, sh, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .rotate(def.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer(),
        left: pad + Math.round((fw - sw) / 2),
        top: pad + def.dy + Math.round((fh - sh) / 2)
      }]);
      frames.push(await frame.png().toBuffer());
    }

    const sheetW = (fw + pad * 2) * 4;
    const sheet = sharp({
      create: {
        width: sheetW,
        height: frameH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    });

    const composites = frames.map((buf, i) => ({
      input: buf,
      left: i * (fw + pad * 2),
      top: 0
    }));

    await sheet.composite(composites)
      .png()
      .toFile(path.join(petsDir, `${name}-sheet.png`));

    console.log(`✓ ${name}: ${fw}x${fh} → sheet ${sheetW}x${frameH}`);
  }

  console.log('Mascotas listas en images/pets/');
}

main().catch(err => { console.error(err); process.exit(1); });
