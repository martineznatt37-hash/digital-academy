# Render — arreglar error 127

Todos los deploys fallan porque el **Build Command** en Render está mal configurado.

## Opción A — Docker (recomendada, más fácil)

1. Entra a tu servicio **digital-academy** en Render
2. **Settings** → baja hasta **Runtime**
3. Cambia de **Node** a **Docker**
4. Pon:
   - **Dockerfile Path:** `server/Dockerfile`
   - **Docker Context:** `server`
5. **Save Changes**
6. **Manual Deploy → Deploy latest commit**

## Opción B — Node (si prefieres no usar Docker)

En **Settings**:

| Campo | Valor exacto |
|--------|----------------|
| **Root Directory** | `server` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

Borra cualquier otro texto en Build Command (sin `&&`, sin `npm run build` extra).

Luego **Manual Deploy → Deploy latest commit**.

## Variables de entorno (pestaña Environment)

- `JWT_SECRET` = texto largo cualquiera
- `GEMINI_API_KEY` = tu clave de Gemini

## Probar

https://digital-academy-e5qd.onrender.com/api/health
