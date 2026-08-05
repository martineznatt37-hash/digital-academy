# Permite acceso al servidor Digital Academy desde otros dispositivos en la red local.
# Ejecutar PowerShell como Administrador:
#   Set-ExecutionPolicy -Scope Process Bypass
#   .\scripts\allow-mobile-access.ps1

$ruleName = "Digital Academy (puerto 3001)"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

if ($existing) {
  Write-Host "La regla de firewall ya existe: $ruleName"
} else {
  New-NetFirewallRule -DisplayName $ruleName `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 3001 `
    -Profile Private, Domain `
    | Out-Null
  Write-Host "Regla de firewall creada: $ruleName"
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike '127.*' -and
    $_.IPAddress -notlike '169.254.*' -and
    $_.InterfaceAlias -notmatch 'VMware|VirtualBox|vEthernet|WSL|Bluetooth'
  } |
  Sort-Object { if ($_.InterfaceAlias -match 'Wi-Fi|WiFi|WLAN') { 0 } else { 1 } } |
  Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "Abre en tu celular (misma WiFi): http://${ip}:3001"
Write-Host ""
