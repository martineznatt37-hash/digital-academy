# Render — configuración exacta para digital-academy

En Render → tu servicio **digital-academy** → **Settings**:

| Campo | Valor |
|--------|--------|
| **Root Directory** | *(déjalo vacío)* |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Node Version** | `22` (o dejar automático) |

**Environment Variables** (pestaña Environment):
- `JWT_SECRET` = cualquier texto largo (ej. mi-secreto-2026)
- `GEMINI_API_KEY` = tu clave de Gemini (la de server/.env)

Luego: **Manual Deploy → Deploy latest commit**

Probar: https://digital-academy-e5qd.onrender.com/api/health
