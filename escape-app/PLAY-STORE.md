# Escape del Hacker → Google Play Store

Tu juego ya está empaquetado como app Android en la carpeta **`escape-app`**.

ID de la app: `com.digitalacademy.escapedelhacker`  
Nombre: **Escape del Hacker**

---

## Lo que necesitas (una sola vez)

1. **Android Studio** (gratis)  
   https://developer.android.com/studio  
   Al instalarlo, marca **Android SDK**.

2. **Cuenta de desarrollador de Google Play** (~25 USD, pago único)  
   https://play.google.com/console/signup

---

## Pasos para generar el archivo de Play Store (.aab)

### 1) Actualizar el juego dentro de la app
En PowerShell:

```powershell
cd C:\Users\marti\OneDrive\Desktop\digital-academy\escape-app
npm run copy-web
npx cap sync android
```

### 2) Abrir el proyecto Android
```powershell
npx cap open android
```
Se abre Android Studio.

### 3) Crear keystore (firma de la app — guárdalo bien)
En Android Studio o con esta idea:

- Menú **Build → Generate Signed Bundle / APK**
- Elige **Android App Bundle**
- Create new keystore (anota contraseñas y alias)
- Guarda el `.jks` en un lugar seguro (si lo pierdes, no podrás actualizar la app)

### 4) Generar el Bundle
- Build variant: **release**
- Genera el `.aab`  
  Normalmente queda en:  
  `escape-app\android\app\release\app-release.aab`

---

## Subir a Play Store

1. Entra a https://play.google.com/console
2. **Crear app** → nombre: Escape del Hacker → gratis → juego
3. Completa:
   - Ficha de Play Store (texto, ícono 512×512, capturas del celular)
   - Clasificación de contenido
   - Público objetivo
   - Política de privacidad (puedes poner una página simple: “Este juego no recopila datos personales”)
4. En **Producción** (o prueba interna) → **Crear versión** → sube el `.aab`
5. Envía a revisión

Google suele tardar desde horas hasta unos días.

---

## Importante

- Play Store **no** acepta una carpeta HTML; acepta el `.aab` que genera Android Studio.
- Esto **sí** es una app instalable normal desde Play Store.
- La cuenta de Google Play y la revisión las haces tú (yo no puedo publicar por tu cuenta).
- Si cambias el código del juego, vuelve a correr `npm run copy-web` + `npx cap sync android` y genera otro `.aab` con **versionCode** más alto.

Para subir `versionCode` edita:
`escape-app\android\app\build.gradle` → `versionCode` y `versionName`.
