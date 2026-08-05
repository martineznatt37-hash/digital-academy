# Publicar Digital Academy en Netlify

Tu plataforma tiene **dos partes**:

| Parte | Dónde | Qué hace |
|-------|--------|----------|
| **Frontend** (HTML, CSS, JS) | **Netlify** | La página que ven los usuarios |
| **Backend** (API, login, chat, BD) | **Render** (gratis) | Datos, cuentas, cursos |

Netlify solo sirve archivos estáticos. El servidor Node.js va en Render.

---

## Paso 1 — Subir el proyecto a GitHub

1. Crea un repositorio en [github.com/new](https://github.com/new) (ej. `digital-academy`).
2. En PowerShell, desde la carpeta del proyecto:

```powershell
cd C:\Users\marti\OneDrive\Desktop\digital-academy
git init
git add .
git commit -m "Digital Academy - listo para publicar"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/digital-academy.git
git push -u origin main
```

(Sustituye `TU-USUARIO` por tu usuario de GitHub.)

---

## Paso 2 — Backend en Render (API)

1. Entra a [render.com](https://render.com) e inicia sesión (puedes usar GitHub).
2. **New +** → **Web Service** → conecta el repo `digital-academy`.
3. Configura:
   - **Name:** `digital-academy-api`
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free
4. En **Environment Variables** agrega:
   - `JWT_SECRET` → cualquier texto largo secreto
   - `GEMINI_API_KEY` → tu clave de Gemini (opcional, para el chat IA)
5. Clic en **Create Web Service** y espera 5–10 minutos.
6. Copia la URL, algo como: `https://digital-academy-api.onrender.com`

7. Abre `netlify.toml` en el proyecto y, si tu URL de Render es distinta, cambia la línea:
   ```toml
   to = "https://digital-academy-api.onrender.com/api/:splat"
   ```

---

## Paso 3 — Frontend en Netlify

1. Entra a [app.netlify.com](https://app.netlify.com).
2. **Add new site** → **Import an existing project** → **GitHub**.
3. Elige el repo `digital-academy`.
4. Netlify detectará `netlify.toml`. No cambies nada:
   - **Publish directory:** `.` (raíz)
5. **Deploy site**.

En 1–2 minutos tendrás una URL como: `https://algo-random.netlify.app`

---

## Paso 4 — Probar

1. Abre tu URL de Netlify.
2. Prueba login demo: `demo@digitalacademy.com` / `demo1234`
3. Admin: `admin@gmail.com` / `1234`

Si el login no funciona, espera 1 minuto (Render en plan gratis “despierta” lento la primera vez).

---

## Comandos útiles (Netlify CLI)

Si tienes [Netlify CLI](https://docs.netlify.com/cli/get-started/) instalado:

```powershell
npm install -g netlify-cli
netlify login
cd C:\Users\marti\OneDrive\Desktop\digital-academy
netlify deploy --prod
```

---

## Notas

- **Render gratis:** el servidor se duerme tras inactividad; la primera carga puede tardar ~30 s.
- **Base de datos:** en Render gratis los datos pueden resetearse al redeploy; para producción real usa disco persistente o PostgreSQL.
- **Dominio propio:** en Netlify → Domain settings puedes conectar tu dominio.
