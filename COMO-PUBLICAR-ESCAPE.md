# Cómo publicar Escape del Hacker (web + app)

Ya tienes una carpeta lista para subir: **`escape-public`**.

Esa carpeta incluye el juego, imágenes, ícono y modo app (PWA).

## Opción más fácil: Netlify Drop (gratis, sin cuenta técnica)

1. Abre en la PC: [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Arrastra la carpeta **`escape-public`** a la página.
3. Netlify te da un enlace, por ejemplo:  
   `https://algo-random.netlify.app`
4. Abre ese enlace en el celular.

### Instalar como app en el teléfono

**Android (Chrome)**  
1. Abre el enlace.  
2. Menú ⋮ → **Instalar aplicación** / **Agregar a pantalla de inicio**.

**iPhone (Safari)**  
1. Abre el enlace en Safari.  
2. Botón Compartir → **Añadir a pantalla de inicio**.

Así queda con ícono como una app.

## Opción 2: GitHub Pages

1. Crea un repositorio en GitHub.
2. Sube el contenido de `escape-public`.
3. Activa Pages en Settings → Pages (branch `main`, carpeta `/`).
4. Usa la URL que te den.

## Actualizar el juego después de cambios

1. Copia de nuevo `escape-del-hacker.html` a `escape-public/index.html`
2. Si cambiaste imágenes, vuelve a copiar `assets` a `escape-public/assets`
3. Vuelve a arrastrar `escape-public` a Netlify Drop (o vuelve a publicar)

## Importante

- En el celular **no** se abre la carpeta de OneDrive: se abre el **enlace** de internet.
- Para instalar como app hace falta **HTTPS** (Netlify y GitHub Pages ya lo dan).

## Misma cuenta en PC y celular (servidor en la nube)

Netlify solo hospeda el juego. Para que **usuario/contraseña/récord** sean los mismos en todos lados, publica también el backend (`server/`).

### Opción fácil: Render (gratis)

1. Crea cuenta en [https://render.com](https://render.com)
2. **New → Web Service**
3. Conecta tu repo de GitHub (sube la carpeta `server` o todo el proyecto)
4. Configura:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance:** Free
5. En **Environment** agrega:
   - `PORT` = `10000` (o el que Render asigne; tu `server.js` ya usa `process.env.PORT`)
   - `JWT_SECRET` = un texto secreto largo
6. Deploy. Al terminar te dan una URL, por ejemplo:  
   `https://digital-academy-xxxx.onrender.com`
7. Prueba en el navegador:  
   `https://TU-URL.onrender.com/api/health`  
   Debe responder OK.

### Conectar el juego de Netlify con ese servidor

1. Vuelve a subir `escape-public` a Netlify (ya soporta API remota).
2. Abre el juego **una vez** con este formato (cambia la URL):

```
https://TU-SITIO.netlify.app/?api=https://TU-URL.onrender.com/api/escape
```

3. El juego guarda esa API. Luego puedes abrir el link normal de Netlify y seguirá usando el servidor.
4. En **REGISTRO**, crea la cuenta otra vez en la nube (la de tu PC local no se copia sola).
5. Entra desde el celular con el mismo usuario: ya es la misma cuenta.

### Notas

- En el plan gratis de Render el servidor se “duerme”; la primera vez puede tardar 30–60 s.
- Sin servidor en la nube, Netlify igual deja jugar, pero la cuenta es solo de ese navegador.
