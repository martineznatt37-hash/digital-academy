# Publicar Digital Academy — casi automático
# Ejecuta:  powershell -ExecutionPolicy Bypass -File scripts\publicar-todo.ps1

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

Write-Host "`n=== Digital Academy — Publicacion ===" -ForegroundColor Cyan
Write-Host "Carpeta: $Root`n"

# 1. Preparar carpeta limpia para Netlify
$Out = Join-Path $Root "dist-netlify"
if (Test-Path $Out) { Remove-Item $Out -Recurse -Force }
New-Item -ItemType Directory -Path $Out | Out-Null

$Include = @(
  "*.html", "css", "js", "images", "netlify.toml", "_redirects"
)
$ExcludeDirs = @("server", "node_modules", "escape-app", "docs", "scripts", ".git", ".cursor", "dist-netlify", "terminals")

Get-ChildItem $Root -File -Include *.html | Copy-Item -Destination $Out
Copy-Item "$Root\netlify.toml" $Out -ErrorAction SilentlyContinue
foreach ($dir in @("css", "js", "images")) {
  if (Test-Path "$Root\$dir") { Copy-Item "$Root\$dir" $Out -Recurse }
}

Write-Host "[OK] Carpeta dist-netlify lista" -ForegroundColor Green

# 2. Crear ZIP para Netlify Drop
$Zip = Join-Path $Root "digital-academy-netlify.zip"
if (Test-Path $Zip) { Remove-Item $Zip -Force }
Compress-Archive -Path "$Out\*" -DestinationPath $Zip -Force
Write-Host "[OK] ZIP creado: digital-academy-netlify.zip" -ForegroundColor Green

# 3. Netlify CLI — login y deploy
Write-Host "`n--- NETLIFY (frontend) ---" -ForegroundColor Yellow
Write-Host "Se abrira el navegador para iniciar sesion en Netlify (solo la primera vez).`n"

Set-Location $Root
npx --yes netlify-cli login
if ($LASTEXITCODE -ne 0) { Write-Host "Login cancelado. Usa Netlify Drop: arrastra digital-academy-netlify.zip a https://app.netlify.com/drop" -ForegroundColor Red; exit 1 }

$SiteId = "8ca59a9a-a295-4e01-af0a-08a4094ec340"
Write-Host "Desplegando a Netlify..."
npx --yes netlify-cli deploy --prod --dir dist-netlify --site $SiteId

if ($LASTEXITCODE -eq 0) {
  Write-Host "`n[OK] Frontend publicado en Netlify!" -ForegroundColor Green
  npx --yes netlify-cli open:site
} else {
  Write-Host "`nAlternativa: arrastra digital-academy-netlify.zip a https://app.netlify.com/drop" -ForegroundColor Yellow
}

# 4. Render (backend)
Write-Host "`n--- RENDER (backend / API) ---" -ForegroundColor Yellow
Write-Host @"

El backend (login, chat, cursos) necesita Render + GitHub:

1. Sube el proyecto a GitHub (github.com/new)
2. Entra a https://dashboard.render.com/select-repo?type=web
3. Conecta el repo, Root Directory: server, Start: npm start
4. Cuando tengas la URL (ej. https://digital-academy-api.onrender.com),
   edita netlify.toml linea del redirect /api/* con esa URL.

Abriendo Render ahora...
"@

Start-Process "https://dashboard.render.com/select-repo?type=web"
Start-Process "https://github.com/new"

Write-Host "`nListo. Revisa COMO-PUBLICAR-NETLIFY.md para mas detalle.`n" -ForegroundColor Cyan
