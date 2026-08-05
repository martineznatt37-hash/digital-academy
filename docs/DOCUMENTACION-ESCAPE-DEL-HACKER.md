# Documentación del proyecto — Escape del Hacker 2.0

**Universidad Azteca · Ingeniería en Sistemas Computacionales**  
**Tipo:** Interfaz gráfica / juego web educativo  
**Nombre:** Escape del Hacker 2.0

---

## 1. ¿Qué es el proyecto?

*Escape del Hacker* es un juego web donde el jugador es teletransportado a un sistema hackeado y debe escapar nivel por nivel. En cada nivel enfrenta un tipo de malware, recoge llaves, evita enemigos y llega a la puerta de salida. Algunos niveles incluyen pelea contra un jefe.

El objetivo académico es demostrar:

- Interfaz atractiva y usable en PC y móvil  
- Funcionalidades completas (registro, juego, progreso)  
- Arquitectura escalable (frontend + API + datos)  
- Código documentado y demostración clara  

---

## 2. Problema / necesidad

Muchas personas conocen palabras como *virus* o *ransomware*, pero no visualizan cómo “se siente” estar dentro de un sistema atacado. Este juego:

1. Enseña conceptos de malware de forma lúdica (un malware por nivel).  
2. Motiva con personajes, habilidades y puntuación.  
3. Funciona en cualquier dispositivo con un enlace (Netlify).  
4. Guarda cuentas y progreso con un servidor en la nube (Render).  

---

## 3. Qué se construyó (resumen de trabajo)

| Etapa | Qué se hizo |
|---|---|
| Concepto | Tema ciberseguridad / infiltración |
| Interfaz | Login, menú, selección de personajes, HUD, intros |
| Gameplay | 10 niveles, llaves, muros, enemigos, jefes, habilidades |
| Arte | Sprites de personajes, malware, NPC “El Hacker” |
| Audio | Música/SFX tipo chiptune |
| Responsive | Controles táctiles en teléfono; teclado en PC |
| Backend | API registro/login/guardar progreso |
| Deploy | Frontend en Netlify, API en Render, código en GitHub |

---

## 4. Arquitectura del sistema

```
[ Jugador: PC / Celular / Tablet ]
              |
              v
     Netlify (frontend)
   escape-public/index.html
   + assets (imágenes)
              |
              |  HTTPS  ?api=...
              v
     Render (backend Node/Express)
        /api/escape/*
              |
              v
     SQLite (escape_players)
```

### Separación de responsabilidades

- **Frontend:** dibuja el juego, lee teclado/touch, llama a la API.  
- **Backend:** valida usuarios, hashea contraseñas, guarda progreso.  
- **Base de datos:** tabla `escape_players` (usuario, hash, récord, nivel máx.).  

Esto permite crecer: nuevos niveles en el cliente, nuevas rutas en el servidor, sin rehacer todo.

---

## 5. Estructura de archivos del juego

```
Escape-Del-Hacker/
├── juego/                 → código fuente (HTML + assets)
├── escape-public/         → listo para Netlify
├── server/                → API para Render
│   └── routes/escape.js   → login / registro / save
└── docs/                  → esta documentación
```

Archivos clave:

- `escape-del-hacker.html` — UI + lógica + canvas  
- `server/routes/escape.js` — API de cuentas  
- `server/server.js` — arranque Express  
- `assets/` — gráficos  

---

## 6. Funcionalidades principales

1. **Registro / Login** con usuario y contraseña  
2. **Selección de personaje** (habilidad y arma distintas)  
3. **10 niveles** con malware y tema visual propio  
4. **Mecánicas:** llaves, puerta, láseres, firewalls, código fantasma, jefes  
5. **Controles:** teclado (PC) o D-pad + habilidad (móvil)  
6. **Progreso:** récord y nivel máximo sincronizable por API  
7. **Publicación web** accesible desde cualquier dispositivo  

*(En la rúbrica, estos puntos equivalen a las “funciones clave” del sistema.)*

---

## 7. Escalabilidad

Cómo se puede ampliar sin reescribir el núcleo:

| Idea nueva | Dónde se agrega |
|---|---|
| Nivel 11+ | Objeto en arreglo `niveles[]` |
| Personaje nuevo | Objeto en `personajes[]` + PNG |
| Ranking global | Nueva ruta `/api/escape/ranking` + tabla |
| Tienda de skins | Nuevo módulo API + UI |
| App Android | Capacitor sobre el mismo frontend |

---

## 8. Tecnologías usadas

- HTML5, CSS3, JavaScript (Canvas 2D)  
- Node.js + Express  
- SQLite (`node:sqlite`)  
- bcrypt + JWT  
- Netlify (hosting estático)  
- Render (API)  
- GitHub (control de versiones)  

---

## 9. Cómo publicar / demostrar

1. Subir carpeta `escape-public` a Netlify.  
2. Tener el servidor en Render.  
3. Abrir:  
   `https://TU-SITIO.netlify.app/?api=https://escape-del-hacker.onrender.com/api/escape`  
4. Registrarse → jugar un nivel → entrar desde otro dispositivo.  

Detalle paso a paso: `COMO-PUBLICAR-ESCAPE.md`.

---

## 10. Beneficios para el usuario final

- Jugar sin instalar programas pesados (solo navegador).  
- Continuar partida/cuenta en otro aparato.  
- Aprender tipos de malware de forma visual.  
- Experiencia con controles claros en PC y celular.  

---

## 11. Conclusión

Se entregó un sistema completo de interfaz gráfica con juego funcional, despliegue multiplataforma y backend de cuentas. La arquitectura cliente–servidor y los datos configurables (niveles/personajes) respaldan la escalabilidad exigida en la rúbrica.
