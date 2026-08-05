const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const base = path.join(__dirname, '..', 'images');
fs.mkdirSync(path.join(base, 'courses'), { recursive: true });
fs.mkdirSync(path.join(base, 'lessons'), { recursive: true });
fs.mkdirSync(path.join(base, 'pets'), { recursive: true });

const courses = {
  'matematicas-divertidas': ['#2563EB', '#3B82F6', 'Matemáticas', '🔢'],
  'lectura-escritura': ['#D97706', '#FBBF24', 'Español', '📖'],
  'ciencias-naturales': ['#059669', '#34D399', 'Ciencias', '🌱'],
  'historia-geografia-primaria': ['#DC2626', '#FCA5A5', 'Historia y Geografia', '🗺️'],
  'formacion-civica-primaria': ['#7C3AED', '#C4B5FD', 'Formacion Civica', '🤝'],
  'matematicas-secundaria': ['#6366F1', '#818CF8', 'Matematicas', '📐'],
  'espanol-secundaria': ['#F59E0B', '#FCD34D', 'Espanol', '📝'],
  'ciencias-secundaria': ['#10B981', '#6EE7B7', 'Ciencias', '🔬'],
  'historia-secundaria': ['#B91C1C', '#F87171', 'Historia', '📜'],
  'geografia-secundaria': ['#0284C7', '#38BDF8', 'Geografia', '🌎'],
  'ingles-intermedio': ['#DC2626', '#F87171', 'Ingles', '🇬🇧'],
  'matematicas-preparatoria': ['#4F46E5', '#A5B4FC', 'Matematicas', '📊'],
  'fisica-preparatoria': ['#2563EB', '#60A5FA', 'Fisica', '⚡'],
  'quimica-organica': ['#059669', '#6EE7B7', 'Quimica', '⚗️'],
  'biologia-preparatoria': ['#16A34A', '#86EFAC', 'Biologia', '🧬'],
  'historia-mexico-preparatoria': ['#991B1B', '#FCA5A5', 'Historia de Mexico', '🏛️'],
  'literatura-preparatoria': ['#CA8A04', '#FDE047', 'Literatura', '📚'],
  'introduccion-programacion': ['#0891B2', '#22D3EE', 'Programacion', '💻'],
  'fundamentos-ia': ['#2563EB', '#60A5FA', 'Inteligencia Artificial', '🤖'],
  'uso-basico-computadoras': ['#1D4ED8', '#60A5FA', 'Computadoras', '🖥️'],
  'navegacion-internet': ['#0D9488', '#2DD4BF', 'Internet', '🌐'],
  'correo-electronico': ['#CA8A04', '#FACC15', 'Correo', '📧'],
  'microsoft-office': ['#7C3AED', '#C4B5FD', 'Office', '📄'],
  'google-drive': ['#0284C7', '#38BDF8', 'Google Drive', '☁️'],
  'seguridad-digital': ['#B91C1C', '#FCA5A5', 'Seguridad', '🔒']
};

function courseSvg(c1, c2, title, emoji) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="white" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <circle cx="680" cy="80" r="120" fill="white" opacity="0.12"/>
  <circle cx="120" cy="380" r="90" fill="white" opacity="0.08"/>
  <circle cx="650" cy="350" r="60" fill="white" opacity="0.1"/>
  <rect x="0" y="0" width="800" height="180" fill="url(#shine)"/>
  <text x="400" y="175" text-anchor="middle" font-size="120" filter="url(#shadow)">${emoji}</text>
  <rect x="80" y="280" width="640" height="4" rx="2" fill="white" opacity="0.4"/>
  <text x="400" y="340" text-anchor="middle" font-size="38" fill="white" font-family="Arial,Helvetica,sans-serif" font-weight="800" filter="url(#shadow)">${title}</text>
  <text x="400" y="390" text-anchor="middle" font-size="18" fill="white" opacity="0.9" font-family="Arial,sans-serif" font-weight="600">Digital Academy</text>
</svg>`;
}

for (const [slug, [c1, c2, t, emoji]] of Object.entries(courses)) {
  fs.writeFileSync(path.join(base, 'courses', slug + '.svg'), courseSvg(c1, c2, t, emoji));
}

/* --- Transparent PNG generator (pixel art) --- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writePng(filePath, width, height, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixels[y * width + x];
      const o = y * (width * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(filePath, png);
}

const PALETTE = {
  '.': [0, 0, 0, 0],
  O: [139, 90, 43, 255],
  o: [210, 180, 140, 255],
  Y: [255, 220, 0, 255],
  B: [30, 30, 30, 255],
  W: [255, 255, 255, 255],
  G: [120, 120, 130, 255],
  g: [180, 180, 190, 255],
  D: [34, 139, 34, 255],
  d: [50, 205, 50, 255],
  R: [220, 50, 50, 255],
  T: [101, 67, 33, 255],
  t: [160, 120, 80, 255],
  b: [255, 140, 0, 255],
  w: [139, 115, 85, 255],
  f: [255, 180, 60, 255],
  e: [90, 90, 100, 255],
  E: [140, 140, 150, 255],
  n: [40, 40, 40, 255],
  l: [30, 100, 30, 255],
  s: [20, 120, 20, 255],
  S: [10, 80, 10, 255],
  r: [180, 180, 190, 255],
  p: [255, 192, 203, 255]
};

function artToPixels(rows) {
  const w = Math.max(...rows.map(r => r.length));
  const h = rows.length;
  const pixels = [];
  for (const row of rows) {
    const padded = row.padEnd(w, '.');
    for (const ch of padded) {
      pixels.push(PALETTE[ch] || PALETTE['.']);
    }
  }
  return { w, h, pixels };
}

function padRows(rows) {
  const w = Math.max(...rows.map(r => r.length));
  return rows.map(r => r.padEnd(w, '.'));
}

function writeSpriteSheet(filePath, frameRowsList) {
  const frames = frameRowsList.map(padRows);
  const fw = Math.max(...frames[0].map(r => r.length));
  const fh = frames[0].length;
  const count = frames.length;
  const sheetW = fw * count;
  const merged = [];

  for (let y = 0; y < fh; y++) {
    for (let fi = 0; fi < count; fi++) {
      const { pixels } = artToPixels(frames[fi]);
      for (let x = 0; x < fw; x++) {
        merged.push(pixels[y * fw + x]);
      }
    }
  }
  writePng(filePath, sheetW, fh, merged);
}

const pets = {
  owl: [
    '............tttttttttt............',
    '..........ttooooooooOtt...........',
    '........ttoooooooooooOtt..........',
    '.......toooooooooooooooOtt.........',
    '......toooYYooooooYYooooOtt........',
    '......toooBBooooooBBooooOtt........',
    '......toooooooooooooooooOtt........',
    '.......tooooobbbbooooooOtt.........',
    '........toooooooooooooOtt..........',
    '.........toooooooooooOtt...........',
    '..........toooooooooOtt............',
    '...........wwwwwwwwww..............',
    '............ww..ww.................',
    '.............ffff..................',
    '.............f..f..................'
  ],
  owl_walk1: [
    '............tttttttttt............',
    '..........ttooooooooOtt...........',
    '........ttoooooooooooOtt..........',
    '.......toooooooooooooooOtt.........',
    '......toooYYooooooYYooooOtt........',
    '......toooBBooooooBBooooOtt........',
    '......toooooooooooooooooOtt........',
    '.......tooooobbbbooooooOtt.........',
    '........toooooooooooooOtt..........',
    '.........toooooooooooOtt...........',
    '..........toooooooooOtt............',
    '.........wwwwwwwwwwww..............',
    '..........ww....ww.................',
    '...........ff....ff................',
    '...........f.....f.................'
  ],
  owl_walk2: [
    '............tttttttttt............',
    '..........ttooooooooOtt...........',
    '........ttoooooooooooOtt..........',
    '.......toooooooooooooooOtt.........',
    '......toooYYooooooYYooooOtt........',
    '......toooBBooooooBBooooOtt........',
    '......toooooooooooooooooOtt........',
    '.......tooooobbbbooooooOtt.........',
    '........toooooooooooooOtt..........',
    '.........toooooooooooOtt...........',
    '..........toooooooooOtt............',
    '...........wwwwwwwwww..............',
    '............ww..ww.................',
    '...........ff......ff..............',
    '...........f........f..............'
  ],
  owl_happy: [
    '............tttttttttt............',
    '..........ttooooooooOtt...........',
    '........ttoooooooooooOtt..........',
    '.......toooooooooooooooOtt.........',
    '......toooYYooooooYYooooOtt........',
    '......toooBBooooooBBooooOtt........',
    '......toooooooooooooooooOtt........',
    '.......tooooobbbbooooooOtt.........',
    '........toooooooooooooOtt..........',
    '.........toooooooooooOtt...........',
    '..........toooooooooOtt............',
    '.......wwwwwwwwwwwwwwww............',
    '......ww............ww.............',
    '.............ffff..................',
    '.............f..f..................'
  ],
  wolf: [
    '........ee............ee........',
    '.......eggggggggggggggge.......',
    '......egGGYYooooYYGGGGe......',
    '.....egGGGBBooooBBGGGGe.....',
    '....egGGGnnnnnnnnGGGGGe....',
    '...egGGGGGGGGGGGGGGGGGGe...',
    '..egGGGGGGGGGGGGGGGGGGGGe..',
    '.egGGGGGGGGGGGGGGGGGGGGGGe.',
    'egGGGGGGGGGGGGGGGGGGGGGGGGe',
    '.egGGGGGttttttttGGGGGGGGe.',
    '..egGGtt........ttGGGGGe..',
    '...egGt..........tGGGGe...',
    '....eg............gGe....',
    '.....rrrrrrrrrrrrrrr.....'
  ],
  wolf_walk1: [
    '........ee............ee........',
    '.......eggggggggggggggge.......',
    '......egGGYYooooYYGGGGe......',
    '.....egGGGBBooooBBGGGGe.....',
    '....egGGGnnnnnnnnGGGGGe....',
    '...egGGGGGGGGGGGGGGGGGGe...',
    '..egGGGGGGGGGGGGGGGGGGGGe..',
    '.egGGGGGGGGGGGGGGGGGGGGGGe.',
    'egGGGGGGGGGGGGGGGGGGGGGGGGe',
    '.egGGGGGttttttttGGGGGGGGe.',
    '..egGt..........tGGGGGe..',
    '...egt............GGGGe...',
    '....eg............gGe....',
    '.....rrrrrrrrrrrrrrr.....'
  ],
  wolf_walk2: [
    '........ee............ee........',
    '.......eggggggggggggggge.......',
    '......egGGYYooooYYGGGGe......',
    '.....egGGGBBooooBBGGGGe.....',
    '....egGGGnnnnnnnnGGGGGe....',
    '...egGGGGGGGGGGGGGGGGGGe...',
    '..egGGGGGGGGGGGGGGGGGGGGe..',
    '.egGGGGGGGGGGGGGGGGGGGGGGe.',
    'egGGGGGGGGGGGGGGGGGGGGGGGGe',
    '.egGGGGGttttttttGGGGGGGGe.',
    '..egGGtt........ttGGGGGe..',
    '...egGGt........tGGGGe...',
    '....eg............gGe....',
    '.....rrrrrrrrrrrrrrr.....'
  ],
  wolf_happy: [
    '........ee............ee........',
    '.......eggggggggggggggge.......',
    '......egGGYYooooYYGGGGe......',
    '.....egGGGBBooooBBGGGGe.....',
    '....egGGGppppppppGGGGGe....',
    '...egGGGGGGGGGGGGGGGGGGe...',
    '..egGGGGGGGGGGGGGGGGGGGGe..',
    '.egGGGGGGGGGGGGGGGGGGGGGGe.',
    'egGGGGGGGGGGGGGGGGGGGGGGGGe',
    '.egGGGGGttttttttGGGGGGGGe.',
    '..egGGtt........ttGGGGGe..',
    '...egGt..........tGGGGe...',
    '....eg............gGe....',
    '.....rrrrrrrrrrrrrrr.....'
  ],
  dinosaur: [
    '...........ssssssss...........',
    '..........sDDDDDDDDs..........',
    '.........sDDYYooYYDDs.........',
    '........sDDDBBooBBDDs........',
    '.......sDDDDnnnnDDDDs.......',
    '......sDDDDDDDDDDDDDs......',
    '.....sDDDDDDDDDDDDDDDs.....',
    '....sDDDDDDDDDDDDDDDDDs....',
    '...sDDDDDDDDDDDDDDDDDDDs...',
    '..sDDDDDDDDDDDDDDDDDDDDDs..',
    '.sDDDDDDDDDDDDDDDDDDDDDDDs.',
    'sDDDDDDDDDDDDDDDDDDDDDDDDDs',
    '.sDDDDll..........llDDDDs.',
    '..sDDll............llDDs..',
    '...sll..............lls...',
    '...tt................tt...',
    '...tt................tt...'
  ],
  dinosaur_walk1: [
    '...........ssssssss...........',
    '..........sDDDDDDDDs..........',
    '.........sDDYYooYYDDs.........',
    '........sDDDBBooBBDDs........',
    '.......sDDDDnnnnDDDDs.......',
    '......sDDDDDDDDDDDDDs......',
    '.....sDDDDDDDDDDDDDDDs.....',
    '....sDDDDDDDDDDDDDDDDDs....',
    '...sDDDDDDDDDDDDDDDDDDDs...',
    '..sDDDDDDDDDDDDDDDDDDDDDs..',
    '.sDDDDDDDDDDDDDDDDDDDDDDDs.',
    'sDDDDDDDDDDDDDDDDDDDDDDDDDs',
    '.sDDDDll..........llDDDDs.',
    '..sDDl..............lDDs..',
    '...sl................ls...',
    '...t..................t...',
    '...t..................t...'
  ],
  dinosaur_walk2: [
    '...........ssssssss...........',
    '..........sDDDDDDDDs..........',
    '.........sDDYYooYYDDs.........',
    '........sDDDBBooBBDDs........',
    '.......sDDDDnnnnDDDDs.......',
    '......sDDDDDDDDDDDDDs......',
    '.....sDDDDDDDDDDDDDDDs.....',
    '....sDDDDDDDDDDDDDDDDDs....',
    '...sDDDDDDDDDDDDDDDDDDDs...',
    '..sDDDDDDDDDDDDDDDDDDDDDs..',
    '.sDDDDDDDDDDDDDDDDDDDDDDDs.',
    'sDDDDDDDDDDDDDDDDDDDDDDDDDs',
    '.sDDDDll..........llDDDDs.',
    '..sDDll............llDDs..',
    '...sll..............lls...',
    '....t................t....',
    '....t................t....'
  ],
  dinosaur_happy: [
    '...........ssssssss...........',
    '..........sDDDDDDDDs..........',
    '.........sDDYYooYYDDs.........',
    '........sDDDBBooBBDDs........',
    '.......sDDDDppppDDDDs.......',
    '......sDDDDDDDDDDDDDs......',
    '.....sDDDDDDDDDDDDDDDs.....',
    '....sDDDDDDDDDDDDDDDDDs....',
    '...sDDDDDDDDDDDDDDDDDDDs...',
    '..sDDDDDDDDDDDDDDDDDDDDDs..',
    '.sDDDDDDDDDDDDDDDDDDDDDDDs.',
    'sDDDDDDDDDDDDDDDDDDDDDDDDDs',
    '.sDDDDll..........llDDDDs.',
    '..sDDll............llDDs..',
    '...sll..............lls...',
    '...tt................tt...',
    '...tt................tt...'
  ]
};

const petSheets = {
  owl: ['owl', 'owl_walk1', 'owl_walk2', 'owl_happy'],
  wolf: ['wolf', 'wolf_walk1', 'wolf_walk2', 'wolf_happy'],
  dinosaur: ['dinosaur', 'dinosaur_walk1', 'dinosaur_walk2', 'dinosaur_happy']
};

for (const [name, frameKeys] of Object.entries(petSheets)) {
  const frameRows = frameKeys.map(k => pets[k]);
  const { w, h, pixels } = artToPixels(frameRows[0]);
  writePng(path.join(base, 'pets', name + '.png'), w, h, pixels);
  writeSpriteSheet(path.join(base, 'pets', name + '-sheet.png'), frameRows);
}

console.log('Images ready:', fs.readdirSync(path.join(base, 'courses')).length, 'courses,',
  fs.readdirSync(path.join(base, 'pets')).length, 'pets');
