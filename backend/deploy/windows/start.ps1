# Запуск сервера и туннеля. Планировщик вызывает его по будням в 10:00 и при входе в Windows.
# Вне часов работы ничего не делает (например, вход в систему в субботу). -Force — запустить всё равно.
param([switch]$Force)
. (Join-Path $PSScriptRoot 'common.ps1')

$settings = Import-CardLessonEnv
if (-not $Force -and -not (Test-ServerHours $settings)) {
  Write-CardLessonLog 'start: вне часов работы, пропуск'
  exit 0
}
if (-not (Test-Path $ExePath)) {
  throw "Нет $ExePath — сначала запусти build.ps1."
}

if (Get-CardLessonProcess) {
  Write-CardLessonLog 'start: сервер уже запущен'
} else {
  $dataDir = Get-DataDir
  Start-Process -FilePath $ExePath -ArgumentList 'serve' -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $dataDir 'server.log') `
    -RedirectStandardError (Join-Path $dataDir 'server.err.log')
  Write-CardLessonLog "start: сервер запущен на $env:CARDLESSON_ADDR"
}

$port = $env:CARDLESSON_ADDR.Split(':')[-1]
switch ($settings['CARDLESSON_TUNNEL']) {
  'tailscale' {
    # --bg: Funnel держит сам tailscaled; адрес постоянный — https://<имя-пк>.<tailnet>.ts.net
    & $Tailscale funnel --bg $port | Out-Null
    Write-CardLessonLog 'start: Tailscale Funnel включён'
  }
  'cloudflared' {
    if (-not (Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue)) {
      Start-Process -FilePath 'cloudflared' -WindowStyle Hidden `
        -ArgumentList @('tunnel', 'run', $settings['CLOUDFLARED_TUNNEL_NAME'])
      Write-CardLessonLog 'start: Cloudflare Tunnel запущен'
    }
  }
  default { Write-CardLessonLog 'start: туннель не используется' }
}
