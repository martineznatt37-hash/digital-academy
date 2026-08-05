/**
 * Genera imágenes PNG: hero profesional, cursos por nivel, mascotas originales.
 * node scripts/upgrade-all-images.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dirs = {
  courses: path.join(root, 'images', 'courses'),
  lessons: path.join(root, 'images', 'lessons'),
  site: path.join(root, 'images', 'site'),
  pets: path.join(root, 'images', 'pets')
};
Object.values(dirs).forEach(d => fs.mkdirSync(d, { recursive: true }));

const PET_REFS = [
  ['owl', 'owl-sprite'],
  ['wolf', 'lobo-x-ref'],
  ['dinosaur', 'dinosaur-sprite']
];

const ASSET_DIRS = [
  path.join(root, 'assets'),
  path.join(process.env.USERPROFILE || '', '.cursor', 'projects', 'c-Users-marti-OneDrive-Desktop-digital-academy', 'assets')
];

/* slug → [c1, c2, accent, title, category, level, emoji] */
const COURSES = {
  'matematicas-divertidas': ['#38BDF8', '#F472B6', '#FBBF24', 'Matemáticas', 'math', 'primaria', '🔢'],
  'lectura-escritura': ['#FDE68A', '#FCA5A5', '#F97316', 'Español', 'reading', 'primaria', '📖'],
  'ciencias-naturales': ['#86EFAC', '#6EE7B7', '#22C55E', 'Ciencias', 'science', 'primaria', '🌱'],
  'historia-geografia-primaria': ['#FCA5A5', '#FDBA74', '#EF4444', 'Historia y Geografía', 'history', 'primaria', '🗺️'],
  'formacion-civica-primaria': ['#C4B5FD', '#F9A8D4', '#A855F7', 'Formación Cívica', 'history', 'primaria', '🤝'],
  'matematicas-secundaria': ['#6366F1', '#06B6D4', '#22D3EE', 'Matemáticas', 'math', 'secundaria', '📐'],
  'espanol-secundaria': ['#F59E0B', '#EF4444', '#FCD34D', 'Español', 'reading', 'secundaria', '📝'],
  'ciencias-secundaria': ['#10B981', '#14B8A6', '#34D399', 'Ciencias', 'science', 'secundaria', '🔬'],
  'historia-secundaria': ['#DC2626', '#7C3AED', '#F87171', 'Historia', 'history', 'secundaria', '📜'],
  'geografia-secundaria': ['#0284C7', '#2563EB', '#38BDF8', 'Geografía', 'history', 'secundaria', '🌎'],
  'ingles-intermedio': ['#E11D48', '#8B5CF6', '#FB7185', 'Inglés', 'reading', 'secundaria', '🇬🇧'],
  'introduccion-programacion': ['#0891B2', '#6366F1', '#22D3EE', 'Programación', 'tech', 'secundaria', '💻'],
  'matematicas-preparatoria': ['#312E81', '#1E40AF', '#818CF8', 'Matemáticas', 'math', 'preparatoria', '📊'],
  'fisica-preparatoria': ['#1E3A8A', '#0369A1', '#60A5FA', 'Física', 'science', 'preparatoria', '⚡'],
  'quimica-organica': ['#065F46', '#047857', '#6EE7B7', 'Química', 'science', 'preparatoria', '⚗️'],
  'biologia-preparatoria': ['#14532D', '#15803D', '#4ADE80', 'Biología', 'science', 'preparatoria', '🧬'],
  'historia-mexico-preparatoria': ['#7F1D1D', '#991B1B', '#FCA5A5', 'Historia de México', 'history', 'preparatoria', '🏛️'],
  'literatura-preparatoria': ['#92400E', '#B45309', '#FDE047', 'Literatura', 'reading', 'preparatoria', '📚'],
  'fundamentos-ia': ['#1E3A8A', '#4338CA', '#A5B4FC', 'Inteligencia Artificial', 'tech', 'preparatoria', '🤖'],
  'uso-basico-computadoras': ['#1E3A8A', '#2563EB', '#93C5FD', 'Computadoras', 'tech', 'capacitacion', '🖥️'],
  'navegacion-internet': ['#0F766E', '#0891B2', '#5EEAD4', 'Internet', 'tech', 'capacitacion', '🌐'],
  'correo-electronico': ['#CA8A04', '#EA580C', '#FDE047', 'Correo', 'tech', 'capacitacion', '📧'],
  'microsoft-office': ['#5B21B6', '#7C3AED', '#DDD6FE', 'Microsoft Office', 'tech', 'capacitacion', '📄'],
  'google-drive': ['#0369A1', '#0EA5E9', '#BAE6FD', 'Google Drive', 'tech', 'capacitacion', '☁️'],
  'seguridad-digital': ['#991B1B', '#DC2626', '#FECACA', 'Seguridad Digital', 'tech', 'capacitacion', '🔒']
};

function primariaDecor(emoji, accent) {
  return `
  <circle cx="120" cy="90" r="55" fill="#FFF" opacity="0.35"/>
  <circle cx="680" cy="110" r="40" fill="#FFF" opacity="0.3"/>
  <text x="620" y="200" font-size="100">${emoji}</text>
  <circle cx="680" cy="320" r="18" fill="${accent}" opacity="0.6"/>
  <circle cx="710" cy="350" r="12" fill="#F472B6" opacity="0.7"/>
  <circle cx="650" cy="360" r="10" fill="#FBBF24" opacity="0.8"/>
  <text x="100" y="130" font-size="36">⭐</text>
  <text x="720" y="80" font-size="28">✨</text>
  <text x="80" y="350" font-size="32">🌈</text>
  <rect x="50" y="300" width="90" height="50" rx="25" fill="#FFF" opacity="0.45"/>
  <text x="95" y="335" text-anchor="middle" font-size="28">🎈</text>`;
}

function secundariaDecor(category, accent, emoji) {
  const extra = category === 'tech'
    ? `<text x="560" y="200" fill="${accent}" font-family="monospace" font-size="18" opacity="0.8">{ aprende() }</text>`
    : '';
  return `
  <polygon points="600,60 750,60 720,180 570,180" fill="${accent}" opacity="0.25"/>
  <polygon points="80,250 200,220 180,340 60,370" fill="#FFF" opacity="0.08"/>
  <line x1="0" y1="120" x2="800" y2="200" stroke="${accent}" stroke-width="3" opacity="0.35"/>
  <line x1="0" y1="200" x2="800" y2="100" stroke="#FFF" stroke-width="2" opacity="0.15"/>
  <text x="580" y="260" font-size="90" opacity="0.95">${emoji}</text>
  ${extra}
  <rect x="520" y="300" width="200" height="8" rx="4" fill="${accent}" opacity="0.7"/>
  <rect x="540" y="318" width="160" height="8" rx="4" fill="#FFF" opacity="0.25"/>`;
}

function preparatoriaDecor(category, accent, emoji) {
  return `
  <rect x="480" y="50" width="260" height="200" rx="20" fill="#000" fill-opacity="0.2" stroke="${accent}" stroke-width="2" stroke-opacity="0.5"/>
  <rect x="500" y="70" width="220" height="160" rx="12" fill="#0F172A" fill-opacity="0.55"/>
  <text x="610" y="175" text-anchor="middle" font-size="72">${emoji}</text>
  <line x1="500" y1="200" x2="720" y2="200" stroke="${accent}" stroke-width="2" opacity="0.6"/>
  <circle cx="740" cy="280" r="50" fill="${accent}" opacity="0.15"/>
  <text x="60" y="100" fill="white" font-family="Georgia,serif" font-size="48" opacity="0.12">A+</text>`;
}

function capacitacionDecor(accent, emoji) {
  return `
  <rect x="460" y="55" width="280" height="190" rx="16" fill="#0F172A" stroke="${accent}" stroke-width="2"/>
  <rect x="480" y="75" width="240" height="130" rx="8" fill="#1E293B"/>
  <text x="600" y="155" text-anchor="middle" font-size="64">${emoji}</text>
  <text x="500" y="110" fill="${accent}" font-family="monospace" font-size="13">&lt;digital /&gt;</text>`;
}

function courseSvgPrimaria(slug, c1, c2, accent, title, emoji) {
  const uid = slug.replace(/[^a-z0-9]/g, '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="p${uid}" x1="0" y1="0" x2="800" y2="450">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#p${uid})"/>
  ${primariaDecor(emoji, accent)}
  <rect x="40" y="300" width="720" height="110" rx="28" fill="#FFF" fill-opacity="0.55" stroke="#FFF" stroke-width="3"/>
  <text x="400" y="355" text-anchor="middle" font-family="Comic Sans MS,Arial Rounded MT Bold,sans-serif" font-size="38" font-weight="800" fill="#1E293B">${title}</text>
  <text x="400" y="390" text-anchor="middle" font-family="Comic Sans MS,sans-serif" font-size="18" fill="#475569">¡Aprende jugando! 🎉</text>
</svg>`;
}

function courseSvgSecundaria(slug, c1, c2, accent, title, category, emoji) {
  const uid = slug.replace(/[^a-z0-9]/g, '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="s${uid}" x1="0" y1="0" x2="800" y2="450">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="55%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#s${uid})"/>
  ${secundariaDecor(category, accent, emoji)}
  <rect x="32" y="310" width="736" height="100" rx="16" fill="#000" fill-opacity="0.35" stroke="${accent}" stroke-width="2"/>
  <text x="400" y="365" text-anchor="middle" font-family="Segoe UI,Arial Black,sans-serif" font-size="36" font-weight="900" fill="white">${title}</text>
  <text x="400" y="395" text-anchor="middle" font-family="Segoe UI,sans-serif" font-size="14" fill="${accent}" letter-spacing="4">SECUNDARIA · DIGITAL ACADEMY</text>
</svg>`;
}

function courseSvgPreparatoria(slug, c1, c2, accent, title, category, emoji) {
  const uid = slug.replace(/[^a-z0-9]/g, '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="pr${uid}" x1="0" y1="0" x2="800" y2="450">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="40%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="gold${uid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="#FFF"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#pr${uid})"/>
  <pattern id="grid${uid}" width="32" height="32" patternUnits="userSpaceOnUse">
    <path d="M32 0 L0 0 0 32" fill="none" stroke="white" stroke-opacity="0.06"/>
  </pattern>
  <rect width="800" height="450" fill="url(#grid${uid})"/>
  ${preparatoriaDecor(category, accent, emoji)}
  <rect x="36" y="318" width="728" height="96" rx="14" fill="white" fill-opacity="0.08" stroke="url(#gold${uid})" stroke-width="2"/>
  <text x="400" y="365" text-anchor="middle" font-family="Segoe UI,Georgia,sans-serif" font-size="34" font-weight="800" fill="white">${title}</text>
  <text x="400" y="395" text-anchor="middle" font-family="Segoe UI,sans-serif" font-size="13" fill="${accent}" letter-spacing="5">PREPARATORIA</text>
</svg>`;
}

function courseSvgCapacitacion(slug, c1, c2, accent, title, emoji) {
  const uid = slug.replace(/[^a-z0-9]/g, '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="c${uid}" x1="0" y1="0" x2="800" y2="450">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="${c1}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#c${uid})"/>
  ${capacitacionDecor(accent, emoji)}
  <rect x="40" y="318" width="720" height="96" rx="14" fill="white" fill-opacity="0.1"/>
  <text x="400" y="368" text-anchor="middle" font-family="Segoe UI,sans-serif" font-size="32" font-weight="700" fill="white">${title}</text>
  <text x="400" y="398" text-anchor="middle" font-family="monospace" font-size="13" fill="${accent}">TECNOLOGÍA · DIGITAL ACADEMY</text>
</svg>`;
}

function buildCourseSvg(slug, meta) {
  const [c1, c2, accent, title, cat, level, emoji] = meta;
  if (level === 'primaria') return courseSvgPrimaria(slug, c1, c2, accent, title, emoji);
  if (level === 'secundaria') return courseSvgSecundaria(slug, c1, c2, accent, title, cat, emoji);
  if (level === 'preparatoria') return courseSvgPreparatoria(slug, c1, c2, accent, title, cat, emoji);
  return courseSvgCapacitacion(slug, c1, c2, accent, title, emoji);
}

function siteHeroSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">
  <defs>
    <linearGradient id="heroBg" x1="0" y1="0" x2="800" y2="560">
      <stop offset="0%" stop-color="#030712"/>
      <stop offset="50%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E3A8A"/>
    </linearGradient>
    <linearGradient id="heroGlow" x1="400" y1="0" x2="400" y2="400">
      <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#3B82F6" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="screenGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="24"/></filter>
  </defs>
  <rect width="800" height="560" rx="32" fill="url(#heroBg)"/>
  <rect width="800" height="560" rx="32" fill="url(#heroGlow)"/>
  <circle cx="680" cy="100" r="120" fill="#2563EB" opacity="0.12" filter="url(#blur)"/>
  <circle cx="120" cy="480" r="100" fill="#7C3AED" opacity="0.1" filter="url(#blur)"/>
  <g opacity="0.15" stroke="#60A5FA" stroke-width="1">
    <line x1="80" y1="80" x2="200" y2="200"/><line x1="720" y1="120" x2="600" y2="240"/>
    <line x1="400" y1="40" x2="400" y2="160"/><circle cx="200" cy="200" r="4" fill="#60A5FA"/>
    <circle cx="600" cy="240" r="4" fill="#A78BFA"/><circle cx="400" cy="160" r="4" fill="#60A5FA"/>
  </g>
  <!-- Dashboard principal -->
  <rect x="140" y="70" width="520" height="340" rx="20" fill="#111827" stroke="#334155" stroke-width="2"/>
  <rect x="160" y="95" width="480" height="36" rx="8" fill="#1F2937"/>
  <circle cx="180" cy="113" r="6" fill="#EF4444"/><circle cx="200" cy="113" r="6" fill="#F59E0B"/><circle cx="220" cy="113" r="6" fill="#22C55E"/>
  <text x="400" y="118" text-anchor="middle" fill="#94A3B8" font-family="Segoe UI,sans-serif" font-size="12">Digital Academy — Panel de aprendizaje</text>
  <rect x="160" y="145" width="140" height="100" rx="10" fill="#1E293B" stroke="#374151"/>
  <text x="230" y="185" text-anchor="middle" fill="#60A5FA" font-size="28" font-weight="800">98%</text>
  <text x="230" y="210" text-anchor="middle" fill="#94A3B8" font-size="11">Progreso</text>
  <rect x="320" y="145" width="140" height="100" rx="10" fill="#1E293B" stroke="#374151"/>
  <text x="390" y="185" text-anchor="middle" fill="#A78BFA" font-size="28" font-weight="800">24</text>
  <text x="390" y="210" text-anchor="middle" fill="#94A3B8" font-size="11">Cursos</text>
  <rect x="480" y="145" width="160" height="100" rx="10" fill="url(#screenGrad)" opacity="0.85"/>
  <text x="560" y="185" text-anchor="middle" fill="white" font-size="22" font-weight="800">AI</text>
  <text x="560" y="215" text-anchor="middle" fill="#E0E7FF" font-size="11">Asistente 24/7</text>
  <rect x="160" y="265" width="480" height="120" rx="10" fill="#0F172A" stroke="#2563EB" stroke-width="1" stroke-opacity="0.5"/>
  <polyline points="180,350 240,310 300,330 360,280 420,300 480,250 540,270 620,220" fill="none" stroke="#60A5FA" stroke-width="3" stroke-linecap="round"/>
  <circle cx="620" cy="220" r="6" fill="#22C55E"/>
  <text x="180" y="290" fill="#64748B" font-family="monospace" font-size="11">analytics.learn() → success</text>
  <rect x="300" y="420" width="200" height="12" rx="6" fill="#374151"/>
  <rect x="320" y="442" width="160" height="8" rx="4" fill="#1F2937"/>
  <rect x="60" y="430" width="100" height="36" rx="18" fill="#2563EB" opacity="0.2"/>
  <text x="110" y="453" text-anchor="middle" fill="#93C5FD" font-size="11" font-weight="700">EDTECH</text>
  <rect x="640" y="430" width="100" height="36" rx="18" fill="#7C3AED" opacity="0.2"/>
  <text x="690" y="453" text-anchor="middle" fill="#C4B5FD" font-size="11" font-weight="700">FUTURO</text>
</svg>`;
}

function findAsset(partial) {
  for (const dir of ASSET_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const hit = fs.readdirSync(dir).find(f => f.includes(partial));
    if (hit) return path.join(dir, hit);
  }
  return null;
}

/** Quita fondo blanco, gris y cuadrícula — solo el animal en PNG transparente */
async function pngWithoutBackground(srcPath, outPath, maxHeight = 220) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const spread = maxC - minC;
    const avg = (r + g + b) / 3;
    let alpha = data[i + 3];

    if (avg > 252 && spread < 20) {
      alpha = 0;
    } else if (spread < 32 && avg > 118) {
      // Blanco, gris claro y líneas de cuadrícula pixel-art
      alpha = Math.min(alpha, Math.max(0, Math.round(255 - (avg - 108) * 3.8)));
    } else if (avg > 218 && spread < 40) {
      alpha = Math.min(alpha, Math.max(0, 255 - (avg - 195) * 10));
    }

    data[i + 3] = alpha;
  }

  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 15 })
    .resize({ height: maxHeight, fit: 'inside' })
    .png({ compressionLevel: 9, force: true })
    .toFile(outPath);
}

let sharp;

async function svgToPng(svg, outPath, w, h) {
  await sharp(Buffer.from(svg)).resize(w, h).png({ compressionLevel: 9 }).toFile(outPath);
}

async function main() {
  try { sharp = require('sharp'); } catch {
    console.error('Ejecuta: npm install sharp');
    process.exit(1);
  }

  console.log('Mascotas PNG...');
  for (const [name, partial] of PET_REFS) {
    const src = findAsset(partial);
    if (!src) { console.warn(`  ⚠ ${name}`); continue; }
    fs.copyFileSync(src, path.join(dirs.pets, `${name}.png`));
    console.log(`  ✓ ${name}.png`);
  }

  console.log('Generando portadas por nivel...');
  for (const [slug, meta] of Object.entries(COURSES)) {
    await svgToPng(buildCourseSvg(slug, meta), path.join(dirs.courses, `${slug}.png`), 800, 450);
  }

  console.log('Listo.');
}

main().catch(err => { console.error(err); process.exit(1); });
